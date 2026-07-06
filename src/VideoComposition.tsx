import React from 'react';
import { Sequence, Video, Audio, useCurrentFrame, useVideoConfig } from 'remotion';
import './index.css';

interface SceneDurations {
  hook: number;
  rewards: number;
  signUp: number;
  findCampaign: number;
  editVideo: number;
  getPaid: number;
  outro: number;
}

export interface VideoCompositionProps extends Record<string, unknown> {
  hookVideoPath: string;
  hookText: string;
  ctaText: string;
  keyboardSoundPath: string;
  cashSoundPath: string;
  randomOverlayText?: string;
  referralLink: string;
  tag: string;
  sceneDurations: SceneDurations;
}

export const VideoComposition = (props: VideoCompositionProps) => {
  const {
    hookVideoPath,
    hookText,
    ctaText,
    keyboardSoundPath,
    cashSoundPath,
    randomOverlayText,
    referralLink,
    tag,
    sceneDurations
  } = props;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Convert durations from seconds to frames
  const hookFrames = Math.floor(sceneDurations.hook * fps);
  const rewardsFrames = Math.floor(sceneDurations.rewards * fps);
  const signUpFrames = Math.floor(sceneDurations.signUp * fps);
  const findCampaignFrames = Math.floor(sceneDurations.findCampaign * fps);
  const editVideoFrames = Math.floor(sceneDurations.editVideo * fps);
  const getPaidFrames = Math.floor(sceneDurations.getPaid * fps);
  const outroFrames = Math.floor(sceneDurations.outro * fps);

  const totalFrames = hookFrames + rewardsFrames + signUpFrames + findCampaignFrames + editVideoFrames + getPaidFrames + outroFrames;

  // Calculate start frames for each scene
  const hookStart = 0;
  const rewardsStart = hookFrames;
  const signUpStart = rewardsStart + rewardsFrames;
  const findCampaignStart = signUpStart + signUpFrames;
  const editVideoStart = findCampaignStart + findCampaignFrames;
  const getPaidStart = editVideoStart + editVideoFrames;
  const outroStart = getPaidStart + getPaidFrames;

  // Progress Bar Percentage
  const progressPercent = (frame / totalFrames) * 100;

  return (
    <div className="video-container">
      {/* Premium Top Progress Bar */}
      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Campaign Tag Watermark (Present through the entire video to align with rules.txt) */}
      <div className="campaign-watermark">
        <span className="watermark-tag">{tag}</span>
      </div>

      {/* SCENE 1: HOOK */}
      <Sequence from={hookStart} durationInFrames={hookFrames}>
        <div className="scene">
          <Video src={hookVideoPath} volume={0} className="background-video" />
          <div className="overlay-content fade-in-scale">
            <h1 className="hook-title">{hookText}</h1>
            {randomOverlayText && <p className="hook-subtitle">{randomOverlayText}</p>}
          </div>
        </div>
      </Sequence>

      {/* SCENE 2: GO TO CONTENT REWARDS */}
      <Sequence from={rewardsStart} durationInFrames={rewardsFrames}>
        <div className="scene">
          <Video
            src="http://localhost:3000/character/templates/gotocontentrewards.mp4"
            volume={0.2}
            className="background-video"
          />
          <div className="overlay-content slide-up">
            <div className="step-badge">الخطوة ١</div>
            <h2 className="step-title">اذهب إلى موقع Content Rewards</h2>
          </div>
        </div>
      </Sequence>

      {/* SCENE 3: SIGN UP */}
      <Sequence from={signUpStart} durationInFrames={signUpFrames}>
        <div className="scene">
          <Video
            src="http://localhost:3000/character/templates/signup.mp4"
            volume={0.2}
            className="background-video"
          />
          <Audio src={keyboardSoundPath} volume={0.8} />
          <div className="overlay-content slide-up">
            <div className="step-badge">الخطوة ٢</div>
            <h2 className="step-title">أنشئ حساباً جديداً في الموقع</h2>
          </div>
        </div>
      </Sequence>

      {/* SCENE 4: FIND CAMPAIGN & JOIN */}
      <Sequence from={findCampaignStart} durationInFrames={findCampaignFrames}>
        <div className="scene">
          <Video
            src="http://localhost:3000/character/templates/findcampainandjoin.mp4"
            volume={0.2}
            className="background-video"
          />
          <Audio src={keyboardSoundPath} volume={0.8} />
          <div className="overlay-content slide-up">
            <div className="step-badge">الخطوة ٣</div>
            <h2 className="step-title">تصفح الحملات واضغط على انضمام</h2>
          </div>
        </div>
      </Sequence>

      {/* SCENE 5: EDIT YOUR VIDEO */}
      <Sequence from={editVideoStart} durationInFrames={editVideoFrames}>
        <div className="scene">
          <Video
            src="http://localhost:3000/character/templates/edityourvideo.mp4"
            volume={0.2}
            className="background-video"
          />
          <Audio src={keyboardSoundPath} volume={0.8} />
          <div className="overlay-content slide-up">
            <div className="step-badge">الخطوة ٤</div>
            <h2 className="step-title">قم بتحرير مقطع الفيديو الخاص بك</h2>
          </div>
        </div>
      </Sequence>

      {/* SCENE 6: POST & GET PAID */}
      <Sequence from={getPaidStart} durationInFrames={getPaidFrames}>
        <div className="scene">
          <Video
            src="http://localhost:3000/character/templates/postitandgetpaid.mp4"
            volume={0.2}
            className="background-video"
          />
          <Audio src={cashSoundPath} volume={1.0} />
          <div className="overlay-content slide-up">
            <div className="step-badge success-badge">الخطوة ٥</div>
            <h2 className="step-title highlight-text">انشر الفيديو واحصل على أرباحك!</h2>
          </div>
        </div>
      </Sequence>

      {/* SCENE 7: OUTRO / CTA */}
      <Sequence from={outroStart} durationInFrames={outroFrames}>
        <div className="scene">
          {/* Looping the original hook video background for the outro */}
          <Video src={hookVideoPath} volume={0} className="background-video" />
          <div className="overlay-content fade-in-scale">
            <div className="cta-card">
              <h2 className="cta-title">{ctaText}</h2>
              <div className="cta-divider" />
              <p className="cta-link">الرابط في البيو: {referralLink}</p>
              <p className="cta-subtext">الردود التلقائية مفعلة! 🚀</p>
            </div>
          </div>
        </div>
      </Sequence>
    </div>
  );
};
