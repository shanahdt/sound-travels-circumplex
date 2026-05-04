/* stages.js — every non-rating timeline node lives here.
 *
 * Each export returns a jsPsych trial object that you can drop straight into a timeline.
 * Order in which they appear in the experiment:
 *   consent  ->  instructions  ->  preload  ->  practice trial (built from CircumplexPlugin)
 *      ->  phase 1 trials  ->  phaseBreak  ->  phase 2 trials  ->  phaseBreak
 *      ->  phase 3 trials  ->  demographics  ->  debrief
 */
(function () {
  const ST = window.SoundTravels = window.SoundTravels || {};
  const cfg = () => ST.config;

  // ---------- consent ----------
  const consent = (jsPsych) => ({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="intro-wrap">
        <h2>Consent</h2>
        <p>This study is part of the <em>Sound Travels</em> field-recording project at Northwestern University.
           You'll listen to short soundscape recordings and rate the feeling each one evokes.</p>
        <p>By continuing, you agree that your anonymous ratings can be used for research on
           auditory affect. No identifying information is collected. You may close the tab at
           any time to withdraw.</p>
        <p style="font-size:13px;color:#666">If you have questions, contact
           <a href="mailto:daniel.shanahan@gmail.com">daniel.shanahan@gmail.com</a>.</p>
      </div>`,
    choices: ["I consent — continue", "I do not consent"],
    on_finish: data => {
      if (data.response === 1) {
        document.body.innerHTML = "<p style='text-align:center;margin-top:60px'>Thanks anyway. You can close this tab.</p>";
        jsPsych.endExperiment();
      }
    },
    data: { stage: "consent" },
  });

  // ---------- instructions ----------
  const instructions = (totalTrials) => ({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="intro-wrap">
        <h1>Sound Travels: Affective Soundscape Rating</h1>
        <p>You'll hear ${totalTrials} short field recordings. For each one, rate how it makes
           you feel by placing a dot on a 2D plane.</p>
        <p>The horizontal axis is <b>valence</b> (unpleasant on the left, pleasant on the right)
           and the vertical axis is <b>arousal</b> (calm / low energy at the bottom, activated /
           high energy at the top). This is Russell's classic circumplex model of affect.</p>
        <div class="mini-plot">
          <div class="h"></div><div class="v"></div><div class="ring"></div>
          <span class="lbl" style="left:6px;top:50%;transform:translateY(-50%)">unpl.</span>
          <span class="lbl" style="right:6px;top:50%;transform:translateY(-50%)">pl.</span>
          <span class="lbl" style="left:50%;top:4px;transform:translateX(-50%)">high</span>
          <span class="lbl" style="left:50%;bottom:4px;transform:translateX(-50%)">low</span>
        </div>
        <p>The whole thing should take about 10 minutes. Wear headphones if you can, and
           settle on a comfortable volume before starting. We'll give you one practice trial
           first so you can learn the controls.</p>
      </div>`,
    choices: ["I'm ready — start with practice"],
    data: { stage: "instructions" },
  });

  // ---------- preload (audio cache warmup) ----------
  const preload = (audioUrls) => ({
    type: jsPsychPreload,
    audio: audioUrls,
    show_progress_bar: true,
    message: "Loading sounds (this can take ~30 s on first run)...",
    continue_after_error: true,
    data: { stage: "preload" },
  });

  // ---------- practice trial ----------
  const practiceTrial = (clip) => ({
    type: ST.CircumplexPlugin,
    audio_url:   cfg().BASE + clip.src,
    clip_id:     clip.id,
    cluster:     clip.cluster,
    phase:       0,
    trial_index: 0,
    total:       1,
    is_practice: true,
    data: { stage: "practice" },
  });

  // ---------- phase break ----------
  const phaseBreak = (completed, total, label) => ({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="intro-wrap" style="text-align:center">
        <h2>Short break</h2>
        <p>You're ${Math.round(100 * completed / total)}% of the way through.</p>
        <p style="font-size:14px;color:#555">${label}</p>
      </div>`,
    choices: ["Continue"],
    data: { stage: "break" },
  });

  // ---------- demographics ----------
  // Uses the survey-html-form plugin for a custom mixed-input form.
  // Field choices: standard set + audio-relevant + soundscape exposure (per design decision).
  const demographics = () => ({
    type: jsPsychSurveyHtmlForm,
    preamble: `
      <div class="intro-wrap" style="text-align:center">
        <h2>A few questions about you</h2>
        <p style="font-size:14px;color:#555">Last step. Everything is optional except where marked.</p>
      </div>`,
    html: `
      <form class="demo-form">

        <div>
          <label for="age">Age <span class="field-help">(years, optional)</span></label>
          <input type="number" id="age" name="age" min="13" max="120" />
        </div>

        <div>
          <label>Gender</label>
          <div class="radio-row">
            <label><input type="radio" name="gender" value="female"/> female</label>
            <label><input type="radio" name="gender" value="male"/> male</label>
            <label><input type="radio" name="gender" value="non_binary"/> non-binary</label>
            <label><input type="radio" name="gender" value="prefer_not"/> prefer not to say</label>
            <label><input type="radio" name="gender" value="self_describe"/> self-describe</label>
          </div>
          <input type="text" name="gender_other" placeholder="If self-describe, please specify" style="margin-top:6px"/>
        </div>

        <div>
          <label for="native_language">Native language</label>
          <input type="text" id="native_language" name="native_language" />
        </div>

        <div>
          <label for="country">Country of residence</label>
          <input type="text" id="country" name="country" />
        </div>

        <div>
          <label>Are you wearing headphones or earbuds right now?</label>
          <div class="radio-row">
            <label><input type="radio" name="headphones" value="yes" required/> yes</label>
            <label><input type="radio" name="headphones" value="no"/> no, speakers</label>
          </div>
        </div>

        <div>
          <label>Do you have any self-reported hearing impairment?</label>
          <div class="radio-row">
            <label><input type="radio" name="hearing_impairment" value="no" required/> no</label>
            <label><input type="radio" name="hearing_impairment" value="yes"/> yes</label>
            <label><input type="radio" name="hearing_impairment" value="prefer_not"/> prefer not to say</label>
          </div>
        </div>

        <div>
          <label for="years_training">Years of formal musical training
            <span class="field-help">(0 if none)</span></label>
          <input type="number" id="years_training" name="years_training" min="0" max="80" />
        </div>

        <div>
          <label for="hours_listening">Hours per week of active music listening
            <span class="field-help">(rough estimate)</span></label>
          <input type="number" id="hours_listening" name="hours_listening" min="0" max="168" />
        </div>

        <div>
          <label>How often do you listen to nature recordings, soundscapes, or ambient music?</label>
          <div class="radio-row">
            <label><input type="radio" name="soundscape_exposure" value="never"/> never</label>
            <label><input type="radio" name="soundscape_exposure" value="rarely"/> rarely</label>
            <label><input type="radio" name="soundscape_exposure" value="monthly"/> a few times a month</label>
            <label><input type="radio" name="soundscape_exposure" value="weekly"/> weekly</label>
            <label><input type="radio" name="soundscape_exposure" value="daily"/> daily</label>
          </div>
        </div>

      </form>
    `,
    button_label: "Submit and finish",
    data: { stage: "demographics" },
  });

  // ---------- debrief ----------
  const debrief = () => ({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="intro-wrap">
        <h2>That's it \u2014 thank you.</h2>
        <p>The data you've provided will help train models that can predict the
           emotional impression of soundscapes from their audio features alone.</p>
        <p>If you'd like to know more about the project, or have any feedback, you can
           email <a href="mailto:daniel.shanahan@gmail.com">daniel.shanahan@gmail.com</a>.</p>
      </div>`,
    choices: ["Finish"],
    data: { stage: "debrief" },
  });

  ST.stages = { consent, instructions, preload, practiceTrial, phaseBreak, demographics, debrief };
})();
