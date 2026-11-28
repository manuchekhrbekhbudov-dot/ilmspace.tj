# Ҳафтаи 3 — масъалаҳои иловагӣ (даври while): рақамҳо, чаппа, тақсимкунандаҳо, дараҷаҳо, хондан то сифр.
import math
from lib import *
from w3 import body, digits, big
R = lambda r, a, b: r.randint(a, b)
def rn(r, k, lo, hi): return ' '.join(str(R(r, lo, hi)) for _ in range(k))
def yn(b): return 'YES' if b else 'NO'
def n0(s): return nums(s)[0]
def rev(n): return int(str(n)[::-1])
def pal(n): return str(n) == str(n)[::-1]
def isprime(n):
    if n < 2: return False
    i = 2
    while i * i <= n:
        if n % i == 0: return False
        i += 1
    return True
def sdiv(n):  # ҷамъи тақсимкунандаҳои хурд аз n
    s, i = (1 if n > 1 else 0), 2
    while i * i <= n:
        if n % i == 0:
            s += i + (n // i if i != n // i else 0)
        i += 1
    return s
def _lpf(n):  # зарбкунандаи содаи калонтарин
    best, d = 1, 2
    while d * d <= n:
        while n % d == 0:
            best = d; n //= d
        d += 1
    return n if n > 1 else best
def _npf(n):  # шумораи зарбкунандаҳои содаи гуногун
    c, d = 0, 2
    while d * d <= n:
        if n % d == 0:
            c += 1
            while n % d == 0: n //= d
        d += 1
    return c + (1 if n > 1 else 0)
def _base(n, k):
    t = ''
    while n > 0:
        t = str(n % k) + t; n //= k
    return t
def _ispow(n, k):
    while n % k == 0: n //= k
    return n == 1
def _cmax(n):
    m = n
    while n != 1:
        n = n // 2 if n % 2 == 0 else 3 * n + 1
        m = max(m, n)
    return m
def _fz(n):
    c = 0
    while n > 0:
        n //= 5; c += n
    return c
def _lis(v):
    best = cur = 1
    for a, b in zip(v, v[1:]):
        cur = cur + 1 if b > a else 1
        best = max(best, cur)
    return best
def _run(v):
    best = cur = 1
    for a, b in zip(v, v[1:]):
        cur = cur + 1 if b == a else 1
        best = max(best, cur)
    return best
def _mp(n):
    while n > 9:
        p = 1
        for c in str(n): p *= int(c)
        n = p
    return n
def _happy(n):
    while n not in (1, 4):
        n = sum(int(c) ** 2 for c in str(n))
    return n == 1
def _ndiv(g):
    return sum(2 if d * d != g else 1 for d in range(1, math.isqrt(g) + 1) if g % d == 0)
def zs(r, lo=-100, hi=100, k1=1, k2=15):
    return ' '.join(str(r.choice([x for x in range(lo, hi + 1) if x != 0])) for _ in range(R(r, k1, k2))) + ' 0'
def zseq(s): v = nums(s); return v[:v.index(0)]
STR = '#include <iostream>\n#include <string>'
REV = 'long long r = 0, m = n;\nwhile (m > 0) {\n    r = r * 10 + m % 10;\n    m /= 10;\n}\n'
READ0 = 'long long x;\n'

# ───────── Рӯзи 1: рақамҳои адад ─────────
use(3, 1); lvl('Миёна')
P('w3d1-11', 'Рақами хурдтарин', 'Адади n. Рақами хурдтарини онро чоп кунед.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Як рақам.',
  body(['n']) + 'long long mn = 9;\ndo {\n    if (n % 10 < mn) mn = n % 10;\n    n /= 10;\n} while (n > 0);\ncout << mn << endl;', lambda s: str(min(digits(n0(s)))), ['2025', '7', '0', '987'], big,
  why=lambda s: f'Хурдтарин — {min(s.strip())}.')
P('w3d1-12', 'Ҷамъи рақамҳои ҷуфт', 'Адади n. Ҷамъи рақамҳои ҷуфти онро ёбед.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'long long s = 0;\nwhile (n > 0) {\n    if (n % 10 % 2 == 0) s += n % 10;\n    n /= 10;\n}\ncout << s << endl;', lambda s: str(sum(d for d in digits(n0(s)) if d % 2 == 0)),
  ['2468', '1357', '0', '1024'], big, why=lambda s: 'Танҳо рақамҳои ҷуфтро ҷамъ кунед.')
P('w3d1-13', 'Ҷамъи рақамҳои тоқ', 'Адади n. Ҷамъи рақамҳои тоқи онро ёбед.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'long long s = 0;\nwhile (n > 0) {\n    if (n % 10 % 2 == 1) s += n % 10;\n    n /= 10;\n}\ncout << s << endl;', lambda s: str(sum(d for d in digits(n0(s)) if d % 2)),
  ['12345', '2468', '0', '999'], big, why=lambda s: 'Танҳо рақамҳои тоқ.')
P('w3d1-14', 'Рақамҳои аз 5 калон', 'Адади n. Чанд рақами он аз 5 калон аст?', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'int cnt = 0;\nwhile (n > 0) {\n    if (n % 10 > 5) cnt++;\n    n /= 10;\n}\ncout << cnt << endl;', lambda s: str(sum(1 for d in digits(n0(s)) if d > 5)),
  ['1789', '555', '0', '6'], big, why=lambda s: 'Рақамҳои 6, 7, 8, 9.')
P('w3d1-15', 'Фарқи рақами калон ва хурд', 'Адади n. Фарқи рақами калонтарин ва хурдтарини онро ёбед.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'long long mx = 0, mn = 9;\ndo {\n    long long d = n % 10;\n    if (d > mx) mx = d;\n    if (d < mn) mn = d;\n    n /= 10;\n} while (n > 0);\ncout << mx - mn << endl;',
  lambda s: str(max(digits(n0(s))) - min(digits(n0(s)))), ['2025', '7', '0', '19'], big, why=lambda s: f'{max(s.strip())} − {min(s.strip())}')
P('w3d1-16', 'Ҳама рақамҳо ҷуфт?', 'Адади n. Агар ҳамаи рақамҳояш ҷуфт бошанд YES, вагарна NO.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'YES ё NO.',
  body(['n']) + 'bool ok = true;\ndo {\n    if (n % 10 % 2 == 1) ok = false;\n    n /= 10;\n} while (n > 0);\nif (ok) cout << "YES";\nelse cout << "NO";\ncout << endl;',
  lambda s: yn(all(d % 2 == 0 for d in digits(n0(s)))), ['2468', '2478', '0', '8'], lambda r: r.choice([big(r), str(R(r, 1, 4) * 2 * 1111)]), why=lambda s: 'Агар яке тоқ бошад — NO.')
P('w3d1-17', 'Рақами 7 ҳаст?', 'Адади n. Агар рақами 7 дошта бошад YES, вагарна NO.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'YES ё NO.',
  body(['n']) + 'bool has = false;\ndo {\n    if (n % 10 == 7) has = true;\n    n /= 10;\n} while (n > 0);\nif (has) cout << "YES";\nelse cout << "NO";\ncout << endl;',
  lambda s: yn('7' in s.strip()), ['1789', '1234', '7', '0'], big, why=lambda s: 'Ҳар рақамро бо 7 муқоиса кунед.')
P('w3d1-18', 'Ҷамъи рақамҳо ба 9', 'Адади n. Агар ҷамъи рақамҳояш ба 9 тақсим шавад YES, вагарна NO.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'YES ё NO.',
  body(['n']) + 'long long s = 0;\nwhile (n > 0) {\n    s += n % 10;\n    n /= 10;\n}\nif (s % 9 == 0) cout << "YES";\nelse cout << "NO";\ncout << endl;',
  lambda s: yn(sum(digits(n0(s))) % 9 == 0), ['729', '730', '0', '999999999'], big, why=lambda s: f'Ҷамъ = {sum(digits(n0(s)))}.')
P('w3d1-19', 'Миёнаи рақамҳо', 'Адади n. Қисми бутуни миёнаи арифметикии рақамҳояшро ёбед (ҷамъ / шумора).', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'long long s = 0, c = 0;\ndo {\n    s += n % 10;\n    c++;\n    n /= 10;\n} while (n > 0);\ncout << s / c << endl;', lambda s: str(sum(digits(n0(s))) // len(s.strip())),
  ['2025', '7', '0', '19'], big, why=lambda s: f'{sum(digits(n0(s)))} / {len(s.strip())}')
P('w3d1-20', 'Рақамҳои мисли охирин', 'Адади n. Чанд рақами он ба рақами охирин баробар аст (охирин ҳам ҳисоб)?', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'long long last = n % 10;\nint cnt = 0;\ndo {\n    if (n % 10 == last) cnt++;\n    n /= 10;\n} while (n > 0);\ncout << cnt << endl;', lambda s: str(s.strip().count(s.strip()[-1])),
  ['1211', '7', '0', '1000'], big, why=lambda s: f'Рақами охирин — {s.strip()[-1]}.')

lvl('Душвор')
P('w3d1-21', 'Шумораи ҷуфт ва тоқ', 'Адади n. Шумораи рақамҳои ҷуфт ва шумораи рақамҳои тоқро бо фосила чоп кунед.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Ду адад.',
  body(['n']) + 'int e = 0, o = 0;\ndo {\n    if (n % 10 % 2 == 0) e++;\n    else o++;\n    n /= 10;\n} while (n > 0);\ncout << e << " " << o << endl;',
  lambda s: (lambda d: f'{sum(1 for x in d if x % 2 == 0)} {sum(1 for x in d if x % 2)}')(digits(n0(s))), ['12345', '0', '2468', '7'], big, why=lambda s: 'Ду ҳисобкунак.')
P('w3d1-22', 'Чиптаи хушбахт', 'Рақами чипта n аз 6 рақам аст (дар аввал метавонад 0 бошад). Агар ҷамъи 3 рақами аввал ба ҷамъи 3 рақами охир баробар бошад YES, вагарна NO.', 'Як адад n (0 ≤ n ≤ 999999).', 'YES ё NO.',
  body(['n']) + 'long long a = n / 1000, b = n % 1000, sa = 0, sb = 0;\nwhile (a > 0) {\n    sa += a % 10;\n    a /= 10;\n}\nwhile (b > 0) {\n    sb += b % 10;\n    b /= 10;\n}\nif (sa == sb) cout << "YES";\nelse cout << "NO";\ncout << endl;',
  lambda s: (lambda t: yn(sum(map(int, t[:3])) == sum(map(int, t[3:]))))(f'{n0(s):06d}'), ['123321', '123456', '1001', '0', '555555'], lambda r: r.choice([str(R(r, 0, 999999)), (lambda a: str(a * 1000 + int(str(a).zfill(3)[::-1])))(R(r, 0, 999))]),
  why=lambda s: 'Ду ҷамъро муқоиса кунед.')
P('w3d1-23', 'Рақамҳои гуногун', 'Адади n. Агар ҳамаи рақамҳояш гуногун бошанд YES, вагарна NO.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'YES ё NO.',
  body(['n']) + 'int used[10] = {0};\nbool ok = true;\ndo {\n    int d = n % 10;\n    if (used[d]) ok = false;\n    used[d] = 1;\n    n /= 10;\n} while (n > 0);\nif (ok) cout << "YES";\nelse cout << "NO";\ncout << endl;',
  lambda s: yn(len(set(s.strip())) == len(s.strip())), ['1234', '1231', '0', '9876543210'], lambda r: r.choice([big(r), str(R(r, 1, 9876))]), why=lambda s: 'Рақамҳои дидашударо қайд кунед.')
P('w3d1-24', 'Ҷамъи ҷойҳои тоқ', 'Адади n. Рақамҳоро аз рост рақамгузорӣ кунед (охирин — 1). Ҷамъи рақамҳои ҷойҳои тоқро (1, 3, 5, …) ёбед.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'long long s = 0;\nint i = 1;\nwhile (n > 0) {\n    if (i % 2 == 1) s += n % 10;\n    n /= 10;\n    i++;\n}\ncout << s << endl;', lambda s: str(sum(int(c) for c in s.strip()[::-1][::2])),
  ['12345', '7', '0', '1010'], big, why=lambda s: 'Рақамҳои 1-ум, 3-юм, … аз рост.')
P('w3d1-25', 'Рақами дуюм аз чап', 'Адади n (n ≥ 10). Рақами дуюмро аз чап чоп кунед.', 'Як адад n (10 ≤ n ≤ 10¹⁸).', 'Як рақам.',
  body(['n']) + 'while (n >= 100) {\n    n /= 10;\n}\ncout << n % 10 << endl;', lambda s: s.strip()[1], ['2025', '10', '98', '1000000000000000000'], lambda r: str(R(r, 10, 10**18)),
  why=lambda s: f'Рақами дуюм — {s.strip()[1]}.')
P('w3d1-26', 'Рақамҳо баробаранд?', 'Ду адад a ва b. Агар шумораи рақамҳояшон баробар бошад YES, вагарна NO.', 'Як сатр: a, b (0 ≤ x ≤ 10¹⁸).', 'YES ё NO.',
  body(['a', 'b']) + 'int ca = 0, cb = 0;\ndo {\n    ca++;\n    a /= 10;\n} while (a > 0);\ndo {\n    cb++;\n    b /= 10;\n} while (b > 0);\nif (ca == cb) cout << "YES";\nelse cout << "NO";\ncout << endl;',
  lambda s: yn(len(s.split()[0]) == len(s.split()[1])), ['123 456', '12 345', '0 9', '10 9'], lambda r: f'{big(r)} {big(r)}', why=lambda s: 'Шумораи рақамҳоро муқоиса кунед.')
P('w3d1-27', 'Зарби рақамҳои ғайрисифр', 'Адади n. Ҳосили зарби рақамҳои ғайрисифрашро ёбед. Агар n = 0 бошад, 0 чоп кунед.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'if (n == 0) {\n    cout << 0 << endl;\n} else {\n    long long p = 1;\n    while (n > 0) {\n        if (n % 10 != 0) p *= n % 10;\n        n /= 10;\n    }\n    cout << p << endl;\n}',
  lambda s: '0' if n0(s) == 0 else str(math.prod(d for d in digits(n0(s)) if d)), ['1020', '0', '100', '999999999999999999'], big, why=lambda s: 'Нулҳоро гузаронед.')
P('w3d1-28', 'Адад бе нулҳо', 'Адади n. Ҳамаи нулҳоро аз он хориҷ кунед ва ададро чоп кунед (1020300 → 123). Агар чизе намонад, 0 чоп кунед.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'long long r = 0;\nwhile (n > 0) {\n    if (n % 10 != 0) r = r * 10 + n % 10;\n    n /= 10;\n}\nlong long res = 0;\nwhile (r > 0) {\n    res = res * 10 + r % 10;\n    r /= 10;\n}\ncout << res << endl;',
  lambda s: str(int(s.strip().replace('0', '') or '0')), ['1020300', '0', '1000', '7'], big, why=lambda s: 'Аввал чаппаи бе нулҳо, баъд боз чаппа.')
P('w3d1-29', 'Рақами калонтарин ва ҷояш', 'Адади n. Рақами калонтаринро ва ҷойи онро аз чап (1, 2, …) чоп кунед. Агар чанд бошад — ҷойи аввалинашро.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Ду адад.',
  body(['n']) + 'long long len = 0, t = n;\ndo {\n    len++;\n    t /= 10;\n} while (t > 0);\nlong long mx = -1, pos = 0, i = 1;\ndo {\n    if (n % 10 >= mx) {\n        mx = n % 10;\n        pos = i;\n    }\n    n /= 10;\n    i++;\n} while (n > 0);\ncout << mx << " " << len - pos + 1 << endl;',
  lambda s: (lambda t: f'{max(t)} {t.index(max(t)) + 1}')(s.strip()), ['2925', '7', '0', '1999'], big, why=lambda s: 'Ҷойро аз чап ҳисоб кунед.')
P('w3d1-30', 'Ҷамъи рақамҳои кӣ калон?', 'Ду адад a ва b. Агар ҷамъи рақамҳои a калонтар бошад A, агар b — B, агар баробар — EQUAL.', 'Як сатр: a, b (0 ≤ x ≤ 10¹⁸).', 'A, B ё EQUAL.',
  body(['a', 'b']) + 'long long sa = 0, sb = 0;\nwhile (a > 0) {\n    sa += a % 10;\n    a /= 10;\n}\nwhile (b > 0) {\n    sb += b % 10;\n    b /= 10;\n}\nif (sa > sb) cout << "A";\nelse if (sb > sa) cout << "B";\nelse cout << "EQUAL";\ncout << endl;',
  lambda s: (lambda x, y: 'A' if x > y else 'B' if y > x else 'EQUAL')(*(sum(map(int, t)) for t in s.split())), ['99 100', '123 321', '5 41'], lambda r: f'{big(r)} {big(r)}', why=lambda s: 'Ду ҷамъ.')

# ───────── Рӯзи 2: чаппа кардани адад ─────────
use(3, 2); lvl('Миёна')
P('w3d2-11', 'Адад + чаппааш', 'Адади n. Ҷамъи n ва адади чаппаи онро ёбед.', 'Як адад n (0 ≤ n ≤ 10⁹).', 'Як адад.',
  body(['n']) + REV + 'cout << n + r << endl;', lambda s: str(n0(s) + rev(n0(s))), ['123', '120', '0', '5'], lambda r: str(R(r, 0, 10**9)), why=lambda s: f'{n0(s)} + {rev(n0(s))}')
P('w3d2-12', 'Адад − чаппааш', 'Адади n. Фарқи n ва адади чаппаи онро ёбед (метавонад манфӣ бошад).', 'Як адад n (0 ≤ n ≤ 10⁹).', 'Як адад.',
  body(['n']) + REV + 'cout << n - r << endl;', lambda s: str(n0(s) - rev(n0(s))), ['321', '123', '0', '100'], lambda r: str(R(r, 0, 10**9)), why=lambda s: f'{n0(s)} − {rev(n0(s))}')
P('w3d2-13', 'Рақамҳо бо вергул', 'Адади n. Рақамҳои онро аз охир ба аввал бо ", " ҷудо карда чоп кунед.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Масалан: 3, 2, 1',
  body(['n']) + 'do {\n    cout << n % 10;\n    n /= 10;\n    if (n > 0) cout << ", ";\n} while (n > 0);\ncout << endl;', lambda s: ', '.join(s.strip()[::-1]), ['123', '7', '0', '1000'], big,
  why=lambda s: 'Пас аз рақами охирин вергул нест.')
P('w3d2-14', 'Дучанди чаппа', 'Адади n. Адади чаппаи онро ду баробар карда чоп кунед.', 'Як адад n (0 ≤ n ≤ 10⁹).', 'Як адад.',
  body(['n']) + REV + 'cout << 2 * r << endl;', lambda s: str(2 * rev(n0(s))), ['123', '120', '0'], lambda r: str(R(r, 0, 10**9)), why=lambda s: f'2 · {rev(n0(s))}')
P('w3d2-15', 'Аввал ва охир баробар', 'Адади n. Агар рақами аввал ва охирини он баробар бошанд YES, вагарна NO.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'YES ё NO.',
  body(['n']) + 'long long last = n % 10;\nwhile (n >= 10) {\n    n /= 10;\n}\nif (n == last) cout << "YES";\nelse cout << "NO";\ncout << endl;',
  lambda s: yn(s.strip()[0] == s.strip()[-1]), ['1231', '1234', '7', '10'], big, why=lambda s: f'{s.strip()[0]} ва {s.strip()[-1]}')
P('w3d2-16', 'Ивази аввал ва охир', 'Адади n (n ≥ 10). Рақами аввал ва охирро иваз кунед ва ададро чоп кунед (1234 → 4231, 120 → 21).', 'Як адад n (10 ≤ n ≤ 10¹⁷).', 'Як адад.',
  body(['n']) + 'long long p = 1;\nwhile (n / p >= 10) p *= 10;\nlong long first = n / p, last = n % 10, mid = n % p / 10;\ncout << last * p + mid * 10 + first << endl;',
  lambda s: (lambda t: str(int(t[-1] + t[1:-1] + t[0])))(s.strip()), ['1234', '120', '10', '1203'], lambda r: str(R(r, 10, 10**17)), why=lambda s: 'Рақами аввал ва охир ҷой иваз мекунанд.')
P('w3d2-17', 'Кадом чаппа калон', 'Ду адад a ва b. Агар чаппаи a калон бошад A, агар чаппаи b — B, агар баробар — EQUAL.', 'Як сатр: a, b (0 ≤ x ≤ 10⁹).', 'A, B ё EQUAL.',
  body(['a', 'b']) + 'long long ra = 0, rb = 0;\nwhile (a > 0) {\n    ra = ra * 10 + a % 10;\n    a /= 10;\n}\nwhile (b > 0) {\n    rb = rb * 10 + b % 10;\n    b /= 10;\n}\nif (ra > rb) cout << "A";\nelse if (rb > ra) cout << "B";\nelse cout << "EQUAL";\ncout << endl;',
  lambda s: (lambda x, y: 'A' if x > y else 'B' if y > x else 'EQUAL')(*(rev(int(t)) for t in s.split())), ['19 91', '123 321', '10 1'], lambda r: rn(r, 2, 0, 10**9), why=lambda s: 'Аввал ҳарду ададро чаппа кунед.')
P('w3d2-18', 'Рақами аввал ба охир', 'Адади n. Рақами аввалро ба охир гузоред (1234 → 2341, 105 → 51).', 'Як адад n (0 ≤ n ≤ 10¹⁷).', 'Як адад.',
  body(['n']) + 'long long p = 1;\nwhile (n / p >= 10) p *= 10;\ncout << n % p * 10 + n / p << endl;', lambda s: (lambda t: str(int(t[1:] + t[0])))(s.strip()), ['1234', '105', '7', '0'],
  lambda r: str(R(r, 0, 10**17)), why=lambda s: 'Боқимонда · 10 + рақами аввал.')
P('w3d2-19', 'Рақами охир ба аввал', 'Адади n. Рақами охиринро ба аввал гузоред (1234 → 4123, 120 → 12).', 'Як адад n (0 ≤ n ≤ 10¹⁷).', 'Як адад.',
  body(['n']) + 'long long p = 1;\nwhile (n / p >= 10) p *= 10;\ncout << n % 10 * p + n / 10 << endl;', lambda s: (lambda t: str(int(t[-1] + t[:-1])))(s.strip()), ['1234', '120', '7', '0'],
  lambda r: str(R(r, 0, 10**17)), why=lambda s: 'Рақами охир · 10^(k−1) + n / 10.')
P('w3d2-20', 'Чаппаи адади манфӣ', 'Адади бутуни n (метавонад манфӣ бошад). Чаппаи онро бо ҳамон аломат чоп кунед (−120 → −21).', 'Як адад n (|n| ≤ 10⁹).', 'Як адад.',
  body(['n']) + 'long long sg = 1;\nif (n < 0) {\n    sg = -1;\n    n = -n;\n}\n' + REV + 'cout << sg * r << endl;', lambda s: str((-1 if n0(s) < 0 else 1) * rev(abs(n0(s)))),
  ['-120', '345', '0', '-7'], lambda r: str(R(r, -10**9, 10**9)), why=lambda s: 'Аломатро ҷудо нигоҳ доред.')

lvl('Душвор')
P('w3d2-21', 'Палиндром пас аз ҷамъ', 'Адади n. Агар n + чаппаи n палиндром бошад YES, вагарна NO.', 'Як адад n (0 ≤ n ≤ 10⁹).', 'YES ё NO.',
  body(['n']) + REV + 'long long s = n + r, t = 0, u = s;\nwhile (u > 0) {\n    t = t * 10 + u % 10;\n    u /= 10;\n}\nif (t == s) cout << "YES";\nelse cout << "NO";\ncout << endl;',
  lambda s: yn(pal(n0(s) + rev(n0(s)))), ['12', '57', '0', '89'], lambda r: str(R(r, 0, 10**9)), why=lambda s: f'{n0(s)} + {rev(n0(s))} = {n0(s) + rev(n0(s))}')
P('w3d2-22', 'Палиндроми наздиктарин', 'Адади n. Хурдтарин палиндромеро, ки аз n хурд нест, ёбед.', 'Як адад n (0 ≤ n ≤ 10⁶).', 'Як адад.',
  body(['n']) + 'while (true) {\n    long long r = 0, m = n;\n    while (m > 0) {\n        r = r * 10 + m % 10;\n        m /= 10;\n    }\n    if (r == n) break;\n    n++;\n}\ncout << n << endl;',
  lambda s: (lambda n: str(next(k for k in range(n, n + 10**6) if pal(k))))(n0(s)), ['120', '121', '0', '999'], lambda r: str(R(r, 0, 10**6)), why=lambda s: 'Яке-яке зиёд кунед ва санҷед.')
P('w3d2-23', 'Шумораи палиндромҳо', 'Адади n. Аз 1 то n чанд палиндром ҳаст?', 'Як адад n (1 ≤ n ≤ 10⁵).', 'Як адад.',
  body(['n']) + 'long long cnt = 0, k = 1;\nwhile (k <= n) {\n    long long r = 0, m = k;\n    while (m > 0) {\n        r = r * 10 + m % 10;\n        m /= 10;\n    }\n    if (r == k) cnt++;\n    k++;\n}\ncout << cnt << endl;',
  lambda s: str(sum(1 for k in range(1, n0(s) + 1) if pal(k))), ['10', '100', '1', '100000'], lambda r: str(R(r, 1, 10**5)), why=lambda s: 'Ҳар ададро санҷед.')
P('w3d2-24', 'Чаппаи ҳамдигар', 'Ду адад a ва b. Агар b чаппаи a бошад YES, вагарна NO.', 'Як сатр: a, b (0 ≤ x ≤ 10⁹).', 'YES ё NO.',
  body(['a', 'b']) + 'long long r = 0, m = a;\nwhile (m > 0) {\n    r = r * 10 + m % 10;\n    m /= 10;\n}\nif (r == b) cout << "YES";\nelse cout << "NO";\ncout << endl;',
  lambda s: yn(rev(nums(s)[0]) == nums(s)[1]), ['123 321', '120 21', '120 210', '5 5'], lambda r: (lambda a: r.choice([f'{a} {rev(a)}', f'{a} {R(r, 0, 10**9)}']))(R(r, 0, 10**9)), why=lambda s: 'Чаппаи a-ро бо b муқоиса кунед.')
P('w3d2-25', 'Рақамҳои ҷуфт аз охир', 'Адади n. Рақамҳои ҷуфти онро аз охир ба аввал бо фосила чоп кунед. Агар набошад, NONE.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Рақамҳо ё NONE.',
  body(['n']) + 'bool none = true;\ndo {\n    long long d = n % 10;\n    if (d % 2 == 0) {\n        if (!none) cout << " ";\n        cout << d;\n        none = false;\n    }\n    n /= 10;\n} while (n > 0);\nif (none) cout << "NONE";\ncout << endl;',
  lambda s: ' '.join(c for c in s.strip()[::-1] if int(c) % 2 == 0) or 'NONE', ['12345', '1357', '0', '2468'], big, why=lambda s: 'Аз рақами охир сар кунед.')
P('w3d2-26', 'Адади оинагӣ', 'Адади n. Адад ва чаппаи онро паси ҳам нависед (123 → 123321, 120 → 120021).', 'Як адад n (0 ≤ n ≤ 10⁸).', 'Як адад.',
  body(['n']) + 'long long r = n, m = n;\nwhile (m > 0) {\n    r = r * 10 + m % 10;\n    m /= 10;\n}\ncout << r << endl;', lambda s: str(int(s.strip() + s.strip()[::-1])), ['123', '120', '0', '7'],
  lambda r: str(R(r, 0, 10**8)), why=lambda s: 'Ба n рақамҳоро аз охир илова кунед.')
P('w3d2-27', 'Бузургтарин аз рақамҳо', 'Адади n. Аз рақамҳои он бузургтарин ададро созед (рақамҳоро аз калон ба хурд гузоред).', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'int cnt[10] = {0};\ndo {\n    cnt[n % 10]++;\n    n /= 10;\n} while (n > 0);\nlong long res = 0;\nint d = 9;\nwhile (d >= 0) {\n    while (cnt[d] > 0) {\n        res = res * 10 + d;\n        cnt[d]--;\n    }\n    d--;\n}\ncout << res << endl;',
  lambda s: str(int(''.join(sorted(s.strip(), reverse=True)))), ['2025', '7', '0', '1000000000000000000'], big, why=lambda s: 'Рақамҳоро ҳисоб кунед ва аз 9 сар кунед.')
P('w3d2-28', 'Хурдтарин аз рақамҳо', 'Адади n (n ≥ 1). Аз рақамҳои он хурдтарин ададро бе 0 дар аввал созед (3010 → 1003).', 'Як адад n (1 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'int cnt[10] = {0};\nwhile (n > 0) {\n    cnt[n % 10]++;\n    n /= 10;\n}\nint f = 1;\nwhile (cnt[f] == 0) f++;\ncnt[f]--;\nlong long res = f;\nint d = 0;\nwhile (d <= 9) {\n    while (cnt[d] > 0) {\n        res = res * 10 + d;\n        cnt[d]--;\n    }\n    d++;\n}\ncout << res << endl;',
  lambda s: (lambda t: (lambda i: str(int(t[i] + ''.join(t[:i] + t[i + 1:]))))(next(i for i, c in enumerate(t) if c != '0')))(sorted(s.strip())), ['3010', '7', '1000', '987654321'],
  lambda r: str(R(r, 1, 10**18)), why=lambda s: 'Аввал рақами хурдтарини ғайрисифр, баъд нулҳо ва дигарон.')
P('w3d2-29', 'Палиндроми дуӣ', 'Адади n. Агар навишти дуии он палиндром бошад YES, вагарна NO (масалан, 5 = 101 — YES).', 'Як адад n (1 ≤ n ≤ 10⁹).', 'YES ё NO.',
  body(['n']) + 'long long r = 0, m = n;\nwhile (m > 0) {\n    r = r * 2 + m % 2;\n    m /= 2;\n}\nif (r == n) cout << "YES";\nelse cout << "NO";\ncout << endl;',
  lambda s: yn(bin(n0(s))[2:] == bin(n0(s))[2:][::-1]), ['5', '6', '1', '9', '585'], lambda r: str(R(r, 1, 10**9)), why=lambda s: f'{n0(s)} = {bin(n0(s))[2:]} (дуӣ)')
def _p2(n):
    k = 0
    while not pal(n) and k < 40:
        n += rev(n); k += 1
    return k, n
def _p2gen(r):
    while True:
        n = R(r, 1, 10**4)
        k, m = _p2(n)
        if k <= 30 and m < 10**16: return str(n)
P('w3d2-30', 'Қадамҳо то палиндром', 'Адади n. То он даме ки n палиндром нест, n = n + чаппаи n мекунем. Шумораи қадамҳо ва палиндроми ҳосилшударо чоп кунед.', 'Як адад n (1 ≤ n ≤ 10⁴; ҷавоб ҳатман ҳаст).', 'Ду адад.',
  body(['n']) + 'long long steps = 0;\nwhile (true) {\n    long long r = 0, m = n;\n    while (m > 0) {\n        r = r * 10 + m % 10;\n        m /= 10;\n    }\n    if (r == n) break;\n    n += r;\n    steps++;\n}\ncout << steps << " " << n << endl;',
  lambda s: '{} {}'.format(*_p2(n0(s))), ['87', '5', '10', '89'], _p2gen, why=lambda s: 'Масалан: 87 → 165 → 726 → 1353 → 4884.')

# ───────── Рӯзи 3: тақсимкунандаҳо ва ТУК ─────────
use(3, 3); lvl('Миёна')
P('w3d3-11', 'Тақсимкунандаи калонтарин', 'Адади n (n ≥ 2). Тақсимкунандаи калонтарини онро, ки аз n хурд аст, ёбед.', 'Як адад n (2 ≤ n ≤ 10¹²).', 'Як адад.',
  body(['n']) + 'long long d = 2;\nwhile (d * d <= n && n % d != 0) d++;\nif (d * d > n) d = n;\ncout << n / d << endl;', lambda s: (lambda n: str(n // next((d for d in range(2, math.isqrt(n) + 1) if n % d == 0), n)))(n0(s)),
  ['12', '13', '2', '1000000000000'], lambda r: str(R(r, 2, 10**12)), why=lambda s: 'n / (тақсимкунандаи хурдтарин).')
P('w3d3-12', 'ТУК-и се адад', 'Се адади мусбат. Тақсимкунандаи умумии калонтарини онҳоро ёбед.', 'Як сатр: a, b, c (1 ≤ x ≤ 10¹⁸).', 'Як адад.',
  body(['a', 'b', 'c']) + 'while (b != 0) {\n    long long t = a % b;\n    a = b;\n    b = t;\n}\nwhile (c != 0) {\n    long long t = a % c;\n    a = c;\n    c = t;\n}\ncout << a << endl;',
  lambda s: str(math.gcd(*nums(s))), ['12 18 24', '7 13 5', '100 100 100'], lambda r: (lambda g: f'{g * R(r, 1, 10**6)} {g * R(r, 1, 10**6)} {g * R(r, 1, 10**6)}')(R(r, 1, 10**6)), why=lambda s: 'ТУК(ТУК(a, b), c).')
P('w3d3-13', 'ХУК-и се адад', 'Се адади мусбат. Хурдтарин каратии умумии онҳоро ёбед.', 'Як сатр: a, b, c (1 ≤ x ≤ 10⁶).', 'Як адад.',
  body(['a', 'b', 'c']) + 'long long x = a, y = b;\nwhile (y != 0) {\n    long long t = x % y;\n    x = y;\n    y = t;\n}\nlong long l = a / x * b;\nx = l;\ny = c;\nwhile (y != 0) {\n    long long t = x % y;\n    x = y;\n    y = t;\n}\ncout << l / x * c << endl;',
  lambda s: (lambda a, b, c: str(math.lcm(a, b, c)))(*nums(s)), ['2 3 4', '6 10 15', '7 7 7'], lambda r: rn(r, 3, 1, 10**6), why=lambda s: 'ХУК(a, b) = a / ТУК · b.')
P('w3d3-14', 'Тақсимкунандаҳои ҷуфт', 'Адади n. Чанд тақсимкунандаи ҷуфт дорад?', 'Як адад n (1 ≤ n ≤ 10⁶).', 'Як адад.',
  body(['n']) + 'long long cnt = 0, d = 2;\nwhile (d <= n) {\n    if (n % d == 0) cnt++;\n    d += 2;\n}\ncout << cnt << endl;', lambda s: str(sum(1 for d in range(2, n0(s) + 1, 2) if n0(s) % d == 0)),
  ['12', '7', '1', '1000000'], lambda r: str(R(r, 1, 10**6)), why=lambda s: 'Танҳо 2, 4, 6, …-ро санҷед.')
P('w3d3-15', 'Ҷамъи тақсимкунандаҳои тоқ', 'Адади n. Ҷамъи тақсимкунандаҳои тоқи онро ёбед.', 'Як адад n (1 ≤ n ≤ 10⁶).', 'Як адад.',
  body(['n']) + 'long long s = 0, d = 1;\nwhile (d <= n) {\n    if (n % d == 0) s += d;\n    d += 2;\n}\ncout << s << endl;', lambda s: str(sum(d for d in range(1, n0(s) + 1, 2) if n0(s) % d == 0)),
  ['12', '9', '1', '999999'], lambda r: str(R(r, 1, 10**6)), why=lambda s: '1, 3, 5, …')
P('w3d3-16', 'Тақсимкунандаҳои умумӣ', 'Ду адади мусбат a ва b. Чанд тақсимкунандаи умумӣ доранд? (Маслиҳат: тақсимкунандаҳои ТУК.)', 'Як сатр: a, b (1 ≤ x ≤ 10⁹).', 'Як адад.',
  body(['a', 'b']) + 'while (b != 0) {\n    long long t = a % b;\n    a = b;\n    b = t;\n}\nlong long cnt = 0, d = 1;\nwhile (d * d <= a) {\n    if (a % d == 0) {\n        cnt++;\n        if (d != a / d) cnt++;\n    }\n    d++;\n}\ncout << cnt << endl;',
  lambda s: str(_ndiv(math.gcd(*nums(s)))),
  ['12 18', '7 13', '100 100'], lambda r: (lambda g: f'{g * R(r, 1, 1000)} {g * R(r, 1, 1000)}')(R(r, 1, 10**6)), why=lambda s: f'ТУК = {math.gcd(*nums(s))}.')
P('w3d3-17', 'Содаҳои дугоник', 'Адади n. Агар n ва n + 2 ҳарду сода бошанд YES, вагарна NO.', 'Як адад n (1 ≤ n ≤ 10⁹).', 'YES ё NO.',
  body(['n']) + 'bool ok = true;\nlong long k = 0;\nwhile (k <= 2) {\n    long long x = n + k;\n    if (x < 2) ok = false;\n    long long d = 2;\n    while (d * d <= x) {\n        if (x % d == 0) ok = false;\n        d++;\n    }\n    k += 2;\n}\nif (ok) cout << "YES";\nelse cout << "NO";\ncout << endl;',
  lambda s: yn(isprime(n0(s)) and isprime(n0(s) + 2)), ['11', '7', '1', '17', '1000000007'], lambda r: str(R(r, 1, 10**5)), why=lambda s: f'{n0(s)} ва {n0(s) + 2}')
P('w3d3-18', 'Касри омехта', 'Каср a / b. Қисми бутун ва касри боқимондаи ихтисоршударо чоп кунед: q p d. Агар боқимонда набошад: q 0 1.', 'Як сатр: a, b (1 ≤ x ≤ 10⁹).', 'Се адад.',
  body(['a', 'b']) + 'long long q = a / b, p = a % b;\nlong long x = p, y = b;\nwhile (y != 0) {\n    long long t = x % y;\n    x = y;\n    y = t;\n}\nif (p == 0) cout << q << " 0 1" << endl;\nelse cout << q << " " << p / x << " " << b / x << endl;',
  lambda s: (lambda a, b: (lambda q, p: f'{q} 0 1' if p == 0 else f'{q} {p // math.gcd(p, b)} {b // math.gcd(p, b)}')(a // b, a % b))(*nums(s)), ['7 3', '10 4', '9 3', '2 5'],
  lambda r: f'{R(r, 1, 1000)} {R(r, 1, 100)}', why=lambda s: 'Аввал қисми бутун, баъд боқимонда / b-ро ихтисор кунед.')
P('w3d3-19', 'Ҷамъи ду каср', 'Ду каср a/b ва c/d. Ҷамъи онҳоро ҳамчун касри ихтисоршуда «p q» чоп кунед.', 'Як сатр: a, b, c, d (1 ≤ x ≤ 10⁴).', 'Ду адад.',
  body(['a', 'b', 'c', 'd']) + 'long long p = a * d + c * b, q = b * d;\nlong long x = p, y = q;\nwhile (y != 0) {\n    long long t = x % y;\n    x = y;\n    y = t;\n}\ncout << p / x << " " << q / x << endl;',
  lambda s: (lambda a, b, c, d: (lambda p, q: f'{p // math.gcd(p, q)} {q // math.gcd(p, q)}')(a * d + c * b, b * d))(*nums(s)), ['1 2 1 3', '1 4 1 4', '3 5 2 5'], lambda r: rn(r, 4, 1, 100),
  why=lambda s: 'a·d + c·b дар сурат, b·d дар махраҷ.')
P('w3d3-20', 'Ададҳои ҳамсода бо n', 'Адади n. Аз 1 то n чанд адад бо n ҳамсода аст (ТУК = 1)?', 'Як адад n (1 ≤ n ≤ 10⁵).', 'Як адад.',
  body(['n']) + 'long long cnt = 0, k = 1;\nwhile (k <= n) {\n    long long x = k, y = n;\n    while (y != 0) {\n        long long t = x % y;\n        x = y;\n        y = t;\n    }\n    if (x == 1) cnt++;\n    k++;\n}\ncout << cnt << endl;',
  lambda s: str(sum(1 for k in range(1, n0(s) + 1) if math.gcd(k, n0(s)) == 1)), ['10', '7', '1', '100000'], lambda r: str(R(r, 1, 10**5)), why=lambda s: 'ТУК-и ҳар k бо n.')

lvl('Душвор')
P('w3d3-21', 'Зарбкунандаи содаи калонтарин', 'Адади n (n ≥ 2). Зарбкунандаи содаи калонтарини онро ёбед.', 'Як адад n (2 ≤ n ≤ 10¹²).', 'Як адад.',
  body(['n']) + 'long long best = 1, d = 2;\nwhile (d * d <= n) {\n    while (n % d == 0) {\n        best = d;\n        n /= d;\n    }\n    d++;\n}\nif (n > 1) best = n;\ncout << best << endl;',
  lambda s: str(_lpf(n0(s))),
  ['12', '13', '2', '600851475143'], lambda r: str(R(r, 2, 10**12)), why=lambda s: 'Ҳар тақсимкунандаро то охир тақсим кунед.')
P('w3d3-22', 'Зарбкунандаҳои содаи гуногун', 'Адади n (n ≥ 1). Чанд зарбкунандаи содаи гуногун дорад?', 'Як адад n (1 ≤ n ≤ 10¹²).', 'Як адад.',
  body(['n']) + 'long long cnt = 0, d = 2;\nwhile (d * d <= n) {\n    if (n % d == 0) {\n        cnt++;\n        while (n % d == 0) n /= d;\n    }\n    d++;\n}\nif (n > 1) cnt++;\ncout << cnt << endl;',
  lambda s: str(_npf(n0(s))), ['12', '1', '30', '1000000007'], lambda r: str(R(r, 1, 10**12)), why=lambda s: 'Ҳар содаро як бор ҳисоб кунед.')
P('w3d3-23', 'Адади фаровон', 'Адади n. Агар ҷамъи тақсимкунандаҳои аз n хурд аз n калон бошад YES, вагарна NO.', 'Як адад n (1 ≤ n ≤ 10⁹).', 'YES ё NO.',
  body(['n']) + 'long long s = (n > 1) ? 1 : 0, d = 2;\nwhile (d * d <= n) {\n    if (n % d == 0) {\n        s += d;\n        if (d != n / d) s += n / d;\n    }\n    d++;\n}\nif (s > n) cout << "YES";\nelse cout << "NO";\ncout << endl;',
  lambda s: yn(sdiv(n0(s)) > n0(s)), ['12', '28', '1', '945'], lambda r: str(R(r, 1, 10**6)), why=lambda s: f'Ҷамъ = {sdiv(n0(s))}.')
P('w3d3-24', 'Ададҳои дӯстона', 'Ду адад a ва b (a ≠ b) дӯстонаанд, агар ҷамъи тақсимкунандаҳои хурди a ба b ва ҷамъи тақсимкунандаҳои хурди b ба a баробар бошад. YES ё NO.', 'Як сатр: a, b (1 ≤ x ≤ 10⁶).', 'YES ё NO.',
  body(['a', 'b']) + 'long long s[2] = {0, 0}, v[2] = {a, b};\nint i = 0;\nwhile (i < 2) {\n    long long n = v[i], t = (n > 1) ? 1 : 0, d = 2;\n    while (d * d <= n) {\n        if (n % d == 0) {\n            t += d;\n            if (d != n / d) t += n / d;\n        }\n        d++;\n    }\n    s[i] = t;\n    i++;\n}\nif (a != b && s[0] == b && s[1] == a) cout << "YES";\nelse cout << "NO";\ncout << endl;',
  lambda s: (lambda a, b: yn(a != b and sdiv(a) == b and sdiv(b) == a))(*nums(s)), ['220 284', '1184 1210', '6 6', '220 285', '2620 2924'], lambda r: rn(r, 2, 1, 10**4), why=lambda s: 'Ҷамъҳоро муқоиса кунед.')
P('w3d3-25', 'Қадамҳои Евклид', 'Ду адади мусбат a ва b. Алгоритми Евклид: то b ≠ 0: (a, b) = (b, a % b). ТУК ва шумораи қадамҳоро чоп кунед.', 'Як сатр: a, b (1 ≤ x ≤ 10¹⁸).', 'Ду адад.',
  body(['a', 'b']) + 'long long steps = 0;\nwhile (b != 0) {\n    long long t = a % b;\n    a = b;\n    b = t;\n    steps++;\n}\ncout << a << " " << steps << endl;',
  lambda s: (lambda a, b: (lambda f: f(f, a, b, 0))(lambda f, a, b, k: f'{a} {k}' if b == 0 else f(f, b, a % b, k + 1)))(*nums(s)), ['12 18', '18 12', '7 7', '1 1000000000000000000'],
  lambda r: rn(r, 2, 1, 10**18), why=lambda s: 'Ҳар такрор — як қадам.')
P('w3d3-26', 'Содаҳо дар фосила', 'Ду адад a ва b (a ≤ b). Дар фосилаи [a; b] чанд адади сода ҳаст?', 'Як сатр: a, b (1 ≤ a ≤ b ≤ 10⁶, b − a ≤ 10⁴).', 'Як адад.',
  body(['a', 'b']) + 'long long cnt = 0, x = a;\nwhile (x <= b) {\n    bool p = x >= 2;\n    long long d = 2;\n    while (d * d <= x && p) {\n        if (x % d == 0) p = false;\n        d++;\n    }\n    if (p) cnt++;\n    x++;\n}\ncout << cnt << endl;',
  lambda s: (lambda a, b: str(sum(1 for x in range(a, b + 1) if isprime(x))))(*nums(s)), ['1 10', '10 20', '1 1', '999000 1000000'], lambda r: (lambda a: f'{a} {R(r, a, min(10**6, a + 2000))}')(R(r, 1, 10**6)),
  why=lambda s: 'Ҳар ададро санҷед.')
P('w3d3-27', 'Ҷуфт-ҷуфт ҳамсода', 'Се адад a, b, c. Агар ҳар ду адад аз онҳо ҳамсода бошанд (ТУК = 1) YES, вагарна NO.', 'Як сатр: a, b, c (1 ≤ x ≤ 10⁹).', 'YES ё NO.',
  body(['a', 'b', 'c']) + 'long long v[3] = {a, b, c};\nbool ok = true;\nint i = 0;\nwhile (i < 3) {\n    long long x = v[i], y = v[(i + 1) % 3];\n    while (y != 0) {\n        long long t = x % y;\n        x = y;\n        y = t;\n    }\n    if (x != 1) ok = false;\n    i++;\n}\nif (ok) cout << "YES";\nelse cout << "NO";\ncout << endl;',
  lambda s: (lambda a, b, c: yn(math.gcd(a, b) == 1 and math.gcd(b, c) == 1 and math.gcd(a, c) == 1))(*nums(s)), ['3 4 5', '6 10 15', '1 1 1', '2 3 4'], lambda r: rn(r, 3, 1, 50), why=lambda s: 'Се ҷуфтро санҷед.')
P('w3d3-28', 'Тақсимкунандаҳо аз калон', 'Адади n. Ҳамаи тақсимкунандаҳои онро аз калон ба хурд бо фосила чоп кунед.', 'Як адад n (1 ≤ n ≤ 10⁶).', 'Ададҳо.',
  body(['n']) + 'long long d = n;\nbool first = true;\nwhile (d >= 1) {\n    if (n % d == 0) {\n        if (!first) cout << " ";\n        cout << d;\n        first = false;\n    }\n    d--;\n}\ncout << endl;',
  lambda s: ' '.join(str(d) for d in range(n0(s), 0, -1) if n0(s) % d == 0), ['12', '7', '1', '1000000'], lambda r: str(R(r, 1, 10**6)), why=lambda s: 'Аз n то 1.')
P('w3d3-29', 'Квадрати пурра', 'Адади n. Агар он квадрати адади бутун бошад YES, вагарна NO.', 'Як адад n (0 ≤ n ≤ 10¹²).', 'YES ё NO.',
  body(['n']) + 'long long i = 0;\nwhile (i * i < n) i++;\nif (i * i == n) cout << "YES";\nelse cout << "NO";\ncout << endl;', lambda s: yn(math.isqrt(n0(s)) ** 2 == n0(s)),
  ['49', '50', '0', '1000000000000'], lambda r: r.choice([str(R(r, 0, 10**12)), str(R(r, 0, 10**6) ** 2)]), why=lambda s: 'i-ро то i·i ≥ n зиёд кунед.')
P('w3d3-30', 'Ҷамъи ТУК-ҳо', 'Адади n. Ҷамъи ТУК(1, n) + ТУК(2, n) + … + ТУК(n, n)-ро ёбед.', 'Як адад n (1 ≤ n ≤ 10⁵).', 'Як адад.',
  body(['n']) + 'long long s = 0, k = 1;\nwhile (k <= n) {\n    long long x = k, y = n;\n    while (y != 0) {\n        long long t = x % y;\n        x = y;\n        y = t;\n    }\n    s += x;\n    k++;\n}\ncout << s << endl;',
  lambda s: str(sum(math.gcd(k, n0(s)) for k in range(1, n0(s) + 1))), ['6', '1', '7', '100000'], lambda r: str(R(r, 1, 10**5)), why=lambda s: 'ТУК-и ҳар k бо n.')

# ───────── Рӯзи 4: дараҷаҳо ва нимкунӣ ─────────
use(3, 4); lvl('Миёна')
P('w3d4-11', 'Дараҷаҳои 3', 'Адади n. Ҳамаи дараҷаҳои 3-ро (1, 3, 9, …), ки аз n калон нестанд, бо фосила чоп кунед.', 'Як адад n (1 ≤ n ≤ 10¹⁸).', 'Ададҳо.',
  body(['n']) + 'long long p = 1;\nwhile (p <= n) {\n    if (p > 1) cout << " ";\n    cout << p;\n    p *= 3;\n}\ncout << endl;', lambda s: ' '.join(str(3 ** k) for k in range(40) if 3 ** k <= n0(s)),
  ['30', '1', '81', '1000000000000000000'], lambda r: str(R(r, 1, 10**18)), why=lambda s: 'Ҳар дафъа ба 3 зарб кунед.')
P('w3d4-12', 'Логарифми бутун', 'Адади n. Калонтарин k-ро ёбед, ки 2ᵏ ≤ n.', 'Як адад n (1 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'long long k = 0, p = 1;\nwhile (p * 2 <= n) {\n    p *= 2;\n    k++;\n}\ncout << k << endl;', lambda s: str(n0(s).bit_length() - 1), ['10', '1', '1024', '1000000000000000000'],
  lambda r: str(R(r, 1, 10**18)), why=lambda s: f'2^{n0(s).bit_length() - 1} ≤ {n0(s)}')
P('w3d4-13', 'Чанд бор ба 2', 'Адади n (n ≥ 1). Чанд бор онро паи ҳам ба 2 бе бақия тақсим кардан мумкин аст?', 'Як адад n (1 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'long long k = 0;\nwhile (n % 2 == 0) {\n    n /= 2;\n    k++;\n}\ncout << k << endl;', lambda s: str((n0(s) & -n0(s)).bit_length() - 1), ['12', '7', '1024', '96'],
  lambda r: str(R(r, 1, 10**18)), why=lambda s: 'То тоқ шудан тақсим кунед.')
P('w3d4-14', 'Дараҷаи 10 аст?', 'Адади n (n ≥ 1). Агар он дараҷаи 10 бошад (1, 10, 100, …) YES, вагарна NO.', 'Як адад n (1 ≤ n ≤ 10¹⁸).', 'YES ё NO.',
  body(['n']) + 'while (n % 10 == 0) {\n    n /= 10;\n}\nif (n == 1) cout << "YES";\nelse cout << "NO";\ncout << endl;', lambda s: yn(s.strip().rstrip('0') == '1'),
  ['1000', '1001', '1', '20'], lambda r: r.choice([str(10 ** R(r, 0, 18)), str(R(r, 1, 10**18))]), why=lambda s: 'Нулҳоро хориҷ кунед ва 1-ро санҷед.')
P('w3d4-15', 'Тақсим ба 3 то сифр', 'Адади n. Онро паи ҳам ба 3 тақсим мекунем (қисми бутун), то 0 шавад. Чанд тақсим лозим аст?', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'long long k = 0;\nwhile (n > 0) {\n    n /= 3;\n    k++;\n}\ncout << k << endl;', lambda s: str(len(_base(n0(s), 3)) if n0(s) else 0), ['10', '0', '1', '1000000000000000000'],
  lambda r: str(R(r, 0, 10**18)), why=lambda s: 'Ин шумораи рақамҳои n дар системаи сеӣ аст.')
P('w3d4-16', 'Ҷамъи дараҷаҳои 2', 'Адади n. Ҷамъи ҳамаи дараҷаҳои 2-ро (1 + 2 + 4 + …), ки аз n калон нестанд, ёбед.', 'Як адад n (1 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'long long p = 1, s = 0;\nwhile (p <= n) {\n    s += p;\n    p *= 2;\n}\ncout << s << endl;', lambda s: str(2 ** n0(s).bit_length() - 1), ['10', '1', '16', '1000000000000000000'],
  lambda r: str(R(r, 1, 10**18)), why=lambda s: '1 + 2 + 4 + …')
P('w3d4-17', 'Системаи сеӣ', 'Адади n. Онро дар системаи сеӣ чоп кунед (10 → 101).', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Рақамҳои 0, 1, 2.',
  body(['n']) + 'string s = "";\ndo {\n    s = char(\'0\' + n % 3) + s;\n    n /= 3;\n} while (n > 0);\ncout << s << endl;', lambda s: _base(n0(s), 3) or '0', ['10', '0', '1', '1000000000000000000'],
  lambda r: str(R(r, 0, 10**18)), why=lambda s: 'Бақияҳои тақсим ба 3 аз охир.', inc=STR)
P('w3d4-18', 'Бактерияҳо', 'Ҳар соат шумораи бактерияҳо ду баробар мешавад. Дар аввал a бактерия буд. Пас аз h соат чанд мешавад?', 'Як сатр: a, h (1 ≤ a ≤ 10⁶, 0 ≤ h ≤ 40).', 'Як адад.',
  body(['a', 'h']) + 'while (h > 0) {\n    a *= 2;\n    h--;\n}\ncout << a << endl;', lambda s: str(nums(s)[0] * 2 ** nums(s)[1]), ['3 4', '1 0', '1000000 40'], lambda r: f'{R(r, 1, 10**6)} {R(r, 0, 40)}',
  why=lambda s: f'{nums(s)[0]} · 2^{nums(s)[1]}')
P('w3d4-19', 'Буридани ресмон', 'Ресмон L метр аст. Ҳар дафъа онро дар ним мебуранд ва нимаашро (қисми бутун) мегиранд, то дарозӣ аз k хурд шавад. Чанд бор буриданд?', 'Як сатр: L, k (0 ≤ L ≤ 10¹⁸, 1 ≤ k ≤ 10¹⁸).', 'Як адад.',
  body(['l', 'k']) + 'long long c = 0;\nwhile (l >= k) {\n    l /= 2;\n    c++;\n}\ncout << c << endl;', lambda s: (lambda l, k: str(next(c for c in range(200) if l >> c < k)))(*nums(s)), ['100 10', '5 10', '1 1', '1000000000000000000 3'],
  lambda r: f'{R(r, 0, 10**18)} {R(r, 1, 10**6)}', why=lambda s: 'То дарозӣ < k нимкунӣ.')
P('w3d4-20', 'Дараҷаи k аст?', 'Ду адад n ва k (k ≥ 2). Агар n дараҷаи k бошад (1, k, k², …) YES, вагарна NO.', 'Як сатр: n, k (1 ≤ n ≤ 10¹⁸, 2 ≤ k ≤ 10⁹).', 'YES ё NO.',
  body(['n', 'k']) + 'while (n % k == 0) {\n    n /= k;\n}\nif (n == 1) cout << "YES";\nelse cout << "NO";\ncout << endl;', lambda s: yn(_ispow(*nums(s))), ['27 3', '28 3', '1 5', '1024 4'],
  lambda r: (lambda k: r.choice([f'{k ** R(r, 0, 10)} {k}', f'{R(r, 1, 10**6)} {k}']))(R(r, 2, 6)), why=lambda s: 'Ба k тақсим кунед, то бақия пайдо шавад.')

lvl('Душвор')
P('w3d4-21', 'Ҷамъи рақамҳои 2ⁿ', 'Адади n. Ҷамъи рақамҳои 2ⁿ-ро ёбед.', 'Як адад n (0 ≤ n ≤ 60).', 'Як адад.',
  body(['n']) + 'long long p = 1;\nwhile (n > 0) {\n    p *= 2;\n    n--;\n}\nlong long s = 0;\nwhile (p > 0) {\n    s += p % 10;\n    p /= 10;\n}\ncout << s << endl;', lambda s: str(sum(digits(2 ** n0(s)))),
  ['10', '0', '60', '15'] + [str(i) for i in (1, 7, 20, 33, 47, 59)], why=lambda s: f'2^{n0(s)} = {2 ** n0(s)}')
P('w3d4-22', 'Дараҷаи тез бо модул', 'Се адад a, b, m. aᵇ mod m-ро ёбед (b хеле калон аст — дараҷаи тезро истифода баред).', 'Як сатр: a, b, m (0 ≤ a ≤ 10⁹, 0 ≤ b ≤ 10¹⁸, 1 ≤ m ≤ 10⁹).', 'Як адад.',
  body(['a', 'b', 'm']) + 'long long res = 1 % m;\na %= m;\nwhile (b > 0) {\n    if (b % 2 == 1) res = res * a % m;\n    a = a * a % m;\n    b /= 2;\n}\ncout << res << endl;',
  lambda s: str(pow(*nums(s))), ['2 10 1000', '3 0 7', '5 3 1', '123456789 1000000000000000000 998244353'], lambda r: f'{R(r, 0, 10**9)} {R(r, 0, 10**18)} {R(r, 1, 10**9)}', why=lambda s: 'Дараҷаи тез: b-ро ним кунед.')
P('w3d4-23', 'Аз дуӣ ба даҳӣ', 'Адад дар системаи дуӣ дода шудааст (сатр аз 0 ва 1, то 60 рақам). Онро дар системаи даҳӣ чоп кунед.', 'Як сатр аз 0 ва 1.', 'Як адад.',
  'string s;\ncin >> s;\nlong long v = 0;\nint i = 0;\nwhile (i < (int)s.size()) {\n    v = v * 2 + (s[i] - \'0\');\n    i++;\n}\ncout << v << endl;', lambda s: str(int(s.split()[0], 2)),
  ['101', '0', '1', '111111111111111111111111111111111111111111111111111111111111'], lambda r: bin(R(r, 0, 2**60 - 1))[2:], why=lambda s: 'v = v · 2 + рақам.', inc=STR)
P('w3d4-24', 'Коллатс: қимати калонтарин', 'Адади n. Пайдарпаии Коллатс: агар ҷуфт — n/2, агар тоқ — 3n + 1, то 1. Қимати калонтаринеро, ки пайдо мешавад, ёбед.', 'Як адад n (1 ≤ n ≤ 10⁶).', 'Як адад.',
  body(['n']) + 'long long mx = n;\nwhile (n != 1) {\n    if (n % 2 == 0) n /= 2;\n    else n = 3 * n + 1;\n    if (n > mx) mx = n;\n}\ncout << mx << endl;', lambda s: str(_cmax(n0(s))), ['6', '1', '27', '77031'],
  lambda r: str(R(r, 1, 10**6)), why=lambda s: 'Калонтаринро нигоҳ доред.')
P('w3d4-25', 'Ҷамъи дараҷаҳои 2', 'Адади n. Онро ҳамчун ҷамъи дараҷаҳои гуногуни 2 нависед: дараҷаҳоро аз хурд ба калон чоп кунед (13 → 1 4 8).', 'Як адад n (1 ≤ n ≤ 10¹⁸).', 'Ададҳо.',
  body(['n']) + 'long long p = 1;\nbool first = true;\nwhile (n > 0) {\n    if (n % 2 == 1) {\n        if (!first) cout << " ";\n        cout << p;\n        first = false;\n    }\n    n /= 2;\n    p *= 2;\n}\ncout << endl;',
  lambda s: ' '.join(str(1 << i) for i in range(64) if n0(s) >> i & 1), ['13', '1', '1024', '1000000000000000000'], lambda r: str(R(r, 1, 10**18)), why=lambda s: 'Ин рақамҳои дуии n аст.')
P('w3d4-26', 'Нулҳои охири n!', 'Адади n. n! = 1·2·…·n. Дар охири он чанд нул ҳаст? (Маслиҳат: n/5 + n/25 + n/125 + …)', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'long long c = 0;\nwhile (n > 0) {\n    n /= 5;\n    c += n;\n}\ncout << c << endl;', lambda s: str(_fz(n0(s))), ['10', '4', '100', '1000000000000000000'], lambda r: str(R(r, 0, 10**18)),
  why=lambda s: 'Ҳар 5 як нул медиҳад.')
P('w3d4-27', 'Дараҷаи 2 дар n', 'Адади n (n ≥ 1). Калонтарин дараҷаи 2-ро, ки n-ро тақсим мекунад, чоп кунед (12 → 4).', 'Як адад n (1 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'long long p = 1;\nwhile (n % 2 == 0) {\n    n /= 2;\n    p *= 2;\n}\ncout << p << endl;', lambda s: str(n0(s) & -n0(s)), ['12', '7', '1024', '96'], lambda r: str(R(r, 1, 10**18)),
  why=lambda s: 'Ҳар тақсим ба 2 — p · 2.')
P('w3d4-28', 'Системаи k', 'Ду адад n ва k (2 ≤ k ≤ 9). n-ро дар системаи k чоп кунед.', 'Як сатр: n, k (0 ≤ n ≤ 10¹⁸).', 'Рақамҳо.',
  body(['n', 'k']) + 'string s = "";\ndo {\n    s = char(\'0\' + n % k) + s;\n    n /= k;\n} while (n > 0);\ncout << s << endl;', lambda s: _base(nums(s)[0], nums(s)[1]) or '0', ['10 2', '0 5', '100 9', '1000000000000000000 7'],
  lambda r: f'{R(r, 0, 10**18)} {R(r, 2, 9)}', why=lambda s: 'Бақияҳо аз охир ба аввал.', inc=STR)
P('w3d4-29', 'Рақамҳои 2ⁿ', 'Адади n. 2ⁿ чанд рақам дорад?', 'Як адад n (0 ≤ n ≤ 60).', 'Як адад.',
  body(['n']) + 'long long p = 1;\nwhile (n > 0) {\n    p *= 2;\n    n--;\n}\nint c = 0;\nwhile (p > 0) {\n    c++;\n    p /= 10;\n}\ncout << c << endl;', lambda s: str(len(str(2 ** n0(s)))),
  ['10', '0', '60', '3'] + [str(i) for i in (4, 9, 13, 30, 50, 59)], why=lambda s: f'2^{n0(s)} = {2 ** n0(s)}')
P('w3d4-30', 'Дараҷаи 2-и наздиктарин', 'Адади n (n ≥ 1). Дараҷаи 2-ро, ки ба n наздиктар аст, чоп кунед. Агар ду дараҷа баробар наздик бошанд — хурдтаринашро.', 'Як адад n (1 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'long long p = 1;\nwhile (p * 2 <= n) p *= 2;\nif (n - p <= 2 * p - n) cout << p << endl;\nelse cout << 2 * p << endl;',
  lambda s: (lambda n: (lambda p: str(p if n - p <= 2 * p - n else 2 * p))(1 << (n.bit_length() - 1)))(n0(s)), ['5', '6', '7', '1', '1000000000000000000'], lambda r: str(R(r, 1, 10**18)),
  why=lambda s: 'p ≤ n < 2p — кадомаш наздиктар?')

# ───────── Рӯзи 5: хондан то сифр ─────────
use(3, 5); lvl('Миёна')
P('w3d5-11', 'Хурдтарин то сифр', 'Ададҳо то 0 хонда мешаванд (0 ҳисоб нест, ақаллан як адад ҳаст). Хурдтаринро чоп кунед.', 'Ададҳо, охирин 0 (|x| ≤ 10⁹).', 'Як адад.',
  READ0 + 'cin >> x;\nlong long mn = x;\nwhile (cin >> x && x != 0) {\n    if (x < mn) mn = x;\n}\ncout << mn << endl;', lambda s: str(min(zseq(s))), ['5 3 8 0', '-1 0', '7 7 7 0'], lambda r: zs(r),
  why=lambda s: 'Хурдтаринро нигоҳ доред.')
P('w3d5-12', 'Ҳосили зарб то сифр', 'Ададҳо то 0. Ҳосили зарби онҳоро ёбед.', 'Ададҳо, охирин 0 (|x| ≤ 10, на зиёда аз 15 адад).', 'Як адад.',
  READ0 + 'long long p = 1;\nwhile (cin >> x && x != 0) {\n    p *= x;\n}\ncout << p << endl;', lambda s: str(math.prod(zseq(s))), ['2 3 4 0', '-2 5 0', '10 10 10 0'], lambda r: zs(r, -10, 10),
  why=lambda s: 'p = p · x.')
P('w3d5-13', 'Ҷуфтҳо то сифр', 'Ададҳо то 0. Чандтои онҳо ҷуфт аст?', 'Ададҳо, охирин 0 (|x| ≤ 10⁹).', 'Як адад.',
  READ0 + 'long long c = 0;\nwhile (cin >> x && x != 0) {\n    if (x % 2 == 0) c++;\n}\ncout << c << endl;', lambda s: str(sum(1 for x in zseq(s) if x % 2 == 0)), ['1 2 3 4 0', '7 0', '-2 -4 0'], lambda r: zs(r),
  why=lambda s: 'x % 2 == 0.')
P('w3d5-14', 'Ҷамъи мусбатҳо то сифр', 'Ададҳо то 0. Ҷамъи ададҳои мусбатро ёбед.', 'Ададҳо, охирин 0 (|x| ≤ 10⁹).', 'Як адад.',
  READ0 + 'long long s = 0;\nwhile (cin >> x && x != 0) {\n    if (x > 0) s += x;\n}\ncout << s << endl;', lambda s: str(sum(x for x in zseq(s) if x > 0)), ['1 -2 3 0', '-5 0', '10 20 0'], lambda r: zs(r),
  why=lambda s: 'Танҳо мусбатҳо.')
P('w3d5-15', 'Калонтарин ва хурдтарин', 'Ададҳо то 0 (ақаллан як адад). Калонтарин ва хурдтаринро бо фосила чоп кунед.', 'Ададҳо, охирин 0.', 'Ду адад.',
  READ0 + 'cin >> x;\nlong long mx = x, mn = x;\nwhile (cin >> x && x != 0) {\n    if (x > mx) mx = x;\n    if (x < mn) mn = x;\n}\ncout << mx << " " << mn << endl;', lambda s: f'{max(zseq(s))} {min(zseq(s))}',
  ['5 3 8 0', '-1 0', '4 -4 0'], lambda r: zs(r), why=lambda s: 'Ду тағйирёбанда.')
P('w3d5-16', 'Манфиҳо то сифр', 'Ададҳо то 0. Чандтои онҳо манфӣ аст?', 'Ададҳо, охирин 0.', 'Як адад.',
  READ0 + 'long long c = 0;\nwhile (cin >> x && x != 0) {\n    if (x < 0) c++;\n}\ncout << c << endl;', lambda s: str(sum(1 for x in zseq(s) if x < 0)), ['1 -2 -3 0', '5 0', '-1 -1 0'], lambda r: zs(r),
  why=lambda s: 'x < 0.')
P('w3d5-17', 'Адади охирин', 'Ададҳо то 0 (ақаллан як адад). Ададеро, ки пеш аз 0 омад, чоп кунед.', 'Ададҳо, охирин 0.', 'Як адад.',
  READ0 + 'long long last = 0;\nwhile (cin >> x && x != 0) {\n    last = x;\n}\ncout << last << endl;', lambda s: str(zseq(s)[-1]), ['5 3 8 0', '-1 0', '4 4 0'], lambda r: zs(r),
  why=lambda s: 'Ҳар дафъа охиринро нав мекунем.')
P('w3d5-18', 'Аввалин ва охирин', 'Ададҳо то 0 (ақаллан як адад). Аввалин ва охиринро бо фосила чоп кунед.', 'Ададҳо, охирин 0.', 'Ду адад.',
  READ0 + 'cin >> x;\nlong long first = x, last = x;\nwhile (cin >> x && x != 0) {\n    last = x;\n}\ncout << first << " " << last << endl;', lambda s: f'{zseq(s)[0]} {zseq(s)[-1]}',
  ['5 3 8 0', '-1 0', '1 2 3 4 0'], lambda r: zs(r), why=lambda s: 'Аввалинро пеш аз давр хонед.')
P('w3d5-19', 'Мисли аввалин', 'Ададҳо то 0 (ақаллан як адад). Чандтои онҳо ба адади аввал баробар аст (худи аввал ҳам ҳисоб)?', 'Ададҳо, охирин 0.', 'Як адад.',
  READ0 + 'cin >> x;\nlong long first = x, c = 1;\nwhile (cin >> x && x != 0) {\n    if (x == first) c++;\n}\ncout << c << endl;', lambda s: str(zseq(s).count(zseq(s)[0])), ['5 3 5 0', '-1 0', '2 2 2 0'],
  lambda r: zs(r, -3, 3), why=lambda s: 'Бо аввалин муқоиса кунед.')
P('w3d5-20', 'Ҷамъи дурақамаҳо', 'Ададҳо то 0. Ҷамъи ададҳои дурақамаро (10–99 ё −99…−10) ёбед.', 'Ададҳо, охирин 0 (|x| ≤ 1000).', 'Як адад.',
  READ0 + 'long long s = 0;\nwhile (cin >> x && x != 0) {\n    if ((x >= 10 && x <= 99) || (x >= -99 && x <= -10)) s += x;\n}\ncout << s << endl;', lambda s: str(sum(x for x in zseq(s) if 10 <= abs(x) <= 99)),
  ['5 12 100 -20 0', '7 0', '99 10 0'], lambda r: zs(r, -150, 150), why=lambda s: 'Модул аз 10 то 99.')

lvl('Душвор')
P('w3d5-21', 'Калонтарини дуюм', 'Ададҳо то 0 (ақаллан ду адад). Калонтарини дуюмро чоп кунед (бо такрор: 5 5 3 → 5).', 'Ададҳо, охирин 0.', 'Як адад.',
  READ0 + 'long long a, b;\ncin >> a >> b;\nlong long m1 = a > b ? a : b, m2 = a > b ? b : a;\nwhile (cin >> x && x != 0) {\n    if (x > m1) {\n        m2 = m1;\n        m1 = x;\n    } else if (x > m2) {\n        m2 = x;\n    }\n}\ncout << m2 << endl;',
  lambda s: str(sorted(zseq(s))[-2]), ['5 3 8 0', '5 5 3 0', '-1 -2 0'], lambda r: zs(r, k1=2), why=lambda s: 'Ду калонтаринро нигоҳ доред.')
P('w3d5-22', 'Калонтарин чанд бор', 'Ададҳо то 0 (ақаллан як адад). Калонтарин чанд бор омадааст?', 'Ададҳо, охирин 0.', 'Як адад.',
  READ0 + 'cin >> x;\nlong long mx = x, c = 1;\nwhile (cin >> x && x != 0) {\n    if (x > mx) {\n        mx = x;\n        c = 1;\n    } else if (x == mx) {\n        c++;\n    }\n}\ncout << c << endl;',
  lambda s: str(zseq(s).count(max(zseq(s)))), ['5 8 8 3 0', '1 0', '2 2 2 0'], lambda r: zs(r, -3, 3), why=lambda s: 'Калонтари нав — ҳисоб аз 1.')
P('w3d5-23', 'Қисмати афзояндаи дарозтарин', 'Ададҳо то 0 (ақаллан як адад). Дарозии қисмати пайвастаи қатъиян афзояндаи дарозтаринро ёбед.', 'Ададҳо, охирин 0.', 'Як адад.',
  READ0 + 'cin >> x;\nlong long prev = x, cur = 1, best = 1;\nwhile (cin >> x && x != 0) {\n    if (x > prev) cur++;\n    else cur = 1;\n    if (cur > best) best = cur;\n    prev = x;\n}\ncout << best << endl;',
  lambda s: str(_lis(zseq(s))), ['1 2 3 1 2 0', '5 4 3 0', '1 2 2 3 4 5 0'], lambda r: zs(r, -5, 5), why=lambda s: 'Агар калонтар бошад — давомаш, вагарна аз нав.')
P('w3d5-24', 'Тағйири аломат', 'Ададҳо то 0. Чанд бор ду адади ҳамсоя аломатҳои гуногун доранд?', 'Ададҳо, охирин 0.', 'Як адад.',
  READ0 + 'long long prev = 0, c = 0;\nwhile (cin >> x && x != 0) {\n    if (prev != 0 && ((prev > 0) != (x > 0))) c++;\n    prev = x;\n}\ncout << c << endl;',
  lambda s: (lambda v: str(sum(1 for a, b in zip(v, v[1:]) if (a > 0) != (b > 0))))(zseq(s)), ['1 -2 3 4 0', '5 0', '-1 -1 0'], lambda r: zs(r, -5, 5), why=lambda s: 'Ҷуфтҳои ҳамсояро санҷед.')
P('w3d5-25', 'Бо тартиб?', 'Ададҳо то 0. Агар ҳар адад аз пешинааш хурд набошад (камнашаванда) YES, вагарна NO.', 'Ададҳо, охирин 0 (ақаллан як адад).', 'YES ё NO.',
  READ0 + 'cin >> x;\nlong long prev = x;\nbool ok = true;\nwhile (cin >> x && x != 0) {\n    if (x < prev) ok = false;\n    prev = x;\n}\nif (ok) cout << "YES";\nelse cout << "NO";\ncout << endl;',
  lambda s: yn(all(a <= b for a, b in zip(zseq(s), zseq(s)[1:]))), ['1 2 2 5 0', '3 1 0', '7 0'], lambda r: r.choice([zs(r, -5, 5), ' '.join(map(str, sorted(nums(zs(r, 1, 50))[:-1]))) + ' 0']),
  why=lambda s: 'Агар яке хурд бошад — NO.')
P('w3d5-26', 'Ҷамъи калонтарин ва хурдтарин', 'Ададҳо то 0 (ақаллан як адад). Ҷамъи калонтарин ва хурдтаринро ёбед.', 'Ададҳо, охирин 0.', 'Як адад.',
  READ0 + 'cin >> x;\nlong long mx = x, mn = x;\nwhile (cin >> x && x != 0) {\n    if (x > mx) mx = x;\n    if (x < mn) mn = x;\n}\ncout << mx + mn << endl;', lambda s: str(max(zseq(s)) + min(zseq(s))),
  ['5 3 8 0', '-1 0', '4 -4 0'], lambda r: zs(r), why=lambda s: 'Калонтарин + хурдтарин.')
P('w3d5-27', 'Миёнаи мусбатҳо', 'Ададҳо то 0. Қисми бутуни миёнаи ададҳои мусбатро ёбед. Агар мусбат набошад, NONE.', 'Ададҳо, охирин 0.', 'Адад ё NONE.',
  READ0 + 'long long s = 0, c = 0;\nwhile (cin >> x && x != 0) {\n    if (x > 0) {\n        s += x;\n        c++;\n    }\n}\nif (c == 0) cout << "NONE";\nelse cout << s / c;\ncout << endl;',
  lambda s: (lambda v: str(sum(v) // len(v)) if v else 'NONE')([x for x in zseq(s) if x > 0]), ['1 -2 4 0', '-5 0', '10 20 25 0'], lambda r: zs(r), why=lambda s: 'Ҷамъ ва шумораи мусбатҳо.')
P('w3d5-28', 'Ҳамсояҳо бо ҷамъи k', 'Аввал адади k, баъд ададҳо то 0. Чанд ҷуфти ҳамсоя ҷамъи ба k баробар доранд?', 'k, баъд ададҳо, охирин 0.', 'Як адад.',
  'long long k, x, prev;\ncin >> k;\nlong long c = 0;\nbool has = false;\nwhile (cin >> x && x != 0) {\n    if (has && prev + x == k) c++;\n    prev = x;\n    has = true;\n}\ncout << c << endl;',
  lambda s: (lambda v: (lambda k, w: str(sum(1 for a, b in zip(w, w[1:]) if a + b == k)))(v[0], v[1:][:v[1:].index(0)]))(nums(s)), ['5\n2 3 2 3 0', '0\n1 -1 1 0', '10\n5 0'],
  lambda r: f'{R(r, -5, 5)}\n' + zs(r, -5, 5), why=lambda s: 'Ҳар ҷуфти ҳамсояро санҷед.')
P('w3d5-29', 'Ҷойи калонтарин', 'Ададҳо то 0 (ақаллан як адад). Ҷойи калонтаринро (1, 2, …; агар чанд бошад — аввалинашро) чоп кунед.', 'Ададҳо, охирин 0.', 'Як адад.',
  READ0 + 'long long mx = 0, pos = 0, i = 0;\nwhile (cin >> x && x != 0) {\n    i++;\n    if (i == 1 || x > mx) {\n        mx = x;\n        pos = i;\n    }\n}\ncout << pos << endl;',
  lambda s: str(zseq(s).index(max(zseq(s))) + 1), ['5 8 8 3 0', '1 0', '-1 -1 0'], lambda r: zs(r, -5, 5), why=lambda s: 'Танҳо калонтари қатъӣ ҷойро иваз мекунад.')
P('w3d5-30', 'Фарқи калон ва хурд', 'Ададҳо то 0 (ақаллан як адад). Фарқи калонтарин ва хурдтаринро ёбед.', 'Ададҳо, охирин 0.', 'Як адад.',
  READ0 + 'cin >> x;\nlong long mx = x, mn = x;\nwhile (cin >> x && x != 0) {\n    if (x > mx) mx = x;\n    if (x < mn) mn = x;\n}\ncout << mx - mn << endl;', lambda s: str(max(zseq(s)) - min(zseq(s))),
  ['5 3 8 0', '-1 0', '4 -4 0'], lambda r: zs(r), why=lambda s: 'Калонтарин − хурдтарин.')

# ───────── Имтиҳони ҳафтаи 3 ─────────
use(3, 6); lvl('Осон')
P('w3eA-3', 'Рақами охир ва аввал', 'Адади n. Рақами охирин ва рақами аввалро бо фосила чоп кунед.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Ду рақам.',
  body(['n']) + 'long long last = n % 10;\nwhile (n >= 10) n /= 10;\ncout << last << " " << n << endl;', lambda s: f'{s.strip()[-1]} {s.strip()[0]}', ['2025', '7', '0', '120'], big, why=lambda s: 'Охирин: n % 10.')
P('w3eA-4', 'Шумораи рақамҳои 9', 'Адади n. Чанд рақами 9 дорад?', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'int c = 0;\nwhile (n > 0) {\n    if (n % 10 == 9) c++;\n    n /= 10;\n}\ncout << c << endl;', lambda s: str(s.strip().count('9')), ['1999', '123', '0', '9'], big, why=lambda s: 'Ҳар рақамро бо 9 муқоиса кунед.')
P('w3eA-5', 'Ҷамъ ва шумораи рақамҳо', 'Адади n. Ҷамъи рақамҳо ва шумораи рақамҳоро бо фосила чоп кунед.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Ду адад.',
  body(['n']) + 'long long s = 0, c = 0;\ndo {\n    s += n % 10;\n    c++;\n    n /= 10;\n} while (n > 0);\ncout << s << " " << c << endl;', lambda s: f'{sum(digits(n0(s)))} {len(s.strip())}',
  ['2025', '7', '0'], big, why=lambda s: 'Ду ҳисобкунак дар як давр.')
P('w3eA-6', 'Каратиҳо дар фосила', 'Ададҳои a, b ва k. Дар фосилаи [a; b] чанд адад ба k тақсим мешавад? Бо давр ҳисоб кунед.', 'Як сатр: a, b, k (0 ≤ a ≤ b ≤ 10⁶, 1 ≤ k ≤ 10⁶).', 'Як адад.',
  body(['a', 'b', 'k']) + 'long long c = 0;\nwhile (a <= b) {\n    if (a % k == 0) c++;\n    a++;\n}\ncout << c << endl;', lambda s: (lambda a, b, k: str(b // k - (a - 1) // k if a > 0 else b // k + 1))(*nums(s)),
  ['1 10 3', '0 10 5', '7 7 2'], lambda r: (lambda a: f'{a} {R(r, a, 10**6)} {R(r, 1, 1000)}')(R(r, 0, 10**6)), why=lambda s: 'Ҳар ададро санҷед.')
P('w3eA-7', 'Нимкунӣ то тоқ', 'Адади n (n ≥ 1). То он даме ки ҷуфт аст, онро ба 2 тақсим кунед. Адади тоқи ҳосилшударо чоп кунед.', 'Як адад n (1 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'while (n % 2 == 0) {\n    n /= 2;\n}\ncout << n << endl;', lambda s: str(n0(s) // (n0(s) & -n0(s))), ['48', '7', '1024', '96'], lambda r: str(R(r, 1, 10**18)), why=lambda s: 'То тоқ шудан.')
P('w3eA-8', 'Ҷамъи тоқҳо то сифр', 'Ададҳо то 0. Ҷамъи ададҳои тоқро ёбед.', 'Ададҳо, охирин 0.', 'Як адад.',
  READ0 + 'long long s = 0;\nwhile (cin >> x && x != 0) {\n    if (x % 2 != 0) s += x;\n}\ncout << s << endl;', lambda s: str(sum(x for x in zseq(s) if x % 2)), ['1 2 3 0', '2 4 0', '-3 5 0'], lambda r: zs(r),
  why=lambda s: 'Танҳо тоқҳо.')
P('w3eA-9', 'Шумораи дараҷаҳои 2', 'Адади n. Чанд дараҷаи 2 (1, 2, 4, 8, …) аз n калон нест?', 'Як адад n (1 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'long long p = 1, c = 0;\nwhile (p <= n) {\n    c++;\n    p *= 2;\n}\ncout << c << endl;', lambda s: str(n0(s).bit_length()), ['10', '1', '16', '1000000000000000000'], lambda r: str(R(r, 1, 10**18)),
  why=lambda s: '1, 2, 4, …')
P('w3eA-10', 'Рақами калон ва такрораш', 'Адади n. Рақами калонтарин ва шумораи такрори онро бо фосила чоп кунед.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Ду адад.',
  body(['n']) + 'long long mx = -1, c = 0;\ndo {\n    long long d = n % 10;\n    if (d > mx) {\n        mx = d;\n        c = 1;\n    } else if (d == mx) {\n        c++;\n    }\n    n /= 10;\n} while (n > 0);\ncout << mx << " " << c << endl;',
  lambda s: f'{max(s.strip())} {s.strip().count(max(s.strip()))}', ['2925', '7', '0', '999'], big, why=lambda s: 'Калонтари нав — ҳисоб аз 1.')

lvl('Миёна')
P('w3eB-3', 'Содаи пешина', 'Адади n (n ≥ 3). Калонтарин адади содаеро, ки аз n хурд аст, ёбед.', 'Як адад n (3 ≤ n ≤ 10⁶).', 'Як адад.',
  body(['n']) + 'long long x = n - 1;\nwhile (true) {\n    bool p = true;\n    long long d = 2;\n    while (d * d <= x) {\n        if (x % d == 0) p = false;\n        d++;\n    }\n    if (p) break;\n    x--;\n}\ncout << x << endl;',
  lambda s: str(next(x for x in range(n0(s) - 1, 1, -1) if isprime(x))), ['10', '3', '14', '1000000'], lambda r: str(R(r, 3, 10**6)), why=lambda s: 'Аз n − 1 ба поён.')
P('w3eB-4', 'ТУК-и чор адад', 'Чор адади мусбат. ТУК-и онҳоро ёбед.', 'Як сатр: чор адад (1 ≤ x ≤ 10¹⁸).', 'Як адад.',
  body(['a', 'b', 'c', 'd']) + 'long long v[3] = {b, c, d};\nint i = 0;\nwhile (i < 3) {\n    long long y = v[i];\n    while (y != 0) {\n        long long t = a % y;\n        a = y;\n        y = t;\n    }\n    i++;\n}\ncout << a << endl;',
  lambda s: str(math.gcd(*nums(s))), ['12 18 24 30', '7 13 5 2', '8 8 8 8'], lambda r: (lambda g: ' '.join(str(g * R(r, 1, 10**6)) for _ in range(4)))(R(r, 1, 10**6)), why=lambda s: 'ТУК паи ҳам.')
P('w3eB-5', 'Зарби рақамҳо то як рақам', 'Адади n. То он даме ки n аз 9 калон аст, n-ро бо ҳосили зарби рақамҳояш иваз кунед. Рақами охиринро чоп кунед.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Як рақам.',
  body(['n']) + 'while (n > 9) {\n    long long p = 1;\n    while (n > 0) {\n        p *= n % 10;\n        n /= 10;\n    }\n    n = p;\n}\ncout << n << endl;', lambda s: str(_mp(n0(s))), ['39', '999', '7', '277777788888899'],
  big, why=lambda s: 'Масалан: 39 → 27 → 14 → 4.')
P('w3eB-6', 'Рақамҳои аз миёна калон', 'Адади n. Чанд рақами он аз миёнаи арифметикии рақамҳо калон аст? (Маслиҳат: d · шумора > ҷамъ.)', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'long long s = 0, c = 0, m = n;\ndo {\n    s += m % 10;\n    c++;\n    m /= 10;\n} while (m > 0);\nlong long k = 0;\ndo {\n    if (n % 10 * c > s) k++;\n    n /= 10;\n} while (n > 0);\ncout << k << endl;',
  lambda s: (lambda d: str(sum(1 for x in d if x * len(d) > sum(d))))(digits(n0(s))), ['1234', '555', '0', '19'], big, why=lambda s: 'Аввал ҷамъ ва шумора, баъд муқоиса.')
P('w3eB-7', 'Нулҳо дар системаи дуӣ', 'Адади n (n ≥ 1). Дар навишти дуии он чанд 0 ҳаст?', 'Як адад n (1 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'long long c = 0;\nwhile (n > 0) {\n    if (n % 2 == 0) c++;\n    n /= 2;\n}\ncout << c << endl;', lambda s: str(bin(n0(s))[2:].count('0')), ['8', '7', '1', '10'], lambda r: str(R(r, 1, 10**18)),
  why=lambda s: f'{n0(s)} = {bin(n0(s))[2:]}')
P('w3eB-8', 'Ҷамъи ду калонтарин то сифр', 'Ададҳо то 0 (ақаллан ду адад). Ҷамъи ду адади калонтаринро ёбед.', 'Ададҳо, охирин 0.', 'Як адад.',
  READ0 + 'long long a, b;\ncin >> a >> b;\nlong long m1 = a > b ? a : b, m2 = a > b ? b : a;\nwhile (cin >> x && x != 0) {\n    if (x > m1) {\n        m2 = m1;\n        m1 = x;\n    } else if (x > m2) {\n        m2 = x;\n    }\n}\ncout << m1 + m2 << endl;',
  lambda s: str(sum(sorted(zseq(s))[-2:])), ['5 3 8 0', '5 5 3 0', '-1 -2 0'], lambda r: zs(r, k1=2), why=lambda s: 'Ду калонтарин.')
P('w3eB-9', 'Ададҳои мукаммал то n', 'Адади n. Аз 1 то n чанд адади мукаммал ҳаст? (Мукаммал — ба ҷамъи тақсимкунандаҳои хурди худ баробар, масалан 6 = 1 + 2 + 3.)', 'Як адад n (1 ≤ n ≤ 10⁴).', 'Як адад.',
  body(['n']) + 'long long c = 0, k = 2;\nwhile (k <= n) {\n    long long s = 1, d = 2;\n    while (d * d <= k) {\n        if (k % d == 0) {\n            s += d;\n            if (d != k / d) s += k / d;\n        }\n        d++;\n    }\n    if (s == k) c++;\n    k++;\n}\ncout << c << endl;',
  lambda s: str(sum(1 for k in (6, 28, 496, 8128) if k <= n0(s))), ['10', '5', '500', '10000'], lambda r: str(R(r, 1, 10**4)), why=lambda s: 'Барои ҳар k ҷамъи тақсимкунандаҳоро ҳисоб кунед.')
P('w3eB-10', 'Ҷамъи навбатӣ', 'Адади n. Аз рақами охирин сар карда, рақамҳоро бо аломатҳои навбатӣ ҷамъ кунед: d₁ − d₂ + d₃ − … (d₁ — рақами охирин).', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'long long s = 0, sg = 1;\nwhile (n > 0) {\n    s += sg * (n % 10);\n    sg = -sg;\n    n /= 10;\n}\ncout << s << endl;', lambda s: str(sum(int(c) * (1 if i % 2 == 0 else -1) for i, c in enumerate(s.strip()[::-1]))),
  ['1234', '7', '0', '1001'], big, why=lambda s: 'Аломат ҳар дафъа иваз мешавад.')

lvl('Душвор')
P('w3eX-2', 'Адади Армстронг', 'Адади n. Агар n ба ҷамъи рақамҳояш, ки ҳар кадом ба дараҷаи шумораи рақамҳо бардошта шудааст, баробар бошад YES, вагарна NO (153 = 1³ + 5³ + 3³).', 'Як адад n (0 ≤ n ≤ 10⁹).', 'YES ё NO.',
  body(['n']) + 'long long k = 0, m = n;\ndo {\n    k++;\n    m /= 10;\n} while (m > 0);\nlong long s = 0;\nm = n;\ndo {\n    long long d = m % 10, p = 1, i = 0;\n    while (i < k) {\n        p *= d;\n        i++;\n    }\n    s += p;\n    m /= 10;\n} while (m > 0);\nif (s == n) cout << "YES";\nelse cout << "NO";\ncout << endl;',
  lambda s: yn(sum(int(c) ** len(s.strip()) for c in s.strip()) == n0(s)), ['153', '154', '0', '9474', '370', '10'], lambda r: r.choice([str(R(r, 0, 10**9)), '407', '1634', '8208']), why=lambda s: 'Шумораи рақамҳо = дараҷа.')
P('w3eX-3', 'Ҷамъи содаҳо', 'Адади n. Ҷамъи ҳамаи ададҳои содаи аз n калон набударо ёбед.', 'Як адад n (1 ≤ n ≤ 10⁵).', 'Як адад.',
  body(['n']) + 'long long s = 0, x = 2;\nwhile (x <= n) {\n    bool p = true;\n    long long d = 2;\n    while (d * d <= x && p) {\n        if (x % d == 0) p = false;\n        d++;\n    }\n    if (p) s += x;\n    x++;\n}\ncout << s << endl;',
  lambda s: str(sum(x for x in range(2, n0(s) + 1) if isprime(x))), ['10', '1', '2', '100000'], lambda r: str(R(r, 1, 10**5)), why=lambda s: 'Ҳар ададро санҷед ва ҷамъ кунед.')
P('w3eX-4', 'ХУК-и 1 то n', 'Адади n. Хурдтарин ададеро, ки ба ҳамаи 1, 2, …, n тақсим мешавад, ёбед.', 'Як адад n (1 ≤ n ≤ 40).', 'Як адад.',
  body(['n']) + 'long long l = 1, k = 2;\nwhile (k <= n) {\n    long long x = l, y = k;\n    while (y != 0) {\n        long long t = x % y;\n        x = y;\n        y = t;\n    }\n    l = l / x * k;\n    k++;\n}\ncout << l << endl;',
  lambda s: str(math.lcm(*range(1, n0(s) + 1))), ['10', '1', '40', '20'] + [str(i) for i in (2, 5, 13, 30, 37, 39)], why=lambda s: 'ХУК паи ҳам.')
P('w3eX-5', 'Рақами охирини aᵇ', 'Ду адад a ва b. Рақами охирини aᵇ-ро ёбед (0⁰ = 1).', 'Як сатр: a, b (0 ≤ a ≤ 10⁹, 0 ≤ b ≤ 10¹⁸).', 'Як рақам.',
  body(['a', 'b']) + 'long long res = 1;\na %= 10;\nwhile (b > 0) {\n    if (b % 2 == 1) res = res * a % 10;\n    a = a * a % 10;\n    b /= 2;\n}\ncout << res << endl;', lambda s: str(pow(nums(s)[0], nums(s)[1], 10)),
  ['2 10', '7 0', '0 5', '123456789 1000000000000000000'], lambda r: f'{R(r, 0, 10**9)} {R(r, 0, 10**18)}', why=lambda s: 'Танҳо рақами охирро нигоҳ доред.')
P('w3eX-6', 'Адади хушҳол', 'Адади n. n-ро бо ҷамъи квадратҳои рақамҳояш иваз мекунем. Агар ба 1 расад YES, агар ба 4 расад (давра) NO.', 'Як адад n (1 ≤ n ≤ 10⁹).', 'YES ё NO.',
  body(['n']) + 'while (n != 1 && n != 4) {\n    long long s = 0;\n    while (n > 0) {\n        s += (n % 10) * (n % 10);\n        n /= 10;\n    }\n    n = s;\n}\nif (n == 1) cout << "YES";\nelse cout << "NO";\ncout << endl;',
  lambda s: yn(_happy(n0(s))), ['19', '4', '1', '7', '2'], lambda r: str(R(r, 1, 10**9)), why=lambda s: 'Масалан: 19 → 82 → 68 → 100 → 1.')
P('w3eX-7', 'Ҷамъи касрҳо', 'Адади n. 1/1 + 1/2 + … + 1/n-ро ҳамчун касри ихтисоршуда «p q» чоп кунед.', 'Як адад n (1 ≤ n ≤ 20).', 'Ду адад.',
  body(['n']) + 'long long p = 0, q = 1, k = 1;\nwhile (k <= n) {\n    p = p * k + q;\n    q = q * k;\n    long long x = p, y = q;\n    while (y != 0) {\n        long long t = x % y;\n        x = y;\n        y = t;\n    }\n    p /= x;\n    q /= x;\n    k++;\n}\ncout << p << " " << q << endl;',
  lambda s: (lambda f: f'{f.numerator} {f.denominator}')(sum(__import__('fractions').Fraction(1, k) for k in range(1, n0(s) + 1))), ['3', '1', '20', '6'] + [str(i) for i in (2, 4, 9, 12, 17, 19)],
  why=lambda s: 'Ҳар қадам: p/q + 1/k ва ихтисор.')
P('w3eX-8', 'Рақамҳои n!', 'Адади n. n! = 1·2·…·n чанд рақам дорад?', 'Як адад n (0 ≤ n ≤ 20).', 'Як адад.',
  body(['n']) + 'long long f = 1, k = 2;\nwhile (k <= n) {\n    f *= k;\n    k++;\n}\nint c = 0;\nwhile (f > 0) {\n    c++;\n    f /= 10;\n}\ncout << c << endl;', lambda s: str(len(str(math.factorial(n0(s))))),
  ['5', '0', '20', '10'] + [str(i) for i in (1, 3, 7, 13, 16, 19)], why=lambda s: f'{n0(s)}! = {math.factorial(n0(s))}')
P('w3eX-9', 'Силсилаи баробарҳо', 'Ададҳо то 0 (ақаллан як адад). Дарозии дарозтарин қисмати пайвастаи ададҳои баробарро ёбед.', 'Ададҳо, охирин 0.', 'Як адад.',
  READ0 + 'cin >> x;\nlong long prev = x, cur = 1, best = 1;\nwhile (cin >> x && x != 0) {\n    if (x == prev) cur++;\n    else cur = 1;\n    if (cur > best) best = cur;\n    prev = x;\n}\ncout << best << endl;',
  lambda s: str(_run(zseq(s))), ['1 1 2 2 2 3 0', '5 0', '4 5 6 0'], lambda r: zs(r, -2, 2), why=lambda s: 'Баробар — давомаш, вагарна аз нав.')
P('w3eX-10', 'Системаи шонздаҳӣ', 'Адади n. Онро дар системаи шонздаҳӣ чоп кунед (рақамҳо 0–9 ва A–F; 255 → FF).', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Сатр.',
  body(['n']) + 'string h = "0123456789ABCDEF", s = "";\ndo {\n    s = h[n % 16] + s;\n    n /= 16;\n} while (n > 0);\ncout << s << endl;', lambda s: format(n0(s), 'X'), ['255', '0', '16', '1000000000000000000'],
  lambda r: str(R(r, 0, 10**18)), why=lambda s: 'Бақияҳои тақсим ба 16.', inc=STR)
exam_order(3)
lvl(None)
