"""Generate the hero figures (inline SVG) and splice them into each page.

Usage (from the repository root):  python tools/make_figures.py .
Each page's <figure class="hero-figure"> is replaced; everything else is left alone.
"""
import random, re, sys, os

ROOT = sys.argv[1]
GREEN, GREEN_D, LIME, ORANGE, INK, MUTED = '#245c4b', '#193e34', '#d9e7a5', '#e48b5c', '#202b30', '#647278'
HARD_FILL, HARD_STROKE = '#f3dccb', '#d28c63'
NP_FILL = '#dfe9cf'


def arrow_defs(pid, color=GREEN):
    return (f'<defs><marker id="{pid}-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" '
            f'orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="{color}"/></marker></defs>')


def fig(svg, caption, label):
    return (f'<figure class="hero-figure">\n        <svg {svg[0]} role="img" aria-label="{label}">{svg[1]}</svg>\n'
            f'        <figcaption>{caption}</figcaption>\n      </figure>')


# ------------------------------------------------------------------ 1. Home: two worlds
def home():
    b = []
    b.append('<defs><clipPath id="h-np"><ellipse cx="365" cy="178" rx="88" ry="74"/></clipPath>'
             '<clipPath id="h-p"><circle cx="115" cy="150" r="66"/></clipPath></defs>')
    # divider
    b.append(f'<line x1="240" y1="8" x2="240" y2="282" stroke="#c6cfb7" stroke-dasharray="3 4"/>')
    # ---- P = NP world
    b.append('<text x="115" y="16" text-anchor="middle" class="hf-h">IF P = NP</text>')
    b.append(f'<ellipse cx="115" cy="112" rx="108" ry="86" fill="{HARD_FILL}" stroke="{HARD_STROKE}"/>')
    b.append('<text x="115" y="48" text-anchor="middle" class="hf-b hf-o">NP-hard</text>')
    b.append(f'<circle cx="115" cy="150" r="66" fill="{NP_FILL}" fill-opacity=".55" stroke="{GREEN}" stroke-width="1.5"/>')
    b.append(f'<ellipse cx="115" cy="112" rx="108" ry="86" fill="{GREEN}" fill-opacity=".22" clip-path="url(#h-p)"/>')
    b.append('<text x="115" y="134" text-anchor="middle" class="hf-b">P = NP</text>')
    b.append('<text x="115" y="152" text-anchor="middle" class="hf-s">overlap =</text>')
    b.append('<text x="115" y="168" text-anchor="middle" class="hf-b hf-g">NP-complete</text>')
    b.append(f'<circle cx="100" cy="207" r="3.2" fill="{INK}"/><circle cx="130" cy="207" r="3.2" fill="{INK}"/>')
    b.append('<text x="92" y="211" text-anchor="end" class="hf-s hf-m">∅</text><text x="138" y="211" class="hf-s hf-m">Σ*</text>')
    b.append('<text x="115" y="244" text-anchor="middle" class="hf-s">Every language in P except ∅ and Σ*</text>')
    b.append('<text x="115" y="259" text-anchor="middle" class="hf-s">is NP-complete. NPI is empty.</text>')
    # ---- P != NP world
    b.append('<text x="365" y="16" text-anchor="middle" class="hf-h">IF P ≠ NP</text>')
    b.append(f'<ellipse cx="365" cy="76" rx="108" ry="54" fill="{HARD_FILL}" stroke="{HARD_STROKE}"/>')
    b.append('<text x="365" y="56" text-anchor="middle" class="hf-b hf-o">NP-hard</text>')
    b.append(f'<ellipse cx="365" cy="178" rx="88" ry="74" fill="{NP_FILL}" fill-opacity=".55" stroke="{GREEN}" stroke-width="1.5"/>')
    b.append(f'<ellipse cx="365" cy="76" rx="108" ry="54" fill="{GREEN}" fill-opacity=".28" clip-path="url(#h-np)"/>')
    b.append(f'<ellipse cx="365" cy="76" rx="108" ry="54" fill="none" stroke="{HARD_STROKE}" clip-path="url(#h-np)"/>')
    b.append('<text x="365" y="122" text-anchor="middle" class="hf-b hf-g">NPC</text>')
    b.append(f'<rect x="303" y="140" width="124" height="34" rx="3" fill="#fffefa" fill-opacity=".75"/>')
    b.append('<text x="365" y="155" text-anchor="middle" class="hf-b">NPI ≠ ∅</text>')
    b.append('<text x="365" y="169" text-anchor="middle" class="hf-s">the middle (Ladner)</text>')
    b.append(f'<ellipse cx="365" cy="215" rx="50" ry="28" fill="#fffefa" stroke="{GREEN}" stroke-width="1.5"/>')
    b.append('<text x="365" y="220" text-anchor="middle" class="hf-b">P</text>')
    b.append('<text x="304" y="200" text-anchor="middle" class="hf-b hf-g">NP</text>')
    b.append('<text x="365" y="272" text-anchor="middle" class="hf-s">NP has three regions: P, NPI, NPC.</text>')
    return fig(('viewBox="0 0 480 285"', ''.join(b)),
               'The two possible worlds. If P = NP, all of NP except ∅ and Σ* is NP-complete. '
               'If P ≠ NP, NP-complete is only the top of NP, and Ladner’s Theorem puts problems in the gap between it and P.',
               'Two Venn diagrams. If P equals NP, the P = NP circle lies inside NP-hard except for the empty set and Sigma star, and the overlap is NP-complete. If P is not NP, NP contains P at the bottom, NP-complete where NP meets NP-hard at the top, and a nonempty NPI in between.')


# ------------------------------------------------------------------ 2. Review: a Karp reduction
def prereq():
    b = [arrow_defs('pr')]
    for x, name, lab in ((20, 'A', 'x'), (270, 'B', 'f(x)')):
        b.append(f'<rect x="{x}" y="34" width="170" height="196" rx="10" fill="#fffefa" stroke="#c6cfb7"/>')
        b.append(f'<text x="{x+12}" y="54" class="hf-s hf-m">Σ*</text>')
        b.append(f'<ellipse cx="{x+85}" cy="105" rx="62" ry="44" fill="{LIME}" stroke="{GREEN}" stroke-width="1.5"/>')
        b.append(f'<text x="{x+85}" y="82" text-anchor="middle" class="hf-b hf-m hf-g" font-size="16">{name}</text>')
    b.append('<text x="105" y="22" text-anchor="middle" class="hf-h">INSTANCES OF A</text>')
    b.append('<text x="355" y="22" text-anchor="middle" class="hf-h">INSTANCES OF B</text>')
    pts = [((88, 108), (342, 104), GREEN), ((122, 124), (372, 120), GREEN),
           ((70, 190), (350, 196), MUTED), ((140, 200), (350, 196), MUTED)]
    for (x1, y1), (x2, y2), c in pts:
        mx, my = (x1 + x2) / 2, min(y1, y2) - 34
        b.append(f'<path d="M{x1} {y1} Q{mx} {my} {x2-6} {y2}" fill="none" stroke="{c}" stroke-width="1.4" marker-end="url(#pr-arr)"/>')
    for (x1, y1), (x2, y2), c in pts:
        b.append(f'<circle cx="{x1}" cy="{y1}" r="4" fill="{c}"/><circle cx="{x2}" cy="{y2}" r="4" fill="{c}"/>')
    b.append('<text x="245" y="80" text-anchor="middle" class="hf-b hf-m hf-g" font-size="16">f</text>')
    b.append('<text x="350" y="218" text-anchor="middle" class="hf-s">two inputs, one image</text>')
    b.append('<text x="230" y="258" text-anchor="middle" class="hf-b hf-m" font-size="15">x ∈ A&#160;&#160;⟺&#160;&#160;f(x) ∈ B</text>')
    b.append('<text x="230" y="276" text-anchor="middle" class="hf-s">f runs in polynomial time</text>')
    return fig(('viewBox="0 0 460 285"', ''.join(b)),
               'A Karp reduction $A \\le_m^p B$ sends yes-instances to yes-instances and no-instances to no-instances. '
               'It may send several inputs to one output; Mahaney’s proof exploits exactly these collisions.',
               'Two boxes of strings. Arrows labelled f send points inside A to points inside B and points outside A to points outside B; two outside points share one image.')


# ------------------------------------------------------------------ 3. Ladner: how fast should H grow?
def ladner():
    b = [arrow_defs('la', INK)]
    # padded string
    b.append('<text x="20" y="16" class="hf-h">A STRING OF SAT<tspan dy="3" font-size="9">H</tspan></text>')
    b.append(f'<rect x="20" y="26" width="58" height="26" fill="{GREEN}"/><text x="49" y="44" text-anchor="middle" class="hf-b hf-m hf-w">ψ</text>')
    b.append(f'<rect x="78" y="26" width="20" height="26" fill="#fffefa" stroke="#c6cfb7"/><text x="88" y="44" text-anchor="middle" class="hf-mono">0</text>')
    b.append(f'<rect x="98" y="26" width="342" height="26" fill="{LIME}" stroke="#b6c4a8"/>')
    b.append('<text x="269" y="44" text-anchor="middle" class="hf-mono">1111111111111111111111111111111111111111111…</text>')
    b.append(f'<path d="M98 58 v5 h342 v-5" fill="none" stroke="{MUTED}"/>')
    b.append('<text x="269" y="77" text-anchor="middle" class="hf-s">padding of length |ψ|<tspan dy="-5" font-size="8">H(|ψ|)</tspan></text>')
    # axes
    ox, oy = 50, 268
    b.append(f'<path d="M{ox} {oy} H440" stroke="{INK}" marker-end="url(#la-arr)"/><path d="M{ox} {oy} V96" stroke="{INK}" marker-end="url(#la-arr)"/>')
    b.append(f'<text x="440" y="{oy+16}" text-anchor="end" class="hf-s hf-m">n</text>')
    b.append(f'<text x="{ox-8}" y="108" text-anchor="end" class="hf-s hf-m">H(n)</text>')
    # fast
    b.append(f'<path d="M{ox} {oy-4} C 90 250, 115 180, 140 104" fill="none" stroke="{MUTED}" stroke-width="2"/>')
    b.append('<text x="148" y="112" class="hf-s">grows fast: brute force is</text><text x="148" y="125" class="hf-s">polynomial, so it is in P</text>')
    # constant
    b.append(f'<path d="M{ox} 246 H430" fill="none" stroke="{ORANGE}" stroke-width="2"/>')
    b.append('<text x="430" y="261" text-anchor="end" class="hf-s hf-o">constant: polynomial padding, still NP-complete</text>')
    # ladner staircase
    st = [(ox, 236), (100, 236), (100, 218), (175, 218), (175, 198), (280, 198), (280, 176), (430, 176)]
    d = 'M' + ' L'.join(f'{x} {y}' for x, y in st)
    b.append(f'<path d="{d}" fill="none" stroke="{GREEN}" stroke-width="3" stroke-linejoin="round"/>')
    b.append('<text x="430" y="150" text-anchor="end" class="hf-b hf-g">Ladner’s H: grows, but slowly</text>')
    b.append('<text x="430" y="166" text-anchor="end" class="hf-s">neither in P nor NP-complete, so NPI</text>')
    return fig(('viewBox="0 0 460 290"', ''.join(b)),
               'SAT<sub>H</sub> pads each formula with $|\\psi|^{H(|\\psi|)}$ ones. Too little padding keeps it NP-complete, too much puts it in P. '
               'Ladner’s $H$ climbs one step each time the next machine fails, which lands in between.',
               'Top: a string psi, then 0, then a long run of ones. Bottom: a plot of H(n). A flat line is labelled NP-complete, a steep curve is labelled in P, and a slowly rising staircase between them is labelled NPI.')


# ------------------------------------------------------------------ 4. Sparse: census curves
def sparse():
    b = [arrow_defs('sp', INK)]
    ox, oy = 52, 262
    b.append(f'<path d="M{ox} {oy} H440" stroke="{INK}" marker-end="url(#sp-arr)"/><path d="M{ox} {oy} V22" stroke="{INK}" marker-end="url(#sp-arr)"/>')
    b.append(f'<text x="440" y="{oy+16}" text-anchor="end" class="hf-s">length bound <tspan class="hf-m">n</tspan></text>')
    b.append(f'<text x="{ox+8}" y="30" class="hf-s">strings of length ≤ <tspan class="hf-m">n</tspan> in the set,  </text>')
    b.append(f'<text x="{ox+8}" y="44" class="hf-s hf-m">c(n) = |A<tspan dy="-5" font-size="8">≤n</tspan><tspan dy="5">|</tspan></text>')
    def curve(f, n_max=1.0, steps=60):
        pts = []
        for i in range(steps + 1):
            t = n_max * i / steps
            x = ox + t * 380
            y = oy - f(t)
            if y < 24:
                break
            pts.append(f'{x:.1f} {y:.1f}')
        return 'M' + ' L'.join(pts)
    b.append(f'<path d="{curve(lambda t: 2 ** (t * 11) * 0.2)}" fill="none" stroke="{ORANGE}" stroke-width="3"/>')
    b.append(f'<path d="{curve(lambda t: 60 * t * t + 6 * t)}" fill="none" stroke="{GREEN}" stroke-width="3"/>')
    b.append(f'<path d="{curve(lambda t: 18 * t)}" fill="none" stroke="{GREEN}" stroke-width="2" stroke-dasharray="5 4"/>')
    b.append('<text x="300" y="60" class="hf-b hf-o">SAT: 2<tspan dy="-6" font-size="9">Ω(n)</tspan></text>')
    b.append('<text x="300" y="74" class="hf-s">dense: exponentially many</text>')
    b.append('<text x="150" y="232" class="hf-b hf-g">sparse: ≤ p(n)</text>')
    b.append('<text x="434" y="234" text-anchor="end" class="hf-s">tally: ≤ n + 1</text>')
    b.append(f'<path d="M366 211 V166" stroke="{MUTED}" stroke-dasharray="2 3" marker-start="url(#sp-arr)" marker-end="url(#sp-arr)"/>')
    b.append('<text x="374" y="186" class="hf-s">exponential</text>')
    b.append('<text x="374" y="199" class="hf-s">gap</text>')
    return fig(('viewBox="0 0 460 285"', ''.join(b)),
               'Census functions. A p-isomorphism keeps the census within a polynomial, so no sparse set can be p-isomorphic to SAT. '
               'If the Berman–Hartmanis conjecture holds, no sparse set is NP-complete.',
               'Plot of census against length. SAT rises exponentially; a sparse set stays below a polynomial; a tally set stays below n plus 1. A gap between SAT and sparse is labelled no p-isomorphism.')


# ------------------------------------------------------------------ 5. Mahaney I: forced collisions
def mahaney1():
    rnd = random.Random(7)
    b = []
    b.append('<text x="74" y="16" text-anchor="middle" class="hf-h">FORMULAS</text>')
    b.append('<text x="74" y="31" text-anchor="middle" class="hf-s">2<tspan dy="-5" font-size="8">Ω(n)</tspan><tspan dy="5"> satisfiable ones</tspan></text>')
    b.append('<text x="392" y="16" text-anchor="middle" class="hf-h">SPARSE SET S</text>')
    b.append('<text x="392" y="31" text-anchor="middle" class="hf-s">only polynomially many</text>')
    s_pts = [(392, 82 + 40 * i) for i in range(5)]
    b.append(f'<ellipse cx="392" cy="162" rx="34" ry="112" fill="#fffefa" stroke="{GREEN}" stroke-width="1.5"/>')
    dots, lines = [], []
    hi = None
    for r in range(11):
        for c in range(7):
            x, y = 26 + 16 * c, 52 + 21 * r
            sat = rnd.random() < 0.62
            if sat:
                tx, ty = s_pts[rnd.randrange(5)]
                lines.append(f'<path d="M{x} {y} C 240 {y}, 260 {ty}, {tx-9} {ty}" fill="none" stroke="{GREEN}" stroke-opacity=".18"/>')
                if (r, c) in ((2, 5), (8, 6)):
                    hi = hi or []
                    hi.append((x, y))
            dots.append(f'<circle cx="{x}" cy="{y}" r="4" fill="{GREEN if sat else "#c3c9c3"}"/>')
    tx, ty = s_pts[2]
    for x, y in (hi or []):
        lines.append(f'<path d="M{x} {y} C 240 {y}, 260 {ty}, {tx-9} {ty}" fill="none" stroke="{ORANGE}" stroke-width="2.2"/>')
    b += lines + dots
    for x, y in hi or []:
        b.append(f'<circle cx="{x}" cy="{y}" r="5.5" fill="none" stroke="{ORANGE}" stroke-width="2"/>')
    for x, y in s_pts:
        b.append(f'<circle cx="{x}" cy="{y}" r="8" fill="{LIME}" stroke="{GREEN}" stroke-width="1.5"/>')
    b.append(f'<circle cx="{tx}" cy="{ty}" r="8" fill="{ORANGE}"/>')
    b.append('<text x="240" y="112" text-anchor="middle" class="hf-b hf-m hf-g" font-size="16">f</text>')
    b.append(f'<rect x="150" y="270" width="200" height="0" fill="none"/>')
    b.append('<text x="250" y="292" text-anchor="middle" class="hf-b hf-o">f(φ) = f(φ′)&#160;&#160;⇒&#160;&#160;φ and φ′ have the same answer</text>')
    b.append(f'<circle cx="26" cy="305" r="4" fill="{GREEN}"/><text x="35" y="309" class="hf-s">satisfiable</text>')
    b.append(f'<circle cx="112" cy="305" r="4" fill="#c3c9c3"/><text x="121" y="309" class="hf-s">unsatisfiable (sent outside S)</text>')
    return fig(('viewBox="0 0 460 315"', ''.join(b)),
               'A reduction from SAT to a sparse set has to squeeze exponentially many yes-instances into polynomially many strings, '
               'so many formulas share an image. Each collision says two formulas have the same answer, and the proof gets that without ever deciding $S$.',
               'Many green dots for satisfiable formulas on the left, with lines funnelling into five points of a sparse set S on the right. Two highlighted formulas map to the same point.')


# ------------------------------------------------------------------ 6. Mahaney II: the pruned search
def mahaney2():
    b = []
    L = {0: 30, 1: 82, 2: 134, 3: 186, 4: 238}
    nodes = {
        '': (230, 0, 'path'),
        '0': (130, 1, 'kept'), '1': (330, 1, 'path'),
        '00': (78, 2, 'coll'), '01': (178, 2, 'kept'), '10': (282, 2, 'path'), '11': (382, 2, 'census'),
        '010': (128, 3, 'coll'), '011': (200, 3, 'kept'), '100': (262, 3, 'path'), '101': (334, 3, 'census'),
        '0110': (170, 4, 'coll'), '0111': (215, 4, 'kept'), '1000': (258, 4, 'path'), '1001': (302, 4, 'census'),
    }
    path = {'', '1', '10', '100', '1000'}
    for k, (x, lvl, st) in nodes.items():
        if k == '':
            continue
        px, plvl, _ = nodes[k[:-1]]
        on = k in path
        b.append(f'<line x1="{px}" y1="{L[plvl]}" x2="{x}" y2="{L[lvl]}" stroke="{GREEN if on else "#aab5ae"}" stroke-width="{3.5 if on else 1.3}"/>')
    # collision arc at level 3: 010 <-> 100
    b.append(f'<path d="M128 194 Q195 222 262 194" fill="none" stroke="{ORANGE}" stroke-width="1.4" stroke-dasharray="3 3"/>')
    for k, (x, lvl, st) in nodes.items():
        y = L[lvl]
        if st in ('kept', 'path'):
            b.append(f'<circle cx="{x}" cy="{y}" r="7" fill="{GREEN}"/>')
        elif st == 'coll':
            b.append(f'<circle cx="{x}" cy="{y}" r="7" fill="#fffefa" stroke="{ORANGE}" stroke-width="1.6"/>'
                     f'<path d="M{x-3.5} {y-3.5}l7 7M{x+3.5} {y-3.5}l-7 7" stroke="{ORANGE}" stroke-width="1.6"/>')
        else:
            b.append(f'<circle cx="{x}" cy="{y}" r="7" fill="#fffefa" stroke="#9aa8a0" stroke-width="1.4" stroke-dasharray="2 2"/>')
        if k:
            dy = -11 if lvl < 4 else 20
            anchor = 'end' if (x < 230 and k not in path) else 'start'
            if lvl < 4:
                tx = x - 11 if anchor == 'end' else x + 11
                b.append(f'<text x="{tx}" y="{y+4}" text-anchor="{anchor}" class="hf-mono">{k}</text>')
            else:
                b.append(f'<text x="{x}" y="{y+20}" text-anchor="middle" class="hf-mono">{k}</text>')
    for lvl, y in L.items():
        b.append(f'<text x="452" y="{y+4}" text-anchor="end" class="hf-s">k = {lvl}</text>')
    b.append('<text x="258" y="274" text-anchor="middle" class="hf-b hf-m hf-g">z* = 1000</text>')
    # legend
    y = 300
    b.append(f'<circle cx="16" cy="{y}" r="5" fill="{GREEN}"/><text x="26" y="{y+4}" class="hf-s">kept (≤ r = 2 per level)</text>')
    b.append(f'<circle cx="170" cy="{y}" r="5" fill="#fffefa" stroke="{ORANGE}" stroke-width="1.5"/><text x="180" y="{y+4}" class="hf-s">collision (- - same g)</text>')
    b.append(f'<circle cx="296" cy="{y}" r="5" fill="#fffefa" stroke="#9aa8a0" stroke-dasharray="2 2"/><text x="306" y="{y+4}" class="hf-s">census rule</text>')
    b.append(f'<line x1="386" y1="{y}" x2="406" y2="{y}" stroke="{GREEN}" stroke-width="3.5"/><text x="412" y="{y+4}" class="hf-s">p<tspan dy="3" font-size="8">k</tspan></text>')
    return fig(('viewBox="0 0 460 312"', ''.join(b)),
               'The pruned search with $r = 2$. At each level, collisions remove the smaller of two prefixes with the same $g$-value, and the census rule keeps the $r$ smallest. '
               'The true prefix $p_k$ (thick path) is never removed. Level 3 matches the worked example below.',
               'A binary tree four levels deep. At each level two nodes are kept and the rest are crossed out by the collision rule or dropped by the census rule. A thick path from the root to 1000 marks the prefixes of z star.')


# ------------------------------------------------------------------ 7. Consequences: sparse sets live in NPI
def consequences():
    b = ['<defs><clipPath id="co-np"><ellipse cx="215" cy="182" rx="135" ry="104"/></clipPath></defs><g transform="translate(-16 0)">']
    b.append(f'<ellipse cx="215" cy="66" rx="150" ry="56" fill="{HARD_FILL}" stroke="{HARD_STROKE}"/>')
    b.append('<text x="215" y="38" text-anchor="middle" class="hf-b hf-o">NP-hard</text>')
    b.append(f'<ellipse cx="215" cy="182" rx="135" ry="104" fill="{NP_FILL}" fill-opacity=".55" stroke="{GREEN}" stroke-width="1.5"/>')
    b.append(f'<ellipse cx="215" cy="66" rx="150" ry="56" fill="{GREEN}" fill-opacity=".28" clip-path="url(#co-np)"/>')
    b.append(f'<ellipse cx="215" cy="66" rx="150" ry="56" fill="none" stroke="{ORANGE}" stroke-width="3" stroke-dasharray="7 5" clip-path="url(#co-np)"/>')
    b.append('<text x="215" y="104" text-anchor="middle" class="hf-b hf-g">NP-complete</text>')
    b.append(f'<ellipse cx="215" cy="250" rx="72" ry="28" fill="#fffefa" stroke="{GREEN}" stroke-width="1.5"/>')
    b.append('<text x="215" y="255" text-anchor="middle" class="hf-b">P</text>')
    b.append('<text x="100" y="178" class="hf-b hf-g">NPI</text>')
    b.append('<text x="104" y="240" class="hf-b hf-g">NP</text>')
    for x, y in [(150, 150), (176, 172), (198, 143), (226, 162), (252, 146), (278, 170), (304, 154), (168, 196),
                 (318, 186), (238, 188), (205, 176), (286, 196), (138, 180), (262, 128), (184, 132)]:
        b.append(f'<circle cx="{x}" cy="{y}" r="3.4" fill="{ORANGE}"/>')
    b.append('<text x="230" y="214" text-anchor="middle" class="hf-s">sparse sets in NP ∖ P</text>')
    b.append('<text x="368" y="122" class="hf-b">Mahaney:</text>')
    b.append('<text x="368" y="137" class="hf-s">no sparse set</text>')
    b.append('<text x="368" y="150" class="hf-s">crosses this line</text>')
    b.append(f'<path d="M364 132 Q348 124 340 116" fill="none" stroke="{INK}" stroke-width="1"/>')
    b.append('<text x="368" y="236" class="hf-b">They exist</text>')
    b.append('<text x="368" y="251" class="hf-s">iff E ≠ NE</text>')
    b.append('<text x="368" y="264" class="hf-s">(Hartmanis,</text>')
    b.append('<text x="368" y="277" class="hf-s">Immerman,</text>')
    b.append('<text x="368" y="290" class="hf-s">Sewelson 1985)</text>')
    b.append('</g>')
    return fig(('viewBox="0 0 460 298"', ''.join(b)),
               'If $\\P \\ne \\NP$, a sparse set in NP that escapes P cannot reach NP-complete, so it must sit in NPI. '
               'This gives intermediate problems for a structural reason rather than by diagonalization.',
               'The P not equal NP picture. Orange dots for sparse sets fill the NPI band between P and NP-complete. A dashed line at the NP-complete boundary is labelled: no sparse set crosses this line.')


# ------------------------------------------------------------------ 8. Glossary: timeline
def glossary():
    ev = [('1975', 'Ladner', 'P ≠ NP&#160;⇒&#160;NPI ≠ ∅'),
          ('1977', 'Berman–Hartmanis', 'conjecture: all NP-complete sets are p-isomorphic'),
          ('1978', 'Berman', 'tally NP-hard set&#160;⇒&#160;P = NP'),
          ('1979', 'Fortune', 'sparse coNP-hard set&#160;⇒&#160;P = NP'),
          ('1980', 'Karp–Lipton', 'NP ⊆ P/poly&#160;⇒&#160;PH = Σ₂ᵖ'),
          ('1982', 'Mahaney', 'sparse NP-hard set&#160;⇒&#160;P = NP'),
          ('1991', 'Ogihara–Watanabe', 'same for ≤btt reductions, via left sets')]
    b = [f'<line x1="66" y1="16" x2="66" y2="276" stroke="#b6c4a8" stroke-width="2"/>']
    for i, (yr, who, what) in enumerate(ev):
        y = 26 + 40 * i
        star = who == 'Mahaney'
        if star:
            b.append(f'<rect x="54" y="{y-16}" width="398" height="38" rx="3" fill="{LIME}"/>')
        b.append(f'<text x="50" y="{y+5}" text-anchor="end" class="hf-m hf-g" font-size="15">{yr}</text>')
        b.append(f'<circle cx="66" cy="{y}" r="{6 if star else 4.5}" fill="{GREEN}" stroke="#eef0e6" stroke-width="2"/>')
        b.append(f'<text x="84" y="{y+1}" class="hf-b">{who}</text>')
        b.append(f'<text x="84" y="{y+15}" class="hf-s">{what}</text>')
    return fig(('viewBox="0 0 460 290"', ''.join(b)),
               'The results on this site in the order they were proved. Mahaney’s Theorem, the centerpiece, settled the sparse case of the Berman–Hartmanis prediction.',
               'Timeline from 1975 to 1991: Ladner, Berman–Hartmanis, Berman, Fortune, Karp–Lipton, Mahaney highlighted, Ogihara–Watanabe.')


PAGES = {'1_home.html': home, '2_review.html': prereq, '3_npi.html': ladner, '4_sparse.html': sparse,
         '5_mahaney.html': mahaney1, '6_mahaney-proof.html': mahaney2, '7_consequences.html': consequences,
         '8_glossary.html': glossary}
pat = re.compile(r'<div class="diagram"[\s\S]*?<div class="diagram-label">[\s\S]*?</div>\s*</div>|<figure class="hero-figure">[\s\S]*?</figure>')
for name, fn in PAGES.items():
    p = os.path.join(ROOT, name)
    s = open(p, encoding='utf-8').read()
    s2, n = pat.subn(lambda m: fn(), s, count=1)
    open(p, 'w', encoding='utf-8').write(s2)
    print(name, n)
