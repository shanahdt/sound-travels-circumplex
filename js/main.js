/* main.js — bootstrap. Fetches manifest, builds the trial list, runs the timeline.
 *
 * Loaded last by index.html, after config / circumplex-plugin / trial-builder / stages.
 */
(function () {
  const ST = window.SoundTravels;

  async function run() {
    const cfg = ST.config;

    // Per-participant deterministic seed + unique ID for DataPipe filename.
    // Defined early so on_finish can close over it.
    const seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
    const participantId = `p_${seed}`;

    // Give jsPsych its own container so its injected styles don't affect the body layout.
    const expContainer = document.createElement('div');
    expContainer.id = 'exp-container';
    document.body.appendChild(expContainer);

    const jsPsych = initJsPsych({
      display_element: expContainer,
      on_finish: () => {
        try { window.__jsPsychData = jsPsych.data.get().values(); } catch (e) {}
        // Send to DataPipe regardless of how far the participant got.
        try {
          fetch("https://pipe.jspsych.org/api/data/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              experimentID: cfg.DATAPIPE_ID,
              filename: `${participantId}.csv`,
              data: jsPsych.data.get().csv(),
            }),
          });
        } catch (e) { /* swallow — best effort */ }
      },
    });
    window.__jsPsych = jsPsych;

    const loading = document.createElement("div");
    loading.className = "intro-wrap";
    loading.style.textAlign = "center";
    loading.innerHTML = "<p>Loading study...</p>";
    expContainer.appendChild(loading);

    let manifest;
    try {
      const r = await fetch(cfg.MANIFEST_URL, {cache: "no-store"});
      if (!r.ok) throw new Error(`HTTP ${r.status} fetching manifest`);
      manifest = await r.json();
    } catch (err) {
      loading.innerHTML = `<p style="color:#a00">Failed to load <code>${cfg.MANIFEST_URL}</code>.<br/>${err}<br/>
        <span class="hint">Check that <code>SOUND_TRAVELS_BASE</code> in <code>index.html</code>
        points at a URL where <code>manifest.json</code> is reachable.</span></p>`;
      return;
    }
    loading.remove();
    const rng  = ST.makeRNG(seed);
    const split = ST.buildTrialList(manifest, rng);

    const totalRated = split.phase1.length + split.phase2.length + split.phase3.length;

    const buildRatingTrial = (clip) => ({
      type: ST.CircumplexPlugin,
      audio_url:   cfg.BASE + clip.src,
      clip_id:     clip.id,
      cluster:     clip.cluster,
      phase:       clip.phase,
      trial_index: clip.phase_idx,
      total:       totalRated,
      is_practice: false,
      data: { seed, manifest_version: manifest.version, stage: `phase_${clip.phase}` },
    });

    const allRatingClips = [...split.phase1, ...split.phase2, ...split.phase3];
    const audioUrls = [
      cfg.BASE + split.practice.src,
      ...allRatingClips.map(c => cfg.BASE + c.src),
    ];

    const timeline = [
      ST.stages.consent(jsPsych),
      ST.stages.prolificId(jsPsych),
      ST.stages.disability(),
      ...ST.stages.taskPages,
      ST.stages.lifeRightNow(),
      ST.stages.growingUp(),
      ST.stages.culture(),
      ST.stages.musicBackground(),
      ST.stages.instructions(totalRated),
      ST.stages.preload(audioUrls),
      ST.stages.practiceTrial(split.practice),
      ...split.phase1.map(buildRatingTrial),
      ST.stages.phaseBreak(split.phase1.length, totalRated, "Phase 1 complete \u2014 the next set keeps things varied."),
      ...split.phase2.map(buildRatingTrial),
      ST.stages.phaseBreak(split.phase1.length + split.phase2.length, totalRated, "Phase 2 complete \u2014 the last set focuses on a single soundscape type."),
      ...split.phase3.map(buildRatingTrial),
      ST.stages.demographics(),
      ST.stages.debrief(),
    ];

    jsPsych.run(timeline);
  }

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
