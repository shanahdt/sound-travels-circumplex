/* trial-builder.js — assembles the per-participant trial list.
 *
 * Layout:
 *   1 practice clip (deterministic; same for every participant)
 *   N_PHASE_1 trials, one clip per cluster (warmup, maximally diverse)
 *   N_PHASE_2 trials, mixed across clusters with no two consecutive from the same cluster
 *   N_PHASE_3 trials, all from one randomly-chosen cluster (within-cluster fine-grained)
 *
 * Returns an array of clip records augmented with {phase, phase_idx, is_practice}.
 */
(function () {
  function shuffle(arr, rng) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pickOnePerCluster(clips, rng) {
    const byC = new Map();
    for (const c of clips) {
      if (!byC.has(c.cluster)) byC.set(c.cluster, []);
      byC.get(c.cluster).push(c);
    }
    const picks = [];
    for (const [, list] of byC) picks.push(list[Math.floor(rng() * list.length)]);
    return picks;
  }

  function pickPracticeClip(clips) {
    // Deterministic: pick the first clip from the smallest non-empty cluster (likely cluster 0).
    // This gives every participant the same practice item, which is convenient for QA.
    const sorted = clips.slice().sort((a, b) => (a.cluster - b.cluster) || a.id.localeCompare(b.id));
    return sorted[0];
  }

  function buildTrialList(manifest, rng) {
    const cfg = window.SoundTravels.config;
    const N1 = cfg.N_PHASE_1, N2 = cfg.N_PHASE_2, N3 = cfg.N_PHASE_3;
    const allClips = manifest.clips;

    // Practice (excluded from real-data analysis via phase=0).
    const practice = pickPracticeClip(allClips);
    const remainingAfterPractice = allClips.filter(c => c.id !== practice.id);

    // Phase 1: one per cluster.
    const phase1 = shuffle(pickOnePerCluster(remainingAfterPractice, rng), rng).slice(0, N1);

    // Phase 2: mixed sample, anti-repeat, no clip reuse.
    const usedAfter1 = new Set([practice.id, ...phase1.map(c => c.id)]);
    const pool2 = shuffle(remainingAfterPractice.filter(c => !usedAfter1.has(c.id)), rng);
    const phase2 = [];
    for (const c of pool2) {
      if (phase2.length >= N2) break;
      const last = phase2[phase2.length - 1];
      if (last && last.cluster === c.cluster) continue;
      phase2.push(c);
    }
    for (const c of pool2) {
      if (phase2.length >= N2) break;
      if (!phase2.includes(c)) phase2.push(c);
    }

    // Phase 3: all from one cluster.
    const usedAll = new Set([...usedAfter1, ...phase2.map(c => c.id)]);
    const remainingByC = new Map();
    for (const c of allClips) {
      if (usedAll.has(c.id)) continue;
      if (!remainingByC.has(c.cluster)) remainingByC.set(c.cluster, []);
      remainingByC.get(c.cluster).push(c);
    }
    const eligible = [...remainingByC.entries()].filter(([, l]) => l.length >= N3);
    let phase3 = [];
    if (eligible.length) {
      const [, list] = eligible[Math.floor(rng() * eligible.length)];
      phase3 = shuffle(list, rng).slice(0, N3);
    } else {
      const sorted = [...remainingByC.entries()].sort((a, b) => b[1].length - a[1].length);
      if (sorted.length) phase3 = shuffle(sorted[0][1], rng).slice(0, N3);
    }

    const p1len = phase1.length, p2len = phase2.length;
    return {
      practice: { ...practice, phase: 0, phase_idx: 0, is_practice: true },
      phase1: phase1.map((c, i) => ({...c, phase: 1, phase_idx: i + 1, is_practice: false})),
      phase2: phase2.map((c, i) => ({...c, phase: 2, phase_idx: p1len + i + 1, is_practice: false})),
      phase3: phase3.map((c, i) => ({...c, phase: 3, phase_idx: p1len + p2len + i + 1, is_practice: false})),
    };
  }

  // Seedable LCG so each participant's seed reproduces the same trial order.
  function makeRNG(seed) {
    let s = seed >>> 0;
    return () => { s = (1103515245 * s + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  }

  window.SoundTravels = window.SoundTravels || {};
  window.SoundTravels.buildTrialList = buildTrialList;
  window.SoundTravels.makeRNG = makeRNG;
  window.SoundTravels.shuffle = shuffle;
})();
