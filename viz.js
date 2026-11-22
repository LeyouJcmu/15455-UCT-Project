/*
 * Interactive visualizations for Complexity Notes.
 *
 * Embed one in any Markdown block with a line of its own:
 *     @[viz](NAME "Caption")
 *     @[viz](NAME?option=value "Caption")
 *
 * Available NAMEs:
 *   ladner-h         H(n) watching the machines; toggle the "a fast machine exists" world.
 *   ladner-shrink    The square-rooting recursion of Lemma 5.
 *   left-set         Click leaves to set the satisfying assignments; see the left set on every level.
 *   mahaney-search   The pruned search of Mahaney's proof on a made-up instance.
 *                    Options: r=1|2|3, mode=fortune (Fortune's early-accept variant).
 */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var GREEN = '#245c4b', LIME = '#d9e7a5', ORANGE = '#e48b5c', INK = '#202b30',
      LINE = '#d8ded8', PAPER = '#fffefa', GRAY = '#ece9e1', NOGRAY = '#c3c9c3';
  var CHIP = ['#cfe3f0', '#f3dccb', '#eadcf2', '#f6edb5', '#d6efe6', '#f2d4dc', '#dfe6c4', '#e4ddd0'];
  var SUB = '₀₁₂₃₄₅₆₇₈₉';
  var W = {};

  // ------------------------------------------------------------------ helpers
  function S(tag, attrs, parent, text) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    if (text !== undefined) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function H(tag, attrs, html) {
    var e = document.createElement(tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function sub(i) { return String(i).split('').map(function (d) { return SUB[+d]; }).join(''); }
  function bits(v, len) { var s = v.toString(2); while (s.length < len) s = '0' + s; return s; }
  function parseOpts(q) {
    var o = {};
    (q || '').split('&').forEach(function (kv) { if (kv) { var p = kv.split('='); o[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); } });
    return o;
  }
  function mulberry(a) {
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function mix(a) {
    a = (a ^ (a >>> 16)) >>> 0; a = Math.imul(a, 0x7feb352d); a ^= a >>> 15;
    a = Math.imul(a, 0x846ca68b); a ^= a >>> 16; return a >>> 0;
  }

  function frame(root, title, w, h, label) {
    clear(root);
    root.classList.add('viz-ready');
    var head = H('div', { class: 'viz-head' }, '<span class="viz-kicker">Interactive</span><strong>' + title + '</strong>');
    var svg = S('svg', { viewBox: '0 0 ' + w + ' ' + h, class: 'viz-svg', role: 'img', 'aria-label': label || title });
    var cap = H('p', { class: 'viz-caption', 'aria-live': 'polite' });
    var ctr = H('div', { class: 'viz-controls' });
    root.appendChild(head); root.appendChild(svg); root.appendChild(cap); root.appendChild(ctr);
    return { svg: svg, cap: cap, ctr: ctr };
  }
  function button(parent, label, onClick, cls) {
    var b = H('button', { type: 'button', class: 'viz-btn' + (cls ? ' ' + cls : '') }, label);
    b.addEventListener('click', onClick);
    parent.appendChild(b);
    return b;
  }
  function group(parent, label, options, current, onChange) {
    var g = H('div', { class: 'viz-group', role: 'group', 'aria-label': label });
    var btns = options.map(function (o) {
      var b = button(g, o.label, function () {
        btns.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        onChange(o.value);
      });
      b.setAttribute('aria-pressed', String(o.value === current));
      return b;
    });
    parent.appendChild(g);
    return g;
  }
  // step() advances one step and returns true while more steps remain.
  function player(ctr, step, reset, atEnd, delay) {
    var timer = null, playBtn;
    function stop() { clearInterval(timer); timer = null; playBtn.textContent = '▶ Play'; }
    function play() {
      if (timer) { stop(); return; }
      if (atEnd()) reset();
      playBtn.textContent = '❚❚ Pause';
      timer = setInterval(function () { if (!step()) stop(); }, delay || 1100);
    }
    button(ctr, '↺ Reset', function () { stop(); reset(); });
    button(ctr, 'Step →', function () { stop(); if (!atEnd()) step(); });
    playBtn = button(ctr, '▶ Play', play, 'viz-primary');
    return { stop: stop };
  }

  // ------------------------------------------------------------------ Ladner: H diagonalizes
  W['ladner-h'] = function (root) {
    var MAXM = 22, NM = 6, FAIL = [2, 5, 8, 12, 17, 23];
    var ui = frame(root, 'Watching H diagonalize', 640, 300,
      'Machines M1 to M6 on the left, each marked correct so far or caught; a staircase plot of H(n) against log n on the right.');
    var scenario = 'none', m = 0;

    function F() { return FAIL.map(function (f, i) { return scenario === 'fast' && i === 2 ? Infinity : f; }); }
    function Hof(mm) { var f = F(); for (var i = 0; i < NM; i++) if (f[i] > mm) return i + 1; return NM; }
    function X(mm) { return 316 + mm * (300 / MAXM); }
    function Y(v) { return 250 - (v - 1) * 38; }

    function draw() {
      var svg = ui.svg, f = F(), cur = Hof(m);
      clear(svg);
      S('text', { x: 16, y: 20, class: 'viz-h' }, svg, 'MACHINES, IN ENUMERATION ORDER');
      for (var i = 1; i <= NM; i++) {
        var y = 22 + i * 38, caught = f[i - 1] <= m, isCur = i === cur;
        S('rect', { x: 36, y: y - 16, width: 236, height: 30, rx: 4,
          fill: isCur ? LIME : caught ? GRAY : PAPER, stroke: isCur ? GREEN : LINE, 'stroke-width': isCur ? 2 : 1 }, svg);
        S('text', { x: 46, y: y + 4, class: 'viz-b viz-m' }, svg, 'M' + sub(i));
        var status = caught ? '✗ caught at input length ' + f[i - 1]
          : isCur ? (scenario === 'fast' && i === 3 && m >= 8 ? '✓ correct and fast, forever' : '✓ correct so far')
          : 'not reached yet';
        S('text', { x: 78, y: y + 4, class: caught ? 'viz-s' : isCur ? 'viz-g viz-b' : 'viz-s' }, svg, status);
        if (isCur) {
          S('path', { d: 'M14 ' + (y - 7) + ' L28 ' + y + ' L14 ' + (y + 7) + 'z', fill: ORANGE }, svg);
          S('text', { x: 8, y: y - 11, class: 'viz-s viz-o viz-b' }, svg, 'H(n)');
        }
      }
      // plot
      S('path', { d: 'M316 262 H624 M316 262 V30', stroke: INK, fill: 'none' }, svg);
      S('text', { x: 624, y: 280, 'text-anchor': 'end', class: 'viz-s' }, svg, 'log n  (longest input H(n) checks)');
      S('text', { x: 308, y: 26, 'text-anchor': 'end', class: 'viz-s viz-m' }, svg, 'H(n)');
      for (var v = 1; v <= NM; v++) {
        S('text', { x: 308, y: Y(v) + 4, 'text-anchor': 'end', class: 'viz-s' }, svg, String(v));
        S('line', { x1: 316, x2: 624, y1: Y(v), y2: Y(v), stroke: LINE, 'stroke-dasharray': '2 4' }, svg);
      }
      if (m > 0) {
        var d = 'M' + X(0) + ' ' + Y(Hof(0));
        for (var k = 1; k <= m; k++) d += ' H' + X(k) + ' V' + Y(Hof(k));
        S('path', { d: d, stroke: GREEN, 'stroke-width': 3, fill: 'none', 'stroke-linejoin': 'round' }, svg);
      }
      S('circle', { cx: X(m), cy: Y(cur), r: 5, fill: ORANGE }, svg);
      S('text', { x: 316, y: 296, class: 'viz-s' }, svg, 'Simplified: the real H(n) is also capped at ⌊log log n⌋.');
      ui.cap.innerHTML = caption();
    }

    function caption() {
      var f = F(), cur = Hof(m);
      if (m === 0) return 'H(n) is the first machine Mᵢ that answers correctly, within its time bound, on <em>every</em> input of length at most log n. As n grows, H(n) checks longer inputs. Press Step.';
      var prev = Hof(m - 1), txt = '<strong>log n = ' + m + '.</strong> ';
      if (f[prev - 1] === m) txt += 'Inputs of length ' + m + ' are now checked, and M' + sub(prev) + ' gets one wrong (or runs too long). H(n) moves on to M' + sub(cur) + '.';
      else txt += 'M' + sub(cur) + ' is still correct on every input of length ≤ ' + m + ', so H(n) stays at ' + cur + '.';
      if (m === MAXM) {
        txt += scenario === 'fast'
          ? ' <br><strong>Result:</strong> M₃ never fails, so H is stuck at 3 forever. The padding is only |ψ|³, a polynomial, so adding it is a Karp reduction from SAT to SAT<sub>H</sub>, and M₃ would solve SAT in polynomial time (Lemma 3). Since P ≠ NP, this world cannot happen.'
          : ' <br><strong>Result:</strong> every machine is eventually caught, so H keeps climbing: H(n) → ∞ (Lemma 4). The padding |ψ|<sup>H(|ψ|)</sup> outgrows every polynomial, which is what stops SAT<sub>H</sub> from being NP-complete (Lemma 5).';
      }
      return txt;
    }

    group(ui.ctr, 'Scenario', [
      { value: 'none', label: 'Every machine fails (P ≠ NP)' },
      { value: 'fast', label: 'Suppose M₃ really is fast' }
    ], scenario, function (v) { scenario = v; p.stop(); m = 0; draw(); });
    H('span', {}, '');
    ui.ctr.appendChild(H('span', { class: 'viz-sep' }));
    var p = player(ui.ctr, function () { m++; draw(); return m < MAXM; },
      function () { m = 0; draw(); }, function () { return m >= MAXM; }, 900);
    draw();
  };

  // ------------------------------------------------------------------ Ladner: Lemma 5 recursion
  W['ladner-shrink'] = function (root) {
    var ui = frame(root, 'The recursion in Lemma 5', 640, 270,
      'A stack of bars, one per recursive call; each bar is half as wide as the previous one on a log scale.');
    var E = 32, step = 0;
    function rows() { var r = [], e = E; for (;;) { r.push(e); if (e <= 4) break; e = e / 2; } return r; }
    function draw() {
      var svg = ui.svg, rs = rows();
      clear(svg);
      S('text', { x: 16, y: 18, class: 'viz-h' }, svg, 'LENGTH OF THE FORMULA AT EACH CALL  (LOG SCALE)');
      for (var i = 0; i <= Math.min(step, rs.length - 1); i++) {
        var e = rs[i], y = 34 + i * 46, w = Math.max(18, e / E * 470), last = i === rs.length - 1;
        S('text', { x: 16, y: y + 16, class: 'viz-s' }, svg, last ? 'table' : 'call ' + (i + 1));
        S('rect', { x: 70, y: y, width: w, height: 24, rx: 3, fill: last ? LIME : GREEN }, svg);
        var t = S('text', { x: 78 + w, y: y + 17, class: 'viz-b' }, svg, '|ψ| = 2');
        S('tspan', { dy: -6, 'font-size': 10 }, t, String(e));
        if (last) S('tspan', { dy: 6, class: 'viz-s', dx: 6 }, t, '≤ N₀: answer from the hard-coded table');
        if (i < step && !last) S('text', { x: 70, y: y + 40, class: 'viz-s viz-o' }, svg,
          '↓ compute f(ψ), check the padding, keep ψ′:  |ψ′| < |ψ|^(1/2)');
      }
      ui.cap.innerHTML = caption(rs);
    }
    function caption(rs) {
      if (step === 0) return 'Start with a formula of length 2<sup>' + E + '</sup>. Bar widths use a log scale, so <em>halving</em> a bar means <em>square-rooting</em> the length. Here c = 2, and we are past N₀, so H(|ψ′|) &gt; 2c = 4.';
      var e = rs[step - 1];
      if (step >= rs.length - 1) return '<strong>Done after ' + (rs.length - 1) + ' calls.</strong> Starting from length 2<sup>' + E + '</sup>, the number of calls is about log₂ ' + E + ' = log log |ψ|. Each call takes polynomial time, so algorithm A decides SAT in polynomial time, which is the contradiction Lemma 5 needs.';
      return '<strong>Call ' + step + '.</strong> The output y = f(ψ) has length at most |ψ|<sup>c</sup> = 2<sup>' + (2 * e) + '</sup>. If y = ψ′ 0 1…1 is well formed, its padding alone is longer than |ψ′|<sup>2c</sup> = |ψ′|<sup>4</sup>. So |ψ′|<sup>4</sup> &lt; 2<sup>' + (2 * e) + '</sup>, which forces |ψ′| &lt; 2<sup>' + (e / 2) + '</sup>.';
    }
    group(ui.ctr, 'Starting length', [
      { value: 16, label: '|ψ| = 2¹⁶' }, { value: 32, label: '|ψ| = 2³²' }, { value: 64, label: '|ψ| = 2⁶⁴' }
    ], E, function (v) { E = v; p.stop(); step = 0; draw(); });
    ui.ctr.appendChild(H('span', { class: 'viz-sep' }));
    var p = player(ui.ctr, function () { step++; draw(); return step < rows().length - 1; },
      function () { step = 0; draw(); }, function () { return step >= rows().length - 1; }, 1300);
    draw();
  };

  // ------------------------------------------------------------------ Left set (Lemma B)
  W['left-set'] = function (root) {
    var n = 4, N = 16, LW = 34, X0 = 76;
    var sat = [3, 5, 10];
    var ui = frame(root, 'The left set on every level', 640, 236,
      'Four rows of prefixes above sixteen leaves. Yes-prefixes are shaded and always form a block from the left ending at the prefix of z star.');
    function zstar() { return sat.length ? Math.max.apply(null, sat) : -1; }
    var hint = 'Click a leaf to make it satisfying or not. Hover over any block to see the query it stands for.';

    function describe(k, u) {
      var z = zstar(), span = 1 << (n - k), leaf = u * span, yes = z >= 0 && leaf <= z;
      var ub = bits(u, k), lb = bits(leaf, n);
      return 'Q(' + ub + ') = ⟨φ, ' + lb + '⟩ asks: is there a satisfying assignment at or to the right of leaf ' + lb + '? ' +
        (z < 0 ? '<strong>No</strong>: φ has no satisfying assignment.' :
         yes ? '<strong>Yes</strong>, because z* = ' + bits(z, n) + ' ≥ ' + lb + '.' :
               '<strong>No</strong>: the largest satisfying assignment, z* = ' + bits(z, n) + ', is to its left.');
    }
    function summary() {
      var z = zstar();
      if (z < 0) return 'φ has no satisfying assignment, so every query is a no. ' + hint;
      return 'z* = <strong>' + bits(z, n) + '</strong>. On every level, the yes-prefixes (shaded) are exactly those ≤ p<sub>k</sub>: a block starting at the far left and ending at the prefix of z*. That is Lemma B. ' + hint;
    }
    function draw() {
      var svg = ui.svg, z = zstar();
      clear(svg);
      for (var k = 1; k <= n; k++) {
        var y = 10 + (k - 1) * 48, span = 1 << (n - k);
        S('text', { x: 12, y: y + 20, class: 'viz-s' }, svg, k === n ? 'leaves' : 'k = ' + k);
        for (var u = 0; u < (1 << k); u++) {
          var leaf = u * span, yes = z >= 0 && leaf <= z, isP = z >= 0 && (z >> (n - k)) === u;
          var x = X0 + leaf * LW, w = span * LW - 4;
          var g = S('g', { tabindex: 0, class: k === n ? 'viz-hit' : null, role: k === n ? 'button' : null,
            'aria-label': k === n ? 'Leaf ' + bits(u, n) + (sat.indexOf(u) >= 0 ? ', satisfying' : '') : null }, svg);
          S('rect', { x: x, y: y, width: w, height: 30, rx: 3, fill: yes ? LIME : GRAY,
            stroke: isP ? GREEN : LINE, 'stroke-width': isP ? 3 : 1 }, g);
          S('text', { x: x + w / 2, y: y + 19, 'text-anchor': 'middle', class: 'viz-mono' }, g, bits(u, k));
          if (isP && k < n) S('text', { x: x + w - 4, y: y - 3, 'text-anchor': 'end', class: 'viz-s viz-g viz-b' }, g, 'p' + sub(k));
          if (k === n && sat.indexOf(u) >= 0) S('circle', { cx: x + w / 2, cy: y + 40, r: 4.5, fill: ORANGE }, g);
          if (k === n && u === z) S('text', { x: x + w / 2, y: y + 58, 'text-anchor': 'middle', class: 'viz-b viz-g viz-m' }, g, 'z*');
          (function (k, u, g) {
            var show = function () { ui.cap.innerHTML = describe(k, u); };
            g.addEventListener('mouseenter', show);
            g.addEventListener('focus', show);
            g.addEventListener('mouseleave', function () { ui.cap.innerHTML = summary(); });
            if (k === n) {
              var toggle = function () {
                var i = sat.indexOf(u);
                if (i >= 0) sat.splice(i, 1); else sat.push(u);
                draw();
              };
              g.addEventListener('click', toggle);
              g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
            }
          })(k, u, g);
        }
      }
      S('circle', { cx: X0 + 6, cy: 226, r: 4.5, fill: ORANGE }, svg);
      S('text', { x: X0 + 16, y: 230, class: 'viz-s' }, svg, 'satisfies φ');
      S('rect', { x: X0 + 100, y: 220, width: 12, height: 12, fill: LIME, stroke: LINE }, svg);
      S('text', { x: X0 + 118, y: 230, class: 'viz-s' }, svg, 'Q(u) ∈ L (yes)');
      S('rect', { x: X0 + 220, y: 220, width: 12, height: 12, fill: GRAY, stroke: LINE }, svg);
      S('text', { x: X0 + 238, y: 230, class: 'viz-s' }, svg, 'no');
      ui.cap.innerHTML = summary();
    }
    button(ui.ctr, 'Random formula', function () {
      sat = [];
      var c = 1 + Math.floor(Math.random() * 3);
      while (sat.length < c) { var v = Math.floor(Math.random() * N); if (sat.indexOf(v) < 0) sat.push(v); }
      draw();
    });
    button(ui.ctr, 'No solutions', function () { sat = []; draw(); });
    draw();
  };

  // ------------------------------------------------------------------ Mahaney / Fortune search
  W['mahaney-search'] = function (root, data) {
    var opts = parseOpts(data.vizOpts), fortune = opts.mode === 'fortune';
    var n = 5, N = 32, r = Math.min(3, Math.max(1, +opts.r || 2)), seed = 3, truth = true;
    var inst, frames, fi = -1;
    var PH = { expand: 0, g: 1, collision: 2, census: 3, 'fortune-ok': 3, early: 3, final: 4 };
    var ui = frame(root, fortune ? 'Fortune’s algorithm, step by step' : 'The pruned search, step by step', 640, 330,
      'Rows of candidate prefixes, one row per level, with their g-values. Removed candidates are crossed out; a strip of leaves at the bottom shows the hidden truth.');

    function newInstance() {
      var R = mulberry(seed * 7919 + 17), sat = [];
      if (R() < 0.8) {
        var cnt = 1 + Math.floor(R() * 3);
        while (sat.length < cnt) { var v = Math.floor(R() * N); if (sat.indexOf(v) < 0) sat.push(v); }
      }
      inst = { sat: sat, z: sat.length ? Math.max.apply(null, sat) : -1, salt: Math.floor(R() * 1e9) };
    }
    function isYes(leaf) { return inst.z >= 0 && leaf <= inst.z; }
    function leafOf(u) { var s = u; while (s.length < n) s += '0'; return parseInt(s, 2); }
    // A simulated reduction g: yes-queries land on one of only r strings of the sparse set
    // (Mahaney); for Fortune the sparse set holds the no-queries instead.
    function gTok(leaf) {
      var hv = mix((leaf + 1) * 2654435761 ^ inst.salt), yes = isYes(leaf);
      return (fortune ? !yes : yes) ? 'S' + (hv % r) : 'N' + (hv % 41);
    }
    function letter(i) { return String.fromCharCode(65 + (i % 26)) + (i >= 26 ? '′' : ''); }

    function build() {
      frames = []; fi = -1;
      var C = [''], labels = {}, nextLab = 0, levels = [], final = null;
      for (var k = 1; k <= n && !final; k++) {
        var cand = [];
        C.forEach(function (u) { cand.push(u + '0', u + '1'); });
        cand.sort();
        var pk = inst.z >= 0 ? bits(inst.z, n).slice(0, k) : null;
        var items = cand.map(function (u) {
          var leaf = leafOf(u), tok = gTok(leaf);
          if (!(tok in labels)) labels[tok] = nextLab++;
          return { u: u, tok: tok, lab: labels[tok], yes: isYes(leaf), isP: u === pk };
        });
        var lv = { k: k, items: items, coll: [], cut: [] };
        levels.push(lv);
        frames.push({ k: k, phase: 'expand' }, { k: k, phase: 'g' });
        var best = {};
        items.forEach(function (it) { if (!(it.tok in best) || it.u > best[it.tok].u) best[it.tok] = it; });
        items.forEach(function (it) { if (best[it.tok] !== it) { it.coll = true; lv.coll.push(it.u); } });
        frames.push({ k: k, phase: 'collision' });
        var alive = items.filter(function (it) { return !it.coll; });
        if (fortune) {
          if (alive.length > r) { frames.push({ k: k, phase: 'early' }); final = { accept: true, early: true }; break; }
          frames.push({ k: k, phase: 'fortune-ok' });
          C = alive.map(function (it) { return it.u; });
        } else {
          alive.slice(r).forEach(function (it) { it.cut = true; lv.cut.push(it.u); });
          frames.push({ k: k, phase: 'census' });
          C = alive.slice(0, r).map(function (it) { return it.u; });
        }
      }
      if (!final) {
        var hit = C.filter(function (u) { return inst.sat.indexOf(parseInt(u, 2)) >= 0; });
        final = { accept: hit.length > 0, hit: hit };
        frames.push({ k: levels.length, phase: 'final' });
      }
      inst.levels = levels; inst.final = final;
    }

    function draw() {
      var svg = ui.svg, f = frames[fi];
      clear(svg);
      var curK = f ? f.k : 0, ph = f ? PH[f.phase] : -1, isFinal = f && f.phase === 'final';
      if (!f) {
        S('text', { x: 320, y: 140, 'text-anchor': 'middle', class: 'viz-s' }, svg, 'Press Step to start at the root.');
      }
      inst.levels.forEach(function (lv) {
        if (lv.k > curK) return;
        var y = 10 + (lv.k - 1) * 50, p = (lv.k < curK || isFinal) ? 9 : ph;
        S('text', { x: 12, y: y + 21, class: 'viz-s' }, svg, 'k = ' + lv.k);
        var kept = 0;
        lv.items.forEach(function (it, j) {
          var x = 56 + j * 76, showG = p >= 1, collNow = p >= 2 && it.coll, cutNow = p >= 3 && it.cut;
          var removed = collNow || cutNow;
          if (!removed && p >= 2) kept++;
          var g = S('g', { opacity: removed ? 0.38 : 1 }, svg);
          var stroke = LINE, sw = 1, dash = null;
          if (truth) { stroke = it.yes ? GREEN : NOGRAY; sw = it.isP ? 3.2 : 1.6; dash = it.yes ? null : '4 3'; }
          S('rect', { x: x, y: y, width: 68, height: 34, rx: 5, fill: showG ? CHIP[it.lab % CHIP.length] : PAPER,
            stroke: stroke, 'stroke-width': sw, 'stroke-dasharray': dash }, g);
          S('text', { x: x + 34, y: y + (showG ? 15 : 21), 'text-anchor': 'middle', class: 'viz-mono viz-b' }, g, it.u);
          if (showG) S('text', { x: x + 34, y: y + 28, 'text-anchor': 'middle', class: 'viz-s' }, g, 'g = ' + letter(it.lab));
          if (truth && it.isP) S('text', { x: x + 66, y: y - 3, 'text-anchor': 'end', class: 'viz-s viz-g viz-b' }, svg, 'p' + sub(lv.k));
          if (collNow) S('path', { d: 'M' + (x + 4) + ' ' + (y + 30) + 'L' + (x + 64) + ' ' + (y + 4), stroke: ORANGE, 'stroke-width': 2.5 }, svg);
          if (cutNow) S('path', { d: 'M' + (x + 4) + ' ' + (y + 17) + 'H' + (x + 64), stroke: '#8a958f', 'stroke-width': 2 }, svg);
        });
        if (p >= 3) S('text', { x: 628, y: y + 21, 'text-anchor': 'end', class: 'viz-s' }, svg,
          'kept ' + kept + ' of ' + lv.items.length);
        else if (p === 2) S('text', { x: 628, y: y + 21, 'text-anchor': 'end', class: 'viz-s' }, svg,
          kept + ' left after collisions');
      });
      if (truth) {
        var y0 = 268;
        S('text', { x: 12, y: y0 + 11, class: 'viz-s' }, svg, 'truth');
        for (var leaf = 0; leaf < N; leaf++) {
          var x = 56 + leaf * 17.5;
          S('rect', { x: x, y: y0, width: 15.5, height: 14, fill: isYes(leaf) ? LIME : GRAY, stroke: LINE }, svg);
          if (inst.sat.indexOf(leaf) >= 0) S('circle', { cx: x + 7.75, cy: y0 + 22, r: 3.5, fill: ORANGE }, svg);
          if (leaf === inst.z) S('text', { x: x + 7.75, y: y0 + 40, 'text-anchor': 'middle', class: 'viz-s viz-g viz-b' }, svg, 'z*');
        }
        S('text', { x: 56, y: y0 - 6, class: 'viz-s' }, svg,
          inst.z >= 0 ? 'hidden truth: leaves 00000 … 11111, shaded up to z* (the yes-region of L), dots satisfy φ'
                      : 'hidden truth: this φ is unsatisfiable, so every query is a no');
      }
      ui.cap.innerHTML = caption(f);
    }

    function list(a) { return a.map(function (u) { return '<code>' + u + '</code>'; }).join(', '); }
    function caption(f) {
      if (!f) {
        return 'A made-up formula with n = 5 variables and a simulated reduction g into a sparse set with room for r = ' + r +
          ' strings. (No real example exists unless P = NP.) ' + (truth ? 'Solid outlines are yes-instances of the left set, which the algorithm cannot see.' : '') + ' Press Step.';
      }
      var lv = inst.levels[f.k - 1], pk = truth && inst.z >= 0 ? ' The true prefix p<sub>' + f.k + '</sub> = <code>' + bits(inst.z, n).slice(0, f.k) + '</code> (thick outline) is still there.' : '';
      switch (f.phase) {
        case 'expand': return '<strong>Level ' + f.k + ', expand.</strong> Extend every surviving prefix by 0 and by 1: ' + lv.items.length + ' candidates.';
        case 'g': return '<strong>Compute g(Q(u)).</strong> The algorithm cannot tell which values lie in the sparse set, but it can see when two values are equal (same letter and color). Equal values mean equal answers.';
        case 'collision': return '<strong>Collision rule.</strong> ' + (lv.coll.length
          ? 'For each repeated value, keep only the largest prefix. Removed: ' + list(lv.coll) + '. By Lemma C, none of them can be p<sub>k</sub>.'
          : 'Every value is different, so nothing is removed.') + pk;
        case 'census': return '<strong>Census rule.</strong> ' + (lv.cut.length
          ? 'Keep only the r = ' + r + ' smallest. Dropped: ' + list(lv.cut) + '. By Lemma D, p<sub>k</sub> is among the r smallest.'
          : 'At most r = ' + r + ' candidates remain, so nothing is dropped.') + pk;
        case 'fortune-ok': return '<strong>Early-accept check.</strong> At most r = ' + r + ' candidates remain after the collision rule, so there is no early accept. Keep all of them.' + pk;
        case 'early': return '<strong>Early accept!</strong> More than r = ' + r + ' candidates remain, all with different values. If φ were unsatisfiable, every candidate would be a no-instance, so every value would be a string of the sparse set A, which has room for only r. So φ is satisfiable.' + (truth ? ' (Correct: z* = <code>' + bits(inst.z, n) + '</code>.)' : '');
        case 'final': return inst.final.accept
          ? '<strong>Bottom of the tree.</strong> Check the surviving assignments directly: <code>' + inst.final.hit[0] + '</code> satisfies φ, so <strong>accept</strong>.' + (fortune ? '' : ' It is z*, exactly as the invariant promised.')
          : '<strong>Bottom of the tree.</strong> None of the surviving assignments satisfies φ, so <strong>reject</strong>.' + (truth ? ' (Correct: this φ has no satisfying assignment.)' : '');
      }
      return '';
    }

    var p = player(ui.ctr, function () { fi++; draw(); return fi < frames.length - 1; },
      function () { fi = -1; draw(); }, function () { return fi >= frames.length - 1; }, 1200);
    button(ui.ctr, 'New formula', function () { p.stop(); seed++; newInstance(); build(); draw(); });
    group(ui.ctr, 'Room in the sparse set', [1, 2, 3].map(function (v) { return { value: v, label: 'r = ' + v }; }), r,
      function (v) { p.stop(); r = v; build(); draw(); });
    var lab = H('label', { class: 'viz-check' });
    var cb = H('input', { type: 'checkbox' });
    cb.checked = truth;
    cb.addEventListener('change', function () { truth = cb.checked; draw(); });
    lab.appendChild(cb);
    lab.appendChild(document.createTextNode(' Show hidden truth'));
    ui.ctr.appendChild(lab);
    newInstance(); build(); draw();
  };

  // ------------------------------------------------------------------ mount
  window.Viz = {
    mount: function (scope) {
      (scope || document).querySelectorAll('.viz[data-viz]:not(.viz-ready)').forEach(function (el) {
        var f = W[el.getAttribute('data-viz')];
        if (!f) { el.textContent = 'Unknown visualization: ' + el.getAttribute('data-viz'); el.classList.add('viz-ready'); return; }
        try { f(el, el.dataset); } catch (e) { el.textContent = 'This visualization failed to load.'; if (window.console) console.error(e); }
      });
    },
    names: function () { return Object.keys(W); }
  };
})();
