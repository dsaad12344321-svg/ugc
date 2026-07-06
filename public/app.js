document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const btnAnalyze = document.getElementById('btn-analyze');
  const btnGenerate = document.getElementById('btn-generate');
  const btnDownload = document.getElementById('btn-download');

  const checklistGrid = document.getElementById('analysis-checklist');
  const analysisSummary = document.getElementById('analysis-summary');
  const analysisProgressVal = document.getElementById('analysis-progress-val');
  const analysisProgressBar = document.getElementById('analysis-progress-bar');
  const analysisAlert = document.getElementById('analysis-alert');

  const configCard = document.getElementById('config-card');
  const selectHookVideo = document.getElementById('hook-video');
  const selectHookPreset = document.getElementById('hook-text-preset');
  const inputHookTextText = document.getElementById('hook-text');
  const inputRandomOverlayText = document.getElementById('random-overlay');
  const selectKeyboardSound = document.getElementById('keyboard-sound');
  const selectCashSound = document.getElementById('cash-sound');
  const inputCtaText = document.getElementById('cta-text');
  const inputReferralLink = document.getElementById('referral-link');

  const videoWrapper = document.getElementById('video-wrapper');
  const renderLoader = document.getElementById('render-loader');
  const downloadBox = document.getElementById('download-box');
  const logsCard = document.getElementById('logs-card');
  const logOutput = document.getElementById('log-output');

  // Trigger scan on load
  runAnalysis();

  // Button Listeners
  btnAnalyze.addEventListener('click', runAnalysis);
  btnGenerate.addEventListener('click', generateVideo);

  // Sync Preset Hook select to custom input text
  selectHookPreset.addEventListener('change', (e) => {
    if (e.target.value) {
      inputHookTextText.value = e.target.value;
    }
  });

  // Run directory analysis and rule comparison
  async function runAnalysis() {
    btnAnalyze.disabled = true;
    btnAnalyze.innerHTML = '<i data-lucide="refresh-cw" class="spin"></i> جاري التحليل...';
    lucide.createIcons();

    try {
      const response = await fetch('/api/analyze');
      const data = await response.json();

      if (data.success) {
        renderChecklist(data.checklist);
        populateConfigOptions(data.assets, data.rules);

        // Update progress bar
        analysisSummary.style.display = 'flex';
        analysisProgressVal.textContent = `${data.passedChecks}/${data.totalChecks}`;
        const pct = (data.passedChecks / data.totalChecks) * 100;
        analysisProgressBar.style.width = `${pct}%`;

        // Card activation logic
        if (data.isReady) {
          configCard.classList.remove('disabled-card');
          enableFormControls(true);

          analysisAlert.className = 'alert alert-success';
          analysisAlert.innerHTML = `
            <i data-lucide="check-circle-2"></i>
            <div>
              <strong>الحملة جاهزة للتوليد!</strong> تم العثور على جميع الملفات المطلوبة وتوافقها مع شروط الحملة.
            </div>
          `;
        } else {
          configCard.classList.add('disabled-card');
          enableFormControls(false);

          analysisAlert.className = 'alert alert-warning';
          analysisAlert.innerHTML = `
            <i data-lucide="alert-triangle"></i>
            <div>
              <strong>شروط غير مكتملة!</strong> بعض ملفات القوالب أو المؤثرات الصوتية مفقودة أو غير مطابقة للمطلوب.
            </div>
          `;
        }
        lucide.createIcons();
      } else {
        showConsoleLog('فشل التحليل: ' + (data.error || 'خطأ غير معروف'));
      }
    } catch (error) {
      console.error(error);
      showConsoleLog('خطأ في الاتصال أثناء التحليل: ' + error.message);
    } finally {
      btnAnalyze.disabled = false;
      btnAnalyze.innerHTML = '<i data-lucide="refresh-cw"></i> فحص وتحليل';
      lucide.createIcons();
    }
  }

  // Render checklist status cards
  function renderChecklist(checklist) {
    checklistGrid.innerHTML = '';

    const items = [
      { key: 'rulesFilePresent', label: 'تم قراءة ملف القواعد rules.txt', sub: 'شروط ونصوص الخطافات متوفرة بنجاح' },
      { key: 'originalVideosPresent', label: 'تم العثور على فيديوهات الحملة الأصلية', sub: 'المجلد videos/ يحتوي على 1.mp4, 2.mp4, 3.mp4' },
      { key: 'hookTemplatesPresent', label: 'فيديوهات البداية (الخطاف) متوفرة', sub: 'ملفات الفيديو الخاصة أو الأصلية جاهزة' },
      { key: 'gotoRewardsTemplatePresent', label: 'الخطوة 1: قالب التوجيه للموقع متوفر', sub: 'ملف gotocontentrewards.mp4' },
      { key: 'signupTemplatePresent', label: 'الخطوة 2: قالب إنشاء الحساب متوفر', sub: 'ملف signup.mp4' },
      { key: 'campaignTemplatePresent', label: 'الخطوة 3: قالب الحملات والانضمام متوفر', sub: 'ملف findcampainandjoin.mp4' },
      { key: 'editVideoTemplatePresent', label: 'الخطوة 4: قالب تحرير الفيديو متوفر', sub: 'ملف edityourvideo.mp4' },
      { key: 'payoutTemplatePresent', label: 'الخطوة 5: قالب النشر والأرباح متوفر', sub: 'ملف postitandgetpaid.mp4' },
      { key: 'keyboardSoundPresent', label: 'مؤثر صوت لوحة المفاتيح متوفر', sub: 'keyboard1.mp3, keyboard2.mp3' },
      { key: 'cashSoundPresent', label: 'مؤثر صوت الأرباح والنقود متوفر', sub: 'cash1.mp3, cash2.mp3' }
    ];

    items.forEach(item => {
      const isOk = checklist[item.key];
      const itemEl = document.createElement('div');
      itemEl.className = 'checklist-item';

      const iconType = isOk ? 'check-circle' : 'alert-circle';
      const iconClass = isOk ? 'check-success' : 'check-warning';

      itemEl.innerHTML = `
        <i data-lucide="${iconType}" class="check-icon ${iconClass}"></i>
        <div>
          <span class="check-text">${item.label}</span>
          <span class="check-sub">${item.sub}</span>
        </div>
      `;
      checklistGrid.appendChild(itemEl);
    });
  }

  // Populate drop-downs using scanned files and parsed text
  function populateConfigOptions(assets, rules) {
    // 1. Hook videos
    selectHookVideo.innerHTML = '';
    const originalHooks = assets.originalVideos || [];
    const characterHooks = assets.characterVideos || [];

    originalHooks.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.relativePath;
      opt.textContent = `فيديو أصلي: ${v.name} (${formatBytes(v.size)})`;
      selectHookVideo.appendChild(opt);
    });

    characterHooks.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.relativePath;
      opt.textContent = `فيديو مخصص: ${v.name} (${formatBytes(v.size)})`;
      selectHookVideo.appendChild(opt);
    });

    // 2. Preset Hooks from rules.txt
    selectHookPreset.innerHTML = '<option value="">-- اختر خطافاً جاهزاً من قواعد الحملة --</option>';
    const hooks = rules.hooksOnScreen || [];
    hooks.forEach(h => {
      const opt = document.createElement('option');
      opt.value = h;
      opt.textContent = h;
      selectHookPreset.appendChild(opt);
    });

    // Default to first preset hook
    if (hooks.length > 0) {
      selectHookPreset.selectedIndex = 1;
      inputHookTextText.value = hooks[0];
    }

    // 3. Audio Sounds selectors
    selectKeyboardSound.innerHTML = '';
    selectCashSound.innerHTML = '';

    const sounds = assets.characterSounds || [];
    sounds.forEach(s => {
      if (s.name.includes('keyboard')) {
        const opt = document.createElement('option');
        opt.value = s.relativePath;
        opt.textContent = s.name;
        selectKeyboardSound.appendChild(opt);
      } else if (s.name.includes('cash')) {
        const opt = document.createElement('option');
        opt.value = s.relativePath;
        opt.textContent = s.name;
        selectCashSound.appendChild(opt);
      }
    });

    // Set fallback defaults if selectors are empty
    if (selectKeyboardSound.options.length === 0) {
      const opt = document.createElement('option');
      opt.value = 'character/sounds/keyboard1.mp3';
      opt.textContent = 'صوت لوحة المفاتيح 1 (افتراضي)';
      selectKeyboardSound.appendChild(opt);
    }
    if (selectCashSound.options.length === 0) {
      const opt = document.createElement('option');
      opt.value = 'character/sounds/cash1.mp3';
      opt.textContent = 'صوت تسجيل النقود 1 (افتراضي)';
      selectCashSound.appendChild(opt);
    }
  }

  // Lock/Unlock form inputs
  function enableFormControls(enable) {
    const controls = [
      selectHookVideo, selectHookPreset, inputHookTextText,
      inputRandomOverlayText, selectKeyboardSound, selectCashSound,
      inputCtaText, inputReferralLink, btnGenerate
    ];

    controls.forEach(ctrl => {
      if (ctrl) ctrl.disabled = !enable;
    });
  }

  // Generate Video Render Request
  async function generateVideo() {
    btnGenerate.disabled = true;
    btnGenerate.innerHTML = '<i data-lucide="loader" class="spin"></i> جاري بدء التوليد...';
    lucide.createIcons();

    // UI state transitions
    renderLoader.style.display = 'flex';
    logsCard.style.display = 'block';
    downloadBox.style.display = 'none';

    videoWrapper.innerHTML = `
      <div class="video-placeholder">
        <i data-lucide="clapperboard" class="placeholder-icon"></i>
        <p class="placeholder-text">جاري تركيب وتوليد مقطع الفيديو... يرجى مراجعة سجل المخرجات أدناه.</p>
      </div>
    `;
    lucide.createIcons();

    showConsoleLog('جاري بدء عملية توليد وتركيب الفيديو...\n');
    showConsoleLog(`فيديو البداية المحدد: ${selectHookVideo.value}`);
    showConsoleLog(`نص الخطاف المعروض: ${inputHookTextText.value}`);
    showConsoleLog(`نص الدعوة للتفاعل: ${inputCtaText.value}`);

    const payload = {
      hookVideoPath: selectHookVideo.value,
      hookText: inputHookTextText.value,
      ctaText: inputCtaText.value,
      keyboardSoundPath: selectKeyboardSound.value,
      cashSoundPath: selectCashSound.value,
      randomOverlayText: inputRandomOverlayText.value,
      referralLink: inputReferralLink.value
    };

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (data.success) {
        showConsoleLog('\n[نجاح] اكتمل تركيب وتوليد الفيديو بنجاح!');
        showConsoleLog(data.log);

        // Inject video player
        videoWrapper.innerHTML = `
          <video class="preview-video" controls autoplay loop>
            <source src="${data.videoUrl}?t=${Date.now()}" type="video/mp4">
            متصفحك لا يدعم تشغيل الفيديو.
          </video>
        `;

        // Setup download button
        btnDownload.href = data.videoUrl;
        downloadBox.style.display = 'flex';
      } else {
        showConsoleLog('\n[خطأ] فشلت عملية توليد الفيديو!');
        showConsoleLog(data.error);
        showConsoleLog(data.details || '');

        videoWrapper.innerHTML = `
          <div class="video-placeholder">
            <i data-lucide="alert-octagon" class="check-danger" style="width: 48px; height: 48px;"></i>
            <p class="placeholder-text" style="color: var(--danger)">خطأ في التوليد: ${data.error}</p>
          </div>
        `;
        lucide.createIcons();
      }
    } catch (error) {
      console.error(error);
      showConsoleLog('\n[استثناء] خطأ فادح في الاتصال مع خادم التوليد: ' + error.message);
    } finally {
      btnGenerate.disabled = false;
      btnGenerate.innerHTML = '<i data-lucide="sparkles"></i> تركيب وتوليد مقطع الفيديو';
      renderLoader.style.display = 'none';
      lucide.createIcons();
    }
  }

  // Log outputs utility
  function showConsoleLog(msg) {
    logOutput.textContent += msg + '\n';
    logOutput.scrollTop = logOutput.scrollHeight;
  }

  // Format sizing bytes
  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
});
