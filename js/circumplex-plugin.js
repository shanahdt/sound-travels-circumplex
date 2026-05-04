/* circumplex-plugin.js — custom jsPsych v7 plugin for one rating trial.
 *
 * Renders an audio playback row + a 2D plane. Participant must:
 *   1. listen to the clip at least once (auto-plays if browser allows; Play button always works)
 *   2. click or drag a marker into the plane
 * Then "Next" enables and the trial ends, returning normalized (valence, arousal) plus timing.
 *
 * Exposed as window.SoundTravels.CircumplexPlugin.
 */
(function () {
  const _PT = (typeof jsPsychModule !== "undefined" && jsPsychModule.ParameterType)
    ? jsPsychModule.ParameterType
    : { STRING: "STRING", INT: "INT", BOOL: "BOOL", FLOAT: "FLOAT" };

  class CircumplexPlugin {
    static info = {
      name: "circumplex-rating",
      parameters: {
        audio_url:   { type: _PT.STRING, default: "" },
        clip_id:     { type: _PT.STRING, default: "" },
        cluster:     { type: _PT.INT,    default: -1 },
        phase:       { type: _PT.INT,    default: 1 },   // 0=practice, 1/2/3=real phases
        trial_index: { type: _PT.INT,    default: 0 },
        total:       { type: _PT.INT,    default: 30 },
        is_practice: { type: _PT.BOOL,   default: false },
      },
    };

    constructor(jsPsych) { this.jsPsych = jsPsych; }

    trial(display_element, trial) {
      const start_time = performance.now();
      let placed = false, played = false, replays = 0;
      let firstClickRT = null, placeRT = null;
      let normX = null, normY = null;

      const banner = trial.is_practice
        ? `<div class="practice-banner">This is a practice trial. Your rating won't be saved \u2014 it's just to learn the controls.</div>`
        : "";

      const headerLeft = trial.is_practice
        ? "Practice"
        : `Trial ${trial.trial_index} of ${trial.total} \u00b7 phase ${trial.phase}/3`;

      display_element.innerHTML = `
        <div class="circumplex-wrap">
          <div style="font-size:13px;color:#666;width:var(--plot-size);text-align:left">${headerLeft}</div>
          ${banner}
          <div class="progress"><span style="width:${(100 * trial.trial_index / trial.total).toFixed(1)}%"></span></div>

          <div class="audio-row">
            <button id="play-btn">Play</button>
            <div class="audio-meter"><span id="audio-bar"></span></div>
            <span class="replay-count" id="replay-label">0 plays</span>
            <audio id="clip-audio" preload="auto" src="${trial.audio_url}"></audio>
          </div>

          <div class="plot" id="plot">
            <div class="axis-h"></div>
            <div class="axis-v"></div>
            <div class="ring"></div>
            <span class="axis-label" style="left:8px;top:50%;transform:translateY(-50%)">unpleasant</span>
            <span class="axis-label" style="right:8px;top:50%;transform:translateY(-50%);text-align:right">pleasant</span>
            <span class="axis-label" style="top:6px;left:50%;transform:translateX(-50%)">high arousal</span>
            <span class="axis-label" style="bottom:6px;left:50%;transform:translateX(-50%)">low arousal</span>
            <span class="anchor" style="top:14%;left:80%">excited</span>
            <span class="anchor" style="top:14%;left:20%;transform:translateX(-100%)">tense</span>
            <span class="anchor" style="top:80%;left:80%">content</span>
            <span class="anchor" style="top:80%;left:20%;transform:translateX(-100%)">depressed</span>
            <div id="marker" class="marker hidden"></div>
          </div>

          <p class="hint">Listen to the sound, then click anywhere on the square to place your rating.<br/>
             You can drag the dot or click again to move it.</p>

          <div class="controls">
            <button id="next-btn" disabled>Next</button>
            <span class="hint" id="next-hint">listen first, then place the dot</span>
          </div>
        </div>`;

      const $ = id => display_element.querySelector(id);
      const plot = $("#plot"), marker = $("#marker"), audio = $("#clip-audio");
      const playBtn = $("#play-btn"), bar = $("#audio-bar"), replayLbl = $("#replay-label");
      const nextBtn = $("#next-btn"), nextHint = $("#next-hint");

      const updateNextState = () => {
        const ok = played && placed;
        nextBtn.disabled = !ok;
        nextHint.textContent = ok ? "" :
          !played ? "listen first, then place the dot" : "place the dot to continue";
      };

      playBtn.addEventListener("click", () => { audio.currentTime = 0; audio.play(); });
      audio.addEventListener("play",  () => { replays++; replayLbl.textContent = `${replays} play${replays > 1 ? "s" : ""}`; });
      audio.addEventListener("ended", () => { played = true; updateNextState(); });
      audio.addEventListener("timeupdate", () => {
        if (audio.duration) bar.style.width = `${(100 * audio.currentTime / audio.duration).toFixed(1)}%`;
      });
      audio.play().catch(() => {});

      const placeAt = (cx, cy) => {
        const rect = plot.getBoundingClientRect();
        let x = Math.max(0, Math.min(rect.width,  cx - rect.left));
        let y = Math.max(0, Math.min(rect.height, cy - rect.top));
        marker.style.left = x + "px";
        marker.style.top  = y + "px";
        marker.classList.remove("hidden");
        normX =  (x / rect.width)  * 2 - 1;
        normY = -((y / rect.height) * 2 - 1);
        const now = performance.now() - start_time;
        if (firstClickRT === null) firstClickRT = now;
        placeRT = now;
        placed = true;
        updateNextState();
      };

      let dragging = false;
      const onDown = e => { e.preventDefault(); const p = e.touches ? e.touches[0] : e; dragging = true; placeAt(p.clientX, p.clientY); };
      const onMove = e => { if (!dragging) return; const p = e.touches ? e.touches[0] : e; placeAt(p.clientX, p.clientY); };
      const onUp   = () => { dragging = false; };
      plot.addEventListener("mousedown",  onDown);
      plot.addEventListener("touchstart", onDown, {passive: false});
      window.addEventListener("mousemove", onMove);
      window.addEventListener("touchmove", onMove, {passive: false});
      window.addEventListener("mouseup",   onUp);
      window.addEventListener("touchend",  onUp);

      nextBtn.addEventListener("click", () => {
        try { audio.pause(); } catch (e) {}
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("touchmove", onMove);
        window.removeEventListener("mouseup",   onUp);
        window.removeEventListener("touchend",  onUp);
        this.jsPsych.finishTrial({
          clip_id:        trial.clip_id,
          cluster:        trial.cluster,
          phase:          trial.phase,
          phase_idx:      trial.trial_index,
          is_practice:    trial.is_practice,
          valence:        normX,
          arousal:        normY,
          n_plays:        replays,
          listened_full:  played,
          rt_first_click: firstClickRT,
          rt_place_final: placeRT,
          rt_total:       performance.now() - start_time,
        });
      });
    }
  }

  window.SoundTravels = window.SoundTravels || {};
  window.SoundTravels.CircumplexPlugin = CircumplexPlugin;
})();
