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

  // ---------- prolific id ----------
  const prolificId = (jsPsych) => ({
    type: jsPsychSurveyHtmlForm,
    preamble: `
      <div class="intro-wrap" style="text-align:center">
        <h2>Participant ID</h2>
        <p>Please enter your Prolific ID below.</p>
      </div>`,
    html: `
      <div style="max-width:400px;margin:0 auto">
        <label for="prolific_id" style="display:block;font-weight:500;margin-bottom:8px">Prolific ID</label>
        <input type="text" id="prolific_id" name="prolific_id" required
               placeholder="Enter your Prolific ID"
               style="width:100%;box-sizing:border-box;padding:10px;border:1px solid #cfc9bb;border-radius:6px;font:inherit" />
      </div>`,
    button_label: "Continue",
    on_finish: data => {
      jsPsych.data.addProperties({ prolific_id: data.response.prolific_id });
    },
    data: { stage: "prolific_id" },
  });

  // ---------- music background (Zhou & Schubert) ----------
  const musicBackground = () => ({
    type: jsPsychSurveyHtmlForm,
    preamble: `
      <div class="intro-wrap" style="text-align:center">
        <h2>Music Background</h2>
        <p>Which title best describes you?</p>
      </div>`,
    html: `
      <div class="radio-stack">
        <label><input type="radio" name="music_background" value="nonmusician" required /> Nonmusician</label>
        <label><input type="radio" name="music_background" value="music_loving_nonmusician" /> Music-loving nonmusician</label>
        <label><input type="radio" name="music_background" value="amateur_musician" /> Amateur musician</label>
        <label><input type="radio" name="music_background" value="serious_amateur_musician" /> Serious amateur musician</label>
        <label><input type="radio" name="music_background" value="semi_professional_musician" /> Semi-professional musician</label>
        <label><input type="radio" name="music_background" value="professional_musician" /> Professional musician</label>
      </div>`,
    button_label: "Continue",
    data: { stage: "music_background" },
  });

  // ---------- consent ----------
  const consent = (jsPsych) => ({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="intro-wrap">
        <h2>Thank you for helping with this research!</h2>

        <p><em>How you Focus</em> is an app that is part of a study funded by the National Science
           Foundation understanding how sound impacts visitors.</p>

        <p>Participating is your choice. Your responses will be anonymous.</p>

        <p>Learn more below or get started now, which means you agree your responses will become
           part of the Sound Travels research.</p>

        <p>By testing out this app you are part of the <em>Sound Travels</em> research project.
           Please feel free to skip questions or stop the questionnaire if you need to.</p>

        <p>You may choose not to participate without any negative consequences to you, and there
           are no specific benefits to you associated with participating.</p>

        <p>Anytime you share information online there are risks of hacking or interception.
           We're using a secure system to collect these data, but we can't completely eliminate
           this risk. We're minimizing this risk in the following ways:</p>

        <ul>
          <li>Your answers will be totally anonymous. We are not collecting any personally
              identifying information, so your identity won't be connected to your participation
              or your answers in any direct way.</li>
          <li>We'll store all electronic data on a password-protected, encrypted computer or
              cloud storage.</li>
          <li>The data we collect may be used for reports, presentations, or future research.</li>
        </ul>

        <p>If you have any questions or concerns, please feel free to reach out to the directors
           of the research:</p>
        <ul>
        <li>Martha Merson — <a href="mailto:martha_merson@terc.edu">martha_merson@terc.edu</a></li>
        <li>Daniel Shanahan — <a href="mailto:daniel.shanahan@northwestern.edu">daniel.shanahan@northwestern.edu</a></li>
          <li>Justin Meyer — <a href="mailto:jmeyer@cosi.org">jmeyer@cosi.org</a></li>
        </ul>

        <p>If you have any questions or concerns regarding your rights as a participant in the research, 
        please feel free to reach out to the institutional review board at TERC. irb@terc.edu
        TERC is a non-profit education research and development organization in Cambridge, Massachusetts. TERC is overseeing the research.</p>
      
      </div>`,
    choices: ["Get started", "No thanks"],
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

  // ---- helpers ----
  function taskSection(title, field) {
    const opts = [
      ['silent',      'A silent room'],
      ['quiet_bg',    'A room with quiet background noise'],
      ['moderate_bg', 'A room with moderate background noise'],
      ['phones_soft', 'A room with personal headphones playing soft music'],
      ['phones_loud', 'A room with personal headphones playing loud music'],
      ['other',       'A room with different sound conditions'],
    ];
    const radios = opts.map(([val, lbl], i) =>
      `<label><input type="radio" name="${field}" value="${val}"${i === 0 ? ' required' : ''}/> ${lbl}</label>`
    ).join('');
    return `
      <div class="task-section">
        <p class="task-q">${title}</p>
        <div class="radio-stack compact">${radios}</div>
        <input type="text" name="${field}_other" class="task-other-input"
               placeholder="If different conditions, please describe (optional)"/>
      </div>`;
  }

  function likertRow(stmt, field) {
    const btns = [1, 2, 3, 4, 5].map(n =>
      `<label class="likert-btn"><input type="radio" name="${field}" value="${n}"${n === 1 ? ' required' : ''}/><span>${n}</span></label>`
    ).join('');
    return `<div class="likert-row"><div class="likert-q">${stmt}</div><div class="likert-options">${btns}</div></div>`;
  }

  // ---- disability ----
  const disability = () => ({
    type: jsPsychSurveyHtmlForm,
    preamble: `
      <div class="intro-wrap" style="text-align:center">
        <h2>A couple of quick questions before we begin</h2>
        <p>Which of the following statements are true for you? <em>(Select as many as apply)</em></p>
      </div>`,
    html: `
      <div class="radio-stack" style="max-width:560px;margin:0 auto">
        <label><input type="checkbox" name="d_hearing_device" value="1"/>
          I use a device (e.g., hearing aid, cochlear implant) to expand what I can hear.</label>
        <label><input type="checkbox" name="d_limit_sound" value="1"/>
          I use a device (e.g., ear plugs, headphones) to help me limit what I can hear.</label>
        <label><input type="checkbox" name="d_struggle_hear" value="1"/>
          I often struggle to experience sounds that I want to hear.</label>
        <label><input type="checkbox" name="d_distracting" value="1"/>
          I often experience sound as distracting.</label>
        <label><input type="checkbox" name="d_stress_inducing" value="1"/>
          I often experience sound as stress inducing.</label>
        <label style="border-top:2px solid #d8d3c6;margin-top:4px;padding-top:14px">
          <input type="checkbox" id="d_none" name="d_none" value="1"/>
          None of these are true for me.</label>
      </div>`,
    button_label: "Continue",
    on_load: () => {
      const none = document.getElementById('d_none');
      const others = [...document.querySelectorAll('.radio-stack input[type="checkbox"]:not(#d_none)')];
      none.addEventListener('change', () => { if (none.checked) others.forEach(cb => cb.checked = false); });
      others.forEach(cb => cb.addEventListener('change', () => { if (cb.checked) none.checked = false; }));
    },
    data: { stage: "disability" },
  });

  // ---- task preferences (one per page) ----
  function makeTaskPage(prompt, field, index, total) {
    return {
      type: jsPsychSurveyHtmlForm,
      preamble: `
        <div class="intro-wrap" style="text-align:center">
          <h2>Sound and Focus <span style="font-size:15px;font-weight:400;color:#666">(${index} of ${total})</span></h2>
          <p>Choose the room you would prefer the most to be successful at this task.</p>
        </div>`,
      html: `<div style="max-width:600px;margin:0 auto">${taskSection(prompt, field)}</div>`,
      button_label: "Continue",
      data: { stage: "task_preferences" },
    };
  }

  const taskPages = [
    makeTaskPage('Imagine you have to write a report for work or school.', 'task_write_report', 1, 5),
    makeTaskPage('Imagine you need to memorize information for a test.',   'task_memorize',      2, 5),
    makeTaskPage('Imagine you want to read a book for pleasure.',          'task_read_book',     3, 5),
    makeTaskPage('Imagine you want to chat with friends.',                 'task_chat_friends',  4, 5),
    makeTaskPage('Imagine you need to listen to instructions.',            'task_listen_instruct', 5, 5),
  ];

  // ---- life right now ----
  const lifeRightNow = () => ({
    type: jsPsychSurveyHtmlForm,
    preamble: `
      <div class="intro-wrap" style="text-align:center">
        <h2>Your Life Right Now</h2>
        <p>Thinking about your life right now, how much do you agree with the following statements?</p>
      </div>`,
    html: `
      <div class="likert-scale">
        <p class="likert-legend"><strong>1</strong> = Strongly disagree &nbsp;·&nbsp; <strong>5</strong> = Strongly agree</p>
        ${likertRow('I enjoy attending concerts.', 'l_concerts')}
        ${likertRow('I enjoy listening to music in my home.', 'l_music_home')}
        ${likertRow('I tend to notice and think about sound.', 'l_notice_sound')}
        ${likertRow('When I am planning something, I tend to consider sound.', 'l_plan_sound')}
        ${likertRow('When I think about sound in my life currently, I think of positive experiences.', 'l_positive_sound')}
        ${likertRow('I am aware of some of the ways sound can affect people\'s health.', 'l_health_aware')}
        ${likertRow('I am aware of some of the ways sound can affect ecosystems.', 'l_ecosystem_aware')}
      </div>`,
    button_label: "Continue",
    data: { stage: "life_right_now" },
  });

  // ---- growing up ----
  const growingUp = () => ({
    type: jsPsychSurveyHtmlForm,
    preamble: `
      <div class="intro-wrap" style="text-align:center">
        <h2>Growing Up</h2>
        <p>Thinking about your life when you were growing up, how much do you agree with the
           following statements?</p>
      </div>`,
    html: `
      <div class="likert-scale">
        <p class="likert-legend"><strong>1</strong> = Strongly disagree &nbsp;·&nbsp; <strong>5</strong> = Strongly agree</p>
        ${likertRow('City sounds were part of my daily life.', 'g_city')}
        ${likertRow('Nature sounds were part of my daily life.', 'g_nature')}
        ${likertRow('I remember listening for specific sounds regularly.', 'g_listen')}
        ${likertRow('I lived with people who were comfortable with a lot of sound.', 'g_comfortable')}
      </div>`,
    button_label: "Continue",
    data: { stage: "growing_up" },
  });

  // ---- culture ----
  const culture = () => ({
    type: jsPsychSurveyHtmlForm,
    preamble: `
      <div class="intro-wrap" style="text-align:center">
        <h2>Cultural Background</h2>
        <p>Thinking about the traditions and common values of people who share your cultural
           background, how much do you agree with the following statements?</p>
        <p style="font-size:14px;color:#555;font-style:italic">People who share my cultural background…</p>
      </div>`,
    html: `
      <div class="likert-scale">
        <p class="likert-legend"><strong>1</strong> = Strongly disagree &nbsp;·&nbsp; <strong>5</strong> = Strongly agree</p>
        ${likertRow('Make a lot of sound in spiritual or religious practices.', 'c_spiritual')}
        ${likertRow('Make a lot of sound at celebrations and special occasions.', 'c_celebrations')}
        ${likertRow('Consider quiet places serious or fancy.', 'c_quiet_serious')}
        ${likertRow('Want to live in a quiet place.', 'c_quiet_live')}
        ${likertRow('Consider being quiet a sign of respect.', 'c_quiet_respect')}
      </div>`,
    button_label: "Continue",
    data: { stage: "culture" },
  });

  ST.stages = { prolificId, disability, taskPages, lifeRightNow, growingUp, culture, musicBackground, consent, instructions, preload, practiceTrial, phaseBreak, demographics, debrief };
})();
