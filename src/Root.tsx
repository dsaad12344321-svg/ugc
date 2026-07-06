

import React from 'react';

import { Composition, registerRoot } from 'remotion';

// import { VideoComposition } from './VideoComposition';

import { VideoComposition, VideoCompositionProps } from './VideoComposition';



// NOTE: Do NOT use getVideoDurationInSeconds here — it is a browser-only hook

// and cannot run inside calculateMetadata (server-side). Durations are passed

// in via inputProps (sceneDurations) computed by the Express server before render.



const DEFAULT_SCENE_DURATIONS = {

  hook: 4.0,

  rewards: 5.0,

  signUp: 5.0,

  findCampaign: 6.0,

  editVideo: 4.0,

  getPaid: 5.0,

  outro: 4.0,

};



const DEFAULT_TOTAL_FRAMES = Math.round(

  (DEFAULT_SCENE_DURATIONS.hook +

    DEFAULT_SCENE_DURATIONS.rewards +

    DEFAULT_SCENE_DURATIONS.signUp +

    DEFAULT_SCENE_DURATIONS.findCampaign +

    DEFAULT_SCENE_DURATIONS.editVideo +

    DEFAULT_SCENE_DURATIONS.getPaid +

    DEFAULT_SCENE_DURATIONS.outro) * 30

);



export const Root: React.FC = () => {

  return (

    <Composition

      id="VideoComposition"

      component={VideoComposition}

      durationInFrames={DEFAULT_TOTAL_FRAMES}

      fps={30}

      width={1080}

      height={1920}

      defaultProps={{

        hookVideoPath: 'http://localhost:3000/original/videos/1.webm',

        hookText: 'POV: ربح 1.2 ألف دولار في تحدي الصف',

        ctaText: 'اكتب تعليقاً كلمة LINK للحصول على الرابط!',

        keyboardSoundPath: 'http://localhost:3000/character/sounds/keyboard1.mp3',

        cashSoundPath: 'http://localhost:3000/character/sounds/cash1.mp3',

        randomOverlayText: 'شاهدني وأنا أبدع',

        referralLink: 'contentrewards.com/ref/danny',

        tag: '#contentrewardspartner',

        sceneDurations: DEFAULT_SCENE_DURATIONS,

      }}

      calculateMetadata={(options) => {
        const props = options.props;

        const sd =

          (props as VideoCompositionProps).sceneDurations ??

          DEFAULT_SCENE_DURATIONS;



        const fps = 30;



        const totalDuration =

          sd.hook +

          sd.rewards +

          sd.signUp +

          sd.findCampaign +

          sd.editVideo +

          sd.getPaid +

          sd.outro;



        return {

          durationInFrames: Math.round(totalDuration * fps),

          props,

        };

      }}

    />

  );

};



registerRoot(Root);
