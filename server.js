const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// @remotion/renderer provides getVideoMetadata for server-side duration probing
let getVideoMetadata;
try {
  ({ getVideoMetadata } = require('@remotion/renderer'));
} catch (e) {
  // Fallback: if not available, we'll use hardcoded defaults
  getVideoMetadata = null;
}


const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
// Serve original and character assets via HTTP (Remotion Chromium needs absolute HTTP URLs)
app.use('/original', express.static(path.join(__dirname, 'original')));
app.use('/character', express.static(path.join(__dirname, 'character')));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getFileMetadata(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return { exists: true, size: stats.size, name: path.basename(filePath) };
  } catch (e) {
    return { exists: false };
  }
}

function scanDirectory(dirPath, allowedExts = []) {
  try {
    if (!fs.existsSync(dirPath)) return [];
    return fs.readdirSync(dirPath)
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return allowedExts.length === 0 || allowedExts.includes(ext);
      })
      .map(file => {
        const fullPath = path.join(dirPath, file);
        const stats = fs.statSync(fullPath);
        return {
          name: file,
          relativePath: path.relative(__dirname, fullPath).replace(/\\/g, '/'),
          size: stats.size
        };
      });
  } catch (e) {
    console.error(`Error scanning ${dirPath}:`, e);
    return [];
  }
}

// Convert a relative asset path to an absolute HTTP URL served by this Express server
function toHttpUrl(p) {
  if (!p) return p;
  if (p.startsWith('http')) return p;
  const clean = p.replace(/\\/g, '/').replace(/^\.?\/?/, '');
  return `http://localhost:${PORT}/${clean}`;
}

// ─── Parse rules.txt ──────────────────────────────────────────────────────────

function parseRules() {
  const rulesPath = path.join(__dirname, 'rules.txt');
  if (!fs.existsSync(rulesPath)) {
    return { error: 'rules.txt not found', hooksOnScreen: [], hooksOutLoud: [], mandatoryTags: [], ctaRules: [] };
  }

  const content = fs.readFileSync(rulesPath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim());

  const hooksOnScreen = [];
  const hooksOutLoud = [];
  const mandatoryTags = ['#contentrewardspartner'];

  // Arabic translation map for hooks extracted from rules.txt
  const hookTranslations = {
    "Making a doctor salary in 67 mins": "تحقيق راتب طبيب في 67 دقيقة",
    "POV: making 1.2k in a class challenge": "POV: تحقيق 1.2 ألف في تحدي الفصل",
    "Making a lawyer salary while working out": "تحقيق راتب محامٍ أثناء ممارسة الرياضة",
    "Making a doctor's salary without speaking (watch me cook)": "تحقيق راتب طبيب بدون كلام (شاهد إبداعي)",
    "Making 1.7k eating pretzels": "تحقيق 1.7 ألف أثناء تناول البسكويت المالح",
    "They said I didn't have enough for gas... little do they know": "قالوا ليس لدي ما يكفي للبنزين... إنهم لا يعرفون شيئاً",
    "Today we're gonna...": "اليوم سنقوم بـ...",
    "How fast can we...": "ما مدى سرعة...",
    "I've never done this before...": "لم أفعل هذا من قبل..."
  };

  const ctaRules = [
    "قل الكلمة المفتاحية بصوت عالٍ واعرضها على الشاشة (مثال: 'اكتب كلمة LINK للحصول على الرابط')",
    "استخدم نظام التعليقات للإرسال في الخاص (ManyChat لـ IG/TT و CommentShark لـ YT)",
    "وضع رابط الإحالة الخاص بك في بايو الحساب إلزامي"
  ];

  let currentSection = '';
  for (const line of lines) {
    if (line.includes('**On screen**')) { currentSection = 'screen'; continue; }
    else if (line.includes('**Out loud**')) { currentSection = 'outloud'; continue; }
    else if (line.includes('**On camera**') || line.startsWith('Rules')) { currentSection = ''; }

    if (currentSection === 'screen' && line.startsWith('- "')) {
      const match = line.match(/- "([^"]+)"/);
      if (match) hooksOnScreen.push(hookTranslations[match[1]] || match[1]);
    } else if (currentSection === 'outloud' && line.startsWith('- "')) {
      const match = line.match(/- "([^"]+)"/);
      if (match) hooksOutLoud.push(hookTranslations[match[1]] || match[1]);
    }
  }

  return { hooksOnScreen, hooksOutLoud, mandatoryTags, ctaRules };
}

// ─── API: Analyze ─────────────────────────────────────────────────────────────

app.get('/api/analyze', (req, res) => {
  const originalVideos = scanDirectory(path.join(__dirname, 'original', 'videos'), ['.mp4']);
  const characterVideos = scanDirectory(path.join(__dirname, 'character', 'videos'), ['.mp4']);
  const characterPhotos = scanDirectory(path.join(__dirname, 'character', 'photos'), ['.jpg', '.jpeg', '.png']);
  const characterSounds = scanDirectory(path.join(__dirname, 'character', 'sounds'), ['.mp3', '.wav']);
  const characterTemplates = scanDirectory(path.join(__dirname, 'character', 'templates'), ['.mp4']);

  const rules = parseRules();

  const checklist = {
    originalVideosPresent: originalVideos.length > 0,
    hookTemplatesPresent: characterVideos.length > 0 || originalVideos.length > 0,
    payoutTemplatePresent: characterTemplates.some(t => t.name.includes('postitandgetpaid')),
    signupTemplatePresent: characterTemplates.some(t => t.name.includes('signup')),
    gotoRewardsTemplatePresent: characterTemplates.some(t => t.name.includes('gotocontentrewards')),
    campaignTemplatePresent: characterTemplates.some(t => t.name.includes('findcampain')),
    editVideoTemplatePresent: characterTemplates.some(t => t.name.includes('edityourvideo')),
    cashSoundPresent: characterSounds.some(s => s.name.includes('cash')),
    keyboardSoundPresent: characterSounds.some(s => s.name.includes('keyboard')),
    rulesFilePresent: !rules.error
  };

  const totalChecks = Object.keys(checklist).length;
  const passedChecks = Object.values(checklist).filter(Boolean).length;
  const isReady = passedChecks === totalChecks;

  res.json({
    success: true,
    isReady,
    passedChecks,
    totalChecks,
    checklist,
    assets: { originalVideos, characterVideos, characterPhotos, characterSounds, characterTemplates },
    rules
  });
});

// ─── API: Generate ────────────────────────────────────────────────────────────

app.post('/api/generate', async (req, res) => {
  const { hookVideoPath, hookText, ctaText, keyboardSoundPath, cashSoundPath, randomOverlayText, referralLink } = req.body;

  if (!hookVideoPath || !hookText) {
    return res.status(400).json({ success: false, error: 'مسار الفيديو ونص الخطاف مطلوبان' });
  }

  // Helper to get real duration of a video file in seconds
  async function getDuration(filePath, fallback) {
    try {
      if (getVideoMetadata) {
        const meta = await getVideoMetadata({ src: filePath });
        return meta.durationInSeconds;
      }
    } catch (e) {
      console.warn(`Could not get duration for ${filePath}, using fallback ${fallback}s`);
    }
    return fallback;
  }

  // Measure real template durations from disk
  const templatesDir = path.join(__dirname, 'character', 'templates');
  const sceneDurations = {
    hook: 4.0,
    rewards: await getDuration(path.join(templatesDir, 'gotocontentrewards.mp4'), 5.0),
    signUp: await getDuration(path.join(templatesDir, 'signup.mp4'), 5.0),
    findCampaign: await getDuration(path.join(templatesDir, 'findcampainandjoin.mp4'), 6.0),
    editVideo: await getDuration(path.join(templatesDir, 'edityourvideo.mp4'), 4.0),
    getPaid: await getDuration(path.join(templatesDir, 'postitandgetpaid.mp4'), 5.0),
    outro: 4.0,
  };

  console.log('Measured scene durations:', sceneDurations);

  // Build input props with absolute HTTP URLs so Remotion's Chromium renderer can fetch them
  const inputConfig = {
    hookVideoPath: toHttpUrl(hookVideoPath),
    hookText,
    ctaText: ctaText || "اكتب تعليقاً كلمة LINK للحصول على الرابط!",
    keyboardSoundPath: toHttpUrl(keyboardSoundPath) || `http://localhost:${PORT}/character/sounds/keyboard1.mp3`,
    cashSoundPath: toHttpUrl(cashSoundPath) || `http://localhost:${PORT}/character/sounds/cash1.mp3`,
    randomOverlayText: randomOverlayText || "",
    referralLink: referralLink || "contentrewards.com/ref",
    tag: "#contentrewardspartner",
    sceneDurations,
  };

  const publicDir = path.join(__dirname, 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

  // Write the props file — Remotion reads it via --props flag
  const propsFilePath = path.join(publicDir, 'props.json');
  fs.writeFileSync(propsFilePath, JSON.stringify(inputConfig, null, 2), 'utf-8');
  console.log('Props written to:', propsFilePath);

  const outputPath = path.join(publicDir, 'output.mp4').replace(/\\/g, '/');
  const propsFileUrl = propsFilePath.replace(/\\/g, '/');

  // --props accepts a JSON file path on Remotion v4
  const command = `npx.cmd remotion render src/Root.tsx VideoComposition "${outputPath}" --props="${propsFileUrl}" --overwrite --log=verbose`;

  console.log('Running:', command);

  exec(command, { timeout: 300000 }, (error, stdout, stderr) => {
    if (error) {
      console.error('Render error:', error.message);
      console.error('STDERR:', stderr);
      return res.status(500).json({
        success: false,
        error: 'فشل توليد الفيديو',
        details: (stderr || error.message || '').slice(0, 3000)
      });
    }

    console.log('Render complete!');
    res.json({ success: true, message: 'تم توليد الفيديو بنجاح!', videoUrl: '/output.mp4', log: stdout });
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`UGC Video Generator running at http://localhost:${PORT}`);
});
