/* config.js — single source of truth for tunable knobs.
 * Loaded first; everything else reads from window.SoundTravels.config.
 *
 * window.SOUND_TRAVELS_BASE is set in index.html before this file loads.
 *   "" for local development (relative paths)
 *   "https://USER.github.io/REPO/" when hosted on GitHub Pages + cognition.run
 */
(function () {
  const base = window.SOUND_TRAVELS_BASE || "";
  window.SoundTravels = window.SoundTravels || {};
  window.SoundTravels.config = {
    BASE: base,
    MANIFEST_URL: base + "manifest.json",

    // Trial counts per phase. Total trials = sum + 1 practice.
    N_PRACTICE: 1,
    N_PHASE_1:  8,    // warmup: one clip per cluster (most diverse)
    N_PHASE_2: 12,    // mixed across clusters, anti-repeat
    N_PHASE_3: 10,    // within-cluster (fine-grained)

    // DataPipe — get this ID from pipe.jspsych.org after creating an experiment
    DATAPIPE_ID: "mwgs2",

    // UI
    PLOT_PIXELS: 500,
  };
})();
