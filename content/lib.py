# Ёрирасонҳо барои навиштани масъалаҳо: ҳар масъала ҳалли C++ ва ҳалли мустақили Python дорад.
import random, json
PROBLEMS = []   # dict-ҳо
DAYS = []       # {week, day, kind, title, topic, hints, ids:[...]}
_cur = None

def day(week, d, title, topic, hints, kind='lesson'):
    global _cur
    _cur = dict(week=week, day=d, kind=kind, title=title, topic=topic, hints=hints, ids=[])
    DAYS.append(_cur)

def prog(body, inc='#include <iostream>'):
    return inc + '\nusing namespace std;\n\nint main() {\n' + '\n'.join('    ' + l if l else '' for l in body.strip('\n').split('\n')) + '\n    return 0;\n}\n'

def P(slug, title, text, inp, out, cpp, py, tests, gen=None, n=10, why=None, level=None, inc='#include <iostream>'):
    """tests — вурудҳои дастӣ (сатрҳо); gen(r) — вуруди тасодуфӣ; py(s)->str — ҳалли Python."""
    r = random.Random(slug)
    ins = list(tests)
    tries = 0
    while gen and len(ins) < n and tries < 500:
        x = gen(r); tries += 1
        if x not in ins: ins.append(x)
    PROBLEMS.append(dict(slug=slug, title=title, statement=text, input=inp, output=out,
                         solution=prog(cpp, inc) if not cpp.lstrip().startswith('#') else cpp,
                         py=py, ins=ins, why=why, level=level or ('Осон' if len(_cur['ids']) < 4 else 'Миёна' if len(_cur['ids']) < 7 else 'Душвор'),
                         topic=_cur['topic']))
    _cur['ids'].append(slug)

def nums(s): return [int(x) for x in s.split()]

def F(slug, title, text, names, cexpr, pexpr, inp, out, tests, gen, show=None, n=10):
    """Масъалаи формулавӣ: ададҳои names хонда мешаванд, натиҷа = ифода."""
    decl = 'long long ' + ', '.join(names) + ';\ncin >> ' + ' >> '.join(names) + ';\n'
    outs = cexpr if isinstance(cexpr, list) else [cexpr]
    cpp = decl + 'cout << ' + ' << " " << '.join('(' + e + ')' for e in outs) + ' << endl;'
    pe = pexpr if isinstance(pexpr, list) else [pexpr]
    def py(s):
        v = dict(zip(names, nums(s)))
        return ' '.join(str(eval(e, {}, v)) for e in pe)
    why = None
    if show:
        def why(s):
            v = dict(zip(names, nums(s)))
            kw = dict(v); kw['res'] = py(s); kw.setdefault('r', kw['res'])
            return show.format(**kw)
    P(slug, title, text, inp, out, cpp, py, tests, gen, n=n, why=why)

def tags_for(inp):
    t = []
    toks = inp.split()
    try:
        v = [int(x) for x in toks]
    except ValueError:
        return t
    if any(x == 0 for x in v): t.append('сифр')
    if any(x < 0 for x in v): t.append('адади манфӣ')
    if any(abs(x) >= 10**8 for x in v): t.append('сарҳади боло')
    if len(v) >= 2 and v[0] == v[1]: t.append('баробарӣ')
    return t

def export(path):
    out_p = []
    for p in PROBLEMS:
        tests = []
        for i, s in enumerate(p['ins']):
            s2 = s if s.endswith('\n') else s + '\n'
            o = p['py'](s2)
            tests.append(dict(input=s2, output=o, hidden=i >= 3, tags=tags_for(s2)))
        exs = []
        for t in tests[:2]:
            w = p['why'](t['input']) if p['why'] else ''
            exs.append(dict(input=t['input'], output=t['output'], explain=w))
        out_p.append(dict(slug=p['slug'], topic=p['topic'], level=p['level'], title=p['title'], statement=p['statement'],
                          input=p['input'], output=p['output'], constraints='', examples=exs, solution=p['solution'], tests=tests))
    json.dump(dict(days=DAYS, problems=out_p), open(path, 'w'), ensure_ascii=False, indent=1)
    print(len(out_p), 'масъала,', len(DAYS), 'рӯз')
