/*
 * Complexity Notes — shared site script.
 *
 *  - Builds the header navigation and the previous/next pager from PAGES.
 *  - Renders every <script type="text/markdown"> block on the page as Markdown + LaTeX
 *    (marked + KaTeX), with theorem/proof boxes, figures, videos and footnotes.
 *  - Renders $...$ math anywhere else on the page (hero text, cards).
 *  - Edit mode: open any page with ?edit to edit blocks in the browser with a live
 *    preview, then copy the Markdown back into the HTML file.
 *
 * Authoring syntax is documented in README.md and demonstrated on authoring.html.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------- site map
  var PAGES = [
    { href: '1_home.html',         nav: 'Home',          title: 'Is NP split cleanly in two?' },
    { href: '2_npi.html',           nav: 'Ladner',        title: 'NPI and Ladner\u2019s Theorem' },
    { href: '3_sparse.html',        nav: 'Sparse sets',   title: 'Sparse sets and the Berman\u2013Hartmanis conjecture' },
    { href: '4_mahaney.html',       nav: 'Mahaney I',     title: 'Mahaney\u2019s Theorem: statement and strategy' },
    { href: '5_mahaney-proof.html', nav: 'Mahaney II',    title: 'Mahaney\u2019s Theorem: the proof' },
    { href: '6_consequences.html',  nav: 'Extensions',    title: 'Consequences and extensions' },
    { href: '7_glossary.html',      nav: 'Glossary',      title: 'Glossary and key takeaways' }
  ];

  // LaTeX shortcuts available in every formula. Add your own here.
  var MACROS = {
    '\\P': '\\mathsf{P}',
    '\\NP': '\\mathsf{NP}',
    '\\coNP': '\\mathsf{coNP}',
    '\\NPI': '\\mathsf{NPI}',
    '\\NPC': '\\mathsf{NPC}',
    '\\E': '\\mathsf{E}',
    '\\NE': '\\mathsf{NE}',
    '\\PH': '\\mathsf{PH}',
    '\\Ppoly': '\\mathsf{P/poly}',
    '\\SAT': '\\mathrm{SAT}',
    '\\redm': '\\le_{m}^{p}',
    '\\redbtt': '\\le_{btt}^{p}',
    '\\redT': '\\le_{T}^{p}',
    '\\iso': '\\cong_{p}',
    '\\enc': '\\langle #1 \\rangle',
    '\\bits': '\\{0,1\\}'
  };

  // Box types for ":::type Title" containers. Unknown types get a capitalized label.
  var ENV_LABELS = {
    theorem: 'Theorem', lemma: 'Lemma', corollary: 'Corollary', proposition: 'Proposition',
    claim: 'Claim', definition: 'Definition', conjecture: 'Conjecture', proof: 'Proof',
    remark: 'Remark', example: 'Example', intuition: 'Intuition', note: 'Note',
    warning: 'Caution', takeaways: 'Key takeaways', box: '',
    why: 'Why this step', status: 'Where we are'
  };

  var here = decodeURIComponent(location.pathname.split('/').pop() || '1_home.html');
  var editMode = /(?:^|[?&])edit(?:=|&|$)/.test(location.search.slice(1));
  var blocks = [];

  // ---------------------------------------------------------------- helpers
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function slug(s) {
    return String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '')
      .trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 60) || 'section';
  }

  function dedent(text) {
    var lines = text.replace(/\r\n?/g, '\n').split('\n');
    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    var min = Infinity;
    lines.forEach(function (l) {
      if (l.trim()) min = Math.min(min, l.match(/^[ \t]*/)[0].length);
    });
    if (min === Infinity) min = 0;
    return lines.map(function (l) { return l.slice(min); }).join('\n');
  }

  function texToHtml(tex, display) {
    if (!window.katex) return esc(display ? '$$' + tex + '$$' : '$' + tex + '$');
    try {
      return window.katex.renderToString(tex, {
        displayMode: display, throwOnError: false, strict: 'ignore',
        macros: Object.assign({}, MACROS)
      });
    } catch (e) {
      return '<code class="tex-error">' + esc(tex) + '</code>';
    }
  }

  // ---------------------------------------------------------------- markdown
  function renderMarkdown(src) {
    var math = [], code = [], footnotes = {};
    function stash(arr, val, tag) { return '\u27E6' + tag + (arr.push(val) - 1) + '\u27E7'; }
    function restoreCode(s) {
      return s.replace(/\u27E6C(\d+)\u27E7/g, function (m, i) { return code[+i]; });
    }
    function restoreMath(s) {
      return s
        .replace(/\u27E6M(\d+)\u27E7/g, function (m, i) {
          var item = math[+i];
          return texToHtml(item.tex.replace(/\u27E6D\u27E7/g, '\\$'), item.display);
        })
        .replace(/\u27E6D\u27E7/g, '$');
    }
    function md(s) { return window.marked ? window.marked.parse(restoreCode(s)) : '<pre>' + esc(restoreCode(s)) + '</pre>'; }
    function inline(s) { return window.marked ? window.marked.parseInline(restoreCode(s)) : esc(restoreCode(s)); }

    // 1. Protect code so nothing inside it is treated as math or syntax.
    src = src.replace(/^(```|~~~)[^\n]*\n[\s\S]*?\n\1[ \t]*$/gm, function (m) { return stash(code, m, 'C'); });
    src = src.replace(/`[^`\n]+`/g, function (m) { return stash(code, m, 'C'); });

    // 2. Protect math before Markdown can mangle \\, _, * or |.
    src = src.replace(/\\\$/g, '\u27E6D\u27E7');
    src = src.replace(/\$\$([\s\S]+?)\$\$/g, function (m, t) { return stash(math, { tex: t, display: true }, 'M'); });
    src = src.replace(/\\\[([\s\S]+?)\\\]/g, function (m, t) { return stash(math, { tex: t, display: true }, 'M'); });
    src = src.replace(/\\\(([\s\S]+?)\\\)/g, function (m, t) { return stash(math, { tex: t, display: false }, 'M'); });
    src = src.replace(/\$([^\s$](?:[^$\n]*?[^\s$])?)\$/g, function (m, t) { return stash(math, { tex: t, display: false }, 'M'); });

    // 3. Footnotes: "[^id]: text" definitions (one line) and "[^id]" references.
    src = src.replace(/^\[\^([^\]\s]+)\]:[ \t]+(.+)$/gm, function (m, id, text) {
      footnotes[id] = text; return '';
    });
    src = src.replace(/\[\^([^\]\s]+)\]/g, function (m, id) {
      return '<sup class="fnref" data-fn="' + esc(id) + '"></sup>';
    });

    // 4. Explicit heading ids: "## Title {#my-id}".
    src = src.replace(/^(#{1,6}[ \t].*?)[ \t]*\{#([\w-]+)\}[ \t]*$/gm, function (m, h, id) {
      return h + ' \u27E6ID:' + id + '\u27E7';
    });

    // 5. Media on their own line: images become figures, @[...](...) becomes a video.
    function mediaHtml(kind, alt, url, title, attrs) {
      var style = '';
      var w = attrs && attrs.match(/width\s*=\s*([\d.]+(?:px|%|em|rem)?)/);
      if (w) style = ' style="width:' + (/^[\d.]+$/.test(w[1]) ? w[1] + 'px' : w[1]) + '"';
      var body;
      if (kind === 'video' && alt.trim().toLowerCase() === 'viz') {
        var q = url.indexOf('?');
        var name = q < 0 ? url : url.slice(0, q), vopts = q < 0 ? '' : url.slice(q + 1);
        return '\n\n<figure class="md-figure viz-figure"><div class="viz" data-viz="' + esc(name) + '" data-viz-opts="' + esc(vopts) +
          '"><p class="viz-loading">Loading interactive figure…</p></div>' +
          (title ? '<figcaption>' + inline(title) + '</figcaption>' : '') + '</figure>\n\n';
      }
      if (kind === 'img') {
        body = '<img src="' + esc(url) + '" alt="' + esc(alt) + '" loading="lazy">';
      } else {
        var yt = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
        var vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
        var label = esc(alt || title || 'Video');
        if (yt || vimeo) {
          var embed = yt ? 'https://www.youtube-nocookie.com/embed/' + yt[1] : 'https://player.vimeo.com/video/' + vimeo[1];
          body = '<div class="video-frame"><iframe src="' + embed + '" title="' + label +
            '" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>';
        } else {
          body = '<video controls preload="metadata" src="' + esc(url) + '" aria-label="' + label + '"></video>';
        }
      }
      var cap = title ? '<figcaption>' + inline(title) + '</figcaption>' : '';
      return '\n\n<figure class="md-figure"' + style + '>' + body + cap + '</figure>\n\n';
    }
    var mediaRe = /\]\(\s*([^)\s]+)(?:\s+"([^"]*)")?\s*\)(\{[^}]*\})?[ \t]*$/.source;
    src = src.replace(new RegExp('^[ \\t]*@\\[([^\\]]*)' + mediaRe, 'gm'), function (m, alt, url, title, attrs) {
      return mediaHtml('video', alt, url, title, attrs);
    });
    src = src.replace(new RegExp('^[ \\t]*!\\[([^\\]]*)' + mediaRe, 'gm'), function (m, alt, url, title, attrs) {
      return mediaHtml('img', alt, url, title, attrs);
    });

    // 6. ":::type Title" ... ":::" boxes (nestable), Markdown everywhere else.
    function renderBlocks(text) {
      var lines = text.split('\n'), out = '', buf = [];
      function flush() { if (buf.length) { out += md(buf.join('\n')); buf = []; } }
      for (var i = 0; i < lines.length; i++) {
        var open = lines[i].match(/^\s*:{3,}\s*([A-Za-z][\w-]*)\s*(.*)$/);
        if (!open) { buf.push(lines[i]); continue; }
        var depth = 1, inner = [], j = i + 1;
        for (; j < lines.length; j++) {
          if (/^\s*:{3,}\s*[A-Za-z]/.test(lines[j])) depth++;
          else if (/^\s*:{3,}\s*$/.test(lines[j]) && --depth === 0) break;
          inner.push(lines[j]);
        }
        flush();
        var type = open[1].toLowerCase();
        var label = Object.prototype.hasOwnProperty.call(ENV_LABELS, type)
          ? ENV_LABELS[type] : type.charAt(0).toUpperCase() + type.slice(1);
        var title = open[2].trim();
        var head = [label, title ? inline(title) : ''].filter(Boolean).join(' ');
        out += '<div class="env env-' + esc(type) + '">' +
          (head ? '<div class="env-head">' + head + '</div>' : '') +
          renderBlocks(inner.join('\n')) + '</div>';
        i = j;
      }
      flush();
      return out;
    }

    var html = renderBlocks(src)
      .replace(/<h([1-6])([^>]*)>([\s\S]*?)\s*\u27E6ID:([\w-]+)\u27E7<\/h\1>/g, '<h$1$2 id="$4">$3</h$1>');
    html = restoreMath(html);
    Object.keys(footnotes).forEach(function (id) { footnotes[id] = restoreMath(inline(footnotes[id])); });
    return { html: html, footnotes: footnotes };
  }

  function renderInto(block, src) {
    var res = renderMarkdown(src);
    block.footnotes = res.footnotes;
    block.out.innerHTML = res.html;
    block.out.querySelectorAll('table').forEach(function (t) {
      var wrap = document.createElement('div');
      wrap.className = 'table-wrap';
      t.parentNode.insertBefore(wrap, t);
      wrap.appendChild(t);
    });
    if (window.Viz) window.Viz.mount(block.out);
  }

  function renderAllBlocks() {
    document.querySelectorAll('script[type="text/markdown"]').forEach(function (script, i) {
      var out = document.createElement('div');
      out.className = 'prose md-rendered';
      script.parentNode.insertBefore(out, script.nextSibling);
      var block = {
        key: script.getAttribute('data-md') || 'block-' + (i + 1),
        script: script, out: out, footnotes: {},
        source: dedent(script.textContent)
      };
      if (i === 0) out.classList.add('first');
      blocks.push(block);
      renderInto(block, block.source);
    });
  }

  // ---------------------------------------------------------------- page furniture
  function headingText(h) {
    var c = h.cloneNode(true);
    c.querySelectorAll('.katex-html, .fnref, annotation').forEach(function (n) { n.remove(); });
    return c.textContent;
  }

  function headingHtml(h) {
    var c = h.cloneNode(true);
    c.querySelectorAll('.fnref, a').forEach(function (n) {
      if (n.classList.contains('fnref')) n.remove();
      else n.replaceWith.apply(n, Array.prototype.slice.call(n.childNodes));
    });
    return c.innerHTML;
  }

  function assignHeadingIds() {
    document.querySelectorAll('.md-rendered h2, .md-rendered h3').forEach(function (h) {
      if (h.id) return;
      var base = slug(headingText(h)), id = base, n = 2;
      while (document.getElementById(id)) id = base + '-' + n++;
      h.id = id;
    });
  }

  function finalizeFootnotes() {
    var defs = {};
    blocks.forEach(function (b) { Object.assign(defs, b.footnotes); });
    var order = [], num = {};
    document.querySelectorAll('.md-rendered sup.fnref').forEach(function (sup) {
      var id = sup.getAttribute('data-fn'), first = false;
      if (!(id in num)) { num[id] = order.push(id); first = true; }
      var sid = slug(id);
      var text = defs[id] || '<em>Missing footnote \u201C' + esc(id) + '\u201D</em>';
      sup.innerHTML = '<a href="#fn-' + sid + '"' + (first ? ' id="fnref-' + sid + '"' : '') +
        ' aria-label="Footnote ' + num[id] + '">' + num[id] + '</a>' +
        '<span class="fn-pop" role="tooltip">' + text + '</span>';
    });
    var old = document.getElementById('footnotes');
    if (old) old.remove();
    if (!order.length) return;
    var sec = document.createElement('section');
    sec.id = 'footnotes';
    sec.className = 'prose footnotes';
    sec.innerHTML = '<h2 id="notes">Notes</h2><ol>' + order.map(function (id) {
      var sid = slug(id);
      return '<li id="fn-' + sid + '">' + (defs[id] || '<em>Missing footnote \u201C' + esc(id) + '\u201D</em>') +
        ' <a class="fn-back" href="#fnref-' + sid + '" aria-label="Back to text">\u21A9</a></li>';
    }).join('') + '</ol>';
    var host = document.querySelector('.article-body') || document.querySelector('main');
    host.appendChild(sec);
  }

  function buildToc() {
    var article = document.querySelector('.article');
    if (!article) return;
    var old = article.querySelector('.toc');
    if (old) old.remove();
    var hs = article.querySelectorAll('.article-body > .prose > h2');
    if (hs.length < 2) { article.classList.remove('has-toc'); return; }
    var nav = document.createElement('nav');
    nav.className = 'toc';
    nav.setAttribute('aria-label', 'On this page');
    nav.innerHTML = '<p class="eyebrow">On this page</p><ol>' + Array.prototype.map.call(hs, function (h) {
      return '<li><a href="#' + h.id + '"><span>' + headingHtml(h) + '</span></a></li>';
    }).join('') + '</ol>';
    article.insertBefore(nav, article.firstChild);
    article.classList.add('has-toc');
  }

  function buildHeader() {
    var header = document.getElementById('site-header');
    if (!header) return;
    header.innerHTML = '<a class="brand" href="1_home.html">COMPLEXITY NOTES <span>/ NPI &amp; Mahaney</span></a>' +
      '<nav aria-label="Main navigation">' + PAGES.map(function (p, i) {
        return '<a href="' + p.href + '"' + (p.href === here ? ' aria-current="page"' : '') + '>' +
          '<span class="nav-num">' + (i + 1) + '</span>' + esc(p.nav) + '</a>';
      }).join('') + '</nav>';
  }

  function buildFooter() {
    var footer = document.getElementById('site-footer');
    if (!footer) return;
    var i = -1;
    PAGES.forEach(function (p, k) { if (p.href === here) i = k; });
    var pager = '';
    if (i >= 0) {
      var prev = PAGES[i - 1], next = PAGES[i + 1];
      pager = '<nav class="wrap pager" aria-label="Previous and next page">' +
        (prev ? '<a class="pager-link" href="' + prev.href + '"><span>\u2190 Page ' + i + '</span><strong>' + esc(prev.title) + '</strong></a>' : '<span></span>') +
        (next ? '<a class="pager-link next" href="' + next.href + '"><span>Page ' + (i + 2) + ' \u2192</span><strong>' + esc(next.title) + '</strong></a>' : '<span></span>') +
        '</nav>';
    }
    footer.innerHTML = pager + '<div class="wrap closing"><p>NPI and Mahaney\u2019s Theorem \u00B7 a 15-455 teaching site</p>' +
      '<p><a href="#top">Back to top \u2191</a></p></div>';
  }

  function renderLooseMath() {
    var main = document.querySelector('main');
    if (!main || !window.renderMathInElement) return;
    window.renderMathInElement(main, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false },
        { left: '$', right: '$', display: false }
      ],
      ignoredClasses: ['md-rendered', 'md-editor', 'md-bar', 'footnotes', 'toc'],
      macros: Object.assign({}, MACROS),
      throwOnError: false,
      strict: 'ignore'
    });
  }

  function finalizeAll() {
    assignHeadingIds();
    finalizeFootnotes();
    buildToc();
  }

  // ---------------------------------------------------------------- edit mode
  function draftKey(block) { return 'mdDraft:' + location.pathname + ':' + block.key; }
  function loadDraft(block) { try { return localStorage.getItem(draftKey(block)); } catch (e) { return null; } }
  function saveDraft(block, text) {
    try {
      if (text === block.source) localStorage.removeItem(draftKey(block));
      else localStorage.setItem(draftKey(block), text);
    } catch (e) { /* storage unavailable: drafts just won't persist */ }
  }
  function currentText(block) {
    var d = loadDraft(block);
    return d === null ? block.source : d;
  }
  function updateBadge(block) {
    var badge = block.bar.querySelector('.md-draft-badge');
    badge.hidden = currentText(block) === block.source;
  }

  function insertText(ta, text, selectFrom, selectLen) {
    var s = ta.selectionStart, e = ta.selectionEnd;
    ta.focus();
    var ok = false;
    try { ok = document.execCommand('insertText', false, text); } catch (err) { ok = false; }
    if (!ok) ta.setRangeText(text, s, e, 'end');
    if (selectFrom !== undefined) ta.setSelectionRange(s + selectFrom, s + selectFrom + selectLen);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // Wrap the selection (or a placeholder) in before/after; asBlock puts it on its own paragraph.
  function wrap(ta, before, after, placeholder, asBlock) {
    var v = ta.value, s = ta.selectionStart, e = ta.selectionEnd;
    var sel = v.slice(s, e) || placeholder;
    if (asBlock) {
      var lead = (v.slice(0, s).match(/\n*$/) || [''])[0].length;
      var trail = (v.slice(e).match(/^\n*/) || [''])[0].length;
      before = (s === 0 ? '' : '\n'.repeat(Math.max(0, 2 - lead))) + before;
      after = after + '\n'.repeat(Math.max(0, (e === v.length ? 1 : 2) - trail));
    }
    insertText(ta, before + sel + after, before.length, sel.length);
  }

  function addFootnote(ta) {
    var nums = (ta.value.match(/\[\^(\d+)\]/g) || []).map(function (m) { return +m.slice(2, -1); });
    var n = (nums.length ? Math.max.apply(null, nums) : 0) + 1;
    ta.setSelectionRange(ta.selectionEnd, ta.selectionEnd);
    insertText(ta, '[^' + n + ']');
    var def = '[^' + n + ']: ', body = 'Footnote text.';
    var pad = /\n\n$/.test(ta.value) ? '' : /\n$/.test(ta.value) ? '\n' : '\n\n';
    ta.setSelectionRange(ta.value.length, ta.value.length);
    insertText(ta, pad + def + body, pad.length + def.length, body.length);
  }

  var TOOLS = [
    { label: '<i>x</i>', title: 'Inline math  $x$', run: function (ta) { wrap(ta, '$', '$', 'x'); } },
    { label: '$$', title: 'Display math  $$ ... $$', run: function (ta) { wrap(ta, '$$\n', '\n$$', 'x \\in \\SAT', true); } },
    { label: '<b>B</b>', title: 'Bold  **text**', run: function (ta) { wrap(ta, '**', '**', 'bold'); } },
    { label: '<i>I</i>', title: 'Italic  *text*', run: function (ta) { wrap(ta, '*', '*', 'italic'); } },
    { label: 'Theorem', title: ':::theorem (Name)', run: function (ta) { wrap(ta, ':::theorem (Name)\n', '\n:::', 'Statement.', true); } },
    { label: 'Lemma', title: ':::lemma', run: function (ta) { wrap(ta, ':::lemma\n', '\n:::', 'Statement.', true); } },
    { label: 'Definition', title: ':::definition (term)', run: function (ta) { wrap(ta, ':::definition (term)\n', '\n:::', 'Definition.', true); } },
    { label: 'Proof', title: ':::proof ... ::: (adds \u220E)', run: function (ta) { wrap(ta, ':::proof\n', '\n:::', 'Argument.', true); } },
    { label: 'Image', title: 'Figure with caption; put the file in media/', run: function (ta) { wrap(ta, '![Describe the image for screen readers](media/', ' "Caption, may use $math$")', 'your-image.png', true); } },
    { label: 'Video', title: 'Video file in media/, or a YouTube/Vimeo URL', run: function (ta) { wrap(ta, '@[Describe the video](', ' "Caption")', 'media/your-video.mp4', true); } },
    { label: 'Footnote', title: 'Adds [^n] here and its text at the end of the block', run: addFootnote },
    { label: 'Animation', title: 'Interactive figure: ladner-h, ladner-shrink, left-set, mahaney-search (?r=2, ?mode=fortune)', run: function (ta) { wrap(ta, '@[viz](', ' "Caption")', 'mahaney-search', true); } }
  ];

  function rerender(block, text) {
    renderInto(block, text);
    saveDraft(block, text);
    updateBadge(block);
    finalizeAll();
  }

  function toggleEditor(block) {
    var btn = block.bar.querySelector('.md-btn');
    if (block.editor) {
      block.editor.remove();
      block.editor = null;
      btn.textContent = 'Edit';
      return;
    }
    btn.textContent = 'Close editor';
    var ed = document.createElement('div');
    ed.className = 'md-editor';
    ed.innerHTML = '<div class="md-toolbar" role="toolbar" aria-label="Insert">' +
      TOOLS.map(function (t, i) {
        return '<button type="button" data-tool="' + i + '" title="' + esc(t.title) + '">' + t.label + '</button>';
      }).join('') +
      '<span class="md-spacer"></span>' +
      '<button type="button" data-act="copy" class="md-primary">Copy Markdown</button>' +
      '<button type="button" data-act="revert">Revert to file</button>' +
      '<button type="button" data-act="close">Done</button></div>' +
      '<textarea spellcheck="true" aria-label="Markdown source for ' + esc(block.key) + '"></textarea>' +
      '<p class="md-status" aria-live="polite">Typing updates the preview below. Drag an image or video file in to insert it.</p>';
    block.bar.parentNode.insertBefore(ed, block.bar.nextSibling);
    block.editor = ed;

    var ta = ed.querySelector('textarea');
    var status = ed.querySelector('.md-status');
    ta.value = currentText(block);
    var timer;
    ta.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { rerender(block, ta.value); }, 180);
    });
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.metaKey) { e.preventDefault(); insertText(ta, '  '); }
    });
    ta.addEventListener('dragover', function (e) { e.preventDefault(); });
    ta.addEventListener('drop', function (e) {
      var files = e.dataTransfer && e.dataTransfer.files;
      if (!files || !files.length) return;
      e.preventDefault();
      var names = [];
      Array.prototype.forEach.call(files, function (f) {
        var isVideo = /^video\//.test(f.type);
        var path = 'media/' + f.name.replace(/ /g, '%20');
        wrap(ta, (isVideo ? '@' : '!') + '[Describe this ' + (isVideo ? 'video' : 'image') + '](', ' "Caption")', path, true);
        names.push(f.name);
      });
      status.textContent = 'Inserted. Copy ' + names.join(', ') + ' into the media/ folder of the repository so ' +
        (names.length > 1 ? 'they load.' : 'it loads.');
    });

    var revertArmed = null;
    ed.querySelector('.md-toolbar').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.hasAttribute('data-tool')) { TOOLS[+b.getAttribute('data-tool')].run(ta); return; }
      var act = b.getAttribute('data-act');
      if (act === 'close') { toggleEditor(block); return; }
      if (act === 'copy') {
        var done = function () {
          status.textContent = 'Copied. In ' + here + ', paste it over the contents of <script type="text/markdown" data-md="' +
            block.key + '">, then reload. You can then revert the draft.';
        };
        var fallback = function () { ta.select(); document.execCommand('copy'); done(); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(done, fallback);
        else fallback();
        return;
      }
      if (act === 'revert') {
        if (!revertArmed) {
          b.textContent = 'Click again to discard draft';
          revertArmed = setTimeout(function () { b.textContent = 'Revert to file'; revertArmed = null; }, 4000);
          return;
        }
        clearTimeout(revertArmed); revertArmed = null;
        b.textContent = 'Revert to file';
        ta.value = block.source;
        rerender(block, block.source);
        status.textContent = 'Reverted to the text in ' + here + '.';
      }
    });
    ta.focus();
  }

  function setupEditMode() {
    document.body.classList.add('editing');
    var banner = document.createElement('div');
    banner.className = 'edit-banner';
    banner.innerHTML = '<div class="wrap"><strong>Edit mode</strong><span>Drafts are saved in this browser only. ' +
      'When a block reads the way you want, click <b>Copy Markdown</b> and paste it over that block in <code>' + esc(here) +
      '</code>.</span><a href="' + esc(location.pathname) + '">Exit edit mode</a></div>';
    document.body.insertBefore(banner, document.body.firstChild);
    blocks.forEach(function (block) {
      var bar = document.createElement('div');
      bar.className = 'md-bar';
      bar.innerHTML = '<span class="md-bar-name">' + esc(here) + ' \u203A <code>data-md="' + esc(block.key) + '"</code></span>' +
        '<span class="md-draft-badge" hidden>Draft differs from file</span>' +
        '<button type="button" class="md-btn">Edit</button>';
      block.out.parentNode.insertBefore(bar, block.out);
      block.bar = bar;
      var text = currentText(block);
      if (text !== block.source) renderInto(block, text);
      updateBadge(block);
      bar.querySelector('.md-btn').addEventListener('click', function () { toggleEditor(block); });
    });
  }

  // ---------------------------------------------------------------- go
  function init() {
    buildHeader();
    renderAllBlocks();
    renderLooseMath();
    if (editMode) setupEditMode();
    finalizeAll();
    buildFooter();
    if (location.hash) {
      var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) target.scrollIntoView();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
