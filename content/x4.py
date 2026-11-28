# Ҳафтаи 4 — масъалаҳои иловагӣ (даври for): ҳисоб, ҷадвалҳо, формулаҳо, пайдарпаӣ, давр дар давр.
import math
from lib import *
from w4 import body, seq, arr
R = lambda r, a, b: r.randint(a, b)
def rn(r, k, lo, hi): return ' '.join(str(R(r, lo, hi)) for _ in range(k))
def yn(b): return 'YES' if b else 'NO'
def n0(s): return nums(s)[0]
def isprime(n):
    if n < 2: return False
    i = 2
    while i * i <= n:
        if n % i == 0: return False
        i += 1
    return True
def fib(n):
    a, b = 0, 1
    for _ in range(n): a, b = b, a + b
    return a
STR = '#include <iostream>\n#include <string>'
READN = 'long long n;\ncin >> n;\n'

# ───────── Рӯзи 1: ҳисоб бо for ─────────
use(4, 1); lvl('Миёна')
P('w4d1-11', 'Ҷамъи тоқҳо то n', 'Адади n. Ҷамъи ададҳои тоқи аз 1 то n-ро ёбед.', 'Як адад n (1 ≤ n ≤ 10⁶).', 'Як адад.',
  READN + 'long long s = 0;\nfor (long long i = 1; i <= n; i += 2) s += i;\ncout << s << endl;', lambda s: str(sum(range(1, n0(s) + 1, 2))), ['10', '1', '7', '1000000'], lambda r: str(R(r, 1, 10**6)),
  why=lambda s: '1 + 3 + 5 + …')
P('w4d1-12', 'Ҳосили зарби a то b', 'Ададҳои a ва b (1 ≤ a ≤ b). Ҳосили зарби ҳамаи ададҳо аз a то b-ро ёбед.', 'Як сатр: a, b (1 ≤ a ≤ b ≤ 20).', 'Як адад.',
  body(['a', 'b']) + 'long long p = 1;\nfor (long long i = a; i <= b; i++) p *= i;\ncout << p << endl;', lambda s: str(math.prod(range(nums(s)[0], nums(s)[1] + 1))), ['3 5', '7 7', '1 20'],
  lambda r: (lambda a: f'{a} {R(r, a, 20)}')(R(r, 1, 20)), why=lambda s: 'p = p · i.')
P('w4d1-13', 'Ҷамъи кубҳо', 'Адади n. 1³ + 2³ + … + n³-ро бо давр ёбед.', 'Як адад n (1 ≤ n ≤ 10⁴).', 'Як адад.',
  READN + 'long long s = 0;\nfor (long long i = 1; i <= n; i++) s += i * i * i;\ncout << s << endl;', lambda s: str(sum(i ** 3 for i in range(1, n0(s) + 1))), ['3', '1', '10000'], lambda r: str(R(r, 1, 10**4)),
  why=lambda s: '1 + 8 + 27 + …')
P('w4d1-14', 'Ҷуфтҳо аз a то b', 'Ададҳои a ва b (a ≤ b). Ҳамаи ададҳои ҷуфти аз a то b-ро бо фосила чоп кунед. Агар набошад, NONE.', 'Як сатр: a, b (|x| ≤ 10⁶, b − a ≤ 2000).', 'Ададҳо ё NONE.',
  body(['a', 'b']) + 'bool first = true;\nfor (long long i = a; i <= b; i++) {\n    if (i % 2 == 0) {\n        if (!first) cout << " ";\n        cout << i;\n        first = false;\n    }\n}\nif (first) cout << "NONE";\ncout << endl;',
  lambda s: ' '.join(str(i) for i in range(nums(s)[0], nums(s)[1] + 1) if i % 2 == 0) or 'NONE', ['3 9', '5 5', '-4 2'], lambda r: (lambda a: f'{a} {R(r, a, a + 2000)}')(R(r, -10**6, 10**6 - 2000)),
  why=lambda s: 'i % 2 == 0.')
P('w4d1-15', 'Аз b то a бо қадами 2', 'Ададҳои a ва b (a ≤ b). Ададҳои b, b − 2, b − 4, …, ки аз a хурд нестанд, бо фосила чоп кунед.', 'Як сатр: a, b (|x| ≤ 10⁶, b − a ≤ 2000).', 'Ададҳо.',
  body(['a', 'b']) + 'for (long long i = b; i >= a; i -= 2) {\n    cout << i;\n    if (i - 2 >= a) cout << " ";\n}\ncout << endl;', lambda s: ' '.join(str(i) for i in range(nums(s)[1], nums(s)[0] - 1, -2)),
  ['1 9', '5 5', '-3 2'], lambda r: (lambda a: f'{a} {R(r, a, a + 2000)}')(R(r, -10**6, 10**6 - 2000)), why=lambda s: 'i -= 2.')
P('w4d1-16', 'Ҷамъи навбатӣ', 'Адади n. 1 − 2 + 3 − 4 + … ± n-ро бо давр ёбед.', 'Як адад n (1 ≤ n ≤ 10⁶).', 'Як адад.',
  READN + 'long long s = 0;\nfor (long long i = 1; i <= n; i++) {\n    if (i % 2 == 1) s += i;\n    else s -= i;\n}\ncout << s << endl;', lambda s: str(sum(i if i % 2 else -i for i in range(1, n0(s) + 1))),
  ['4', '5', '1', '1000000'], lambda r: str(R(r, 1, 10**6)), why=lambda s: 'Тоқ — ҷамъ, ҷуфт — тарҳ.')
P('w4d1-17', 'Ҳосили зарби ҷуфтҳо', 'Адади n. Ҳосили зарби ҳамаи ададҳои ҷуфти аз 2 то n-ро ёбед (агар набошад — 1).', 'Як адад n (1 ≤ n ≤ 30).', 'Як адад.',
  READN + 'long long p = 1;\nfor (long long i = 2; i <= n; i += 2) p *= i;\ncout << p << endl;', lambda s: str(math.prod(range(2, n0(s) + 1, 2))), ['6', '1', '30', '9'] + [str(i) for i in (2, 3, 11, 20, 25, 29)],
  why=lambda s: '2 · 4 · 6 · …')
P('w4d1-18', 'Тоқҳо дар фосила', 'Ададҳои a ва b (a ≤ b). Дар [a; b] чанд адади тоқ ҳаст? Бо давр ҳисоб кунед.', 'Як сатр: a, b (|x| ≤ 10⁶).', 'Як адад.',
  body(['a', 'b']) + 'long long c = 0;\nfor (long long i = a; i <= b; i++) {\n    if (i % 2 != 0) c++;\n}\ncout << c << endl;', lambda s: str(sum(1 for i in range(nums(s)[0], nums(s)[1] + 1) if i % 2)),
  ['1 10', '2 2', '-5 5'], lambda r: (lambda a: f'{a} {R(r, a, 10**6)}')(R(r, -10**6, 10**6)), why=lambda s: 'i % 2 != 0.')
P('w4d1-19', 'Дараҷаҳои n', 'Ададҳои n ва k. n¹, n², …, nᵏ-ро бо фосила чоп кунед.', 'Як сатр: n, k (|n| ≤ 50, 1 ≤ k ≤ 10).', 'k адад.',
  body(['n', 'k']) + 'long long p = 1;\nfor (long long i = 1; i <= k; i++) {\n    p *= n;\n    cout << p;\n    if (i < k) cout << " ";\n}\ncout << endl;', lambda s: ' '.join(str(nums(s)[0] ** i) for i in range(1, nums(s)[1] + 1)),
  ['2 5', '-3 4', '50 10'], lambda r: f'{R(r, -50, 50)} {R(r, 1, 10)}', why=lambda s: 'Ҳар дафъа ба n зарб.')
P('w4d1-20', 'Ададҳо бо вергул', 'Адади n. Ададҳои 1, 2, …, n-ро бо ", " ҷудо карда чоп кунед.', 'Як адад n (1 ≤ n ≤ 1000).', 'Масалан: 1, 2, 3',
  READN + 'for (long long i = 1; i <= n; i++) {\n    cout << i;\n    if (i < n) cout << ", ";\n}\ncout << endl;', lambda s: ', '.join(str(i) for i in range(1, n0(s) + 1)), ['3', '1', '1000'], lambda r: str(R(r, 1, 1000)),
  why=lambda s: 'Пас аз охирин вергул нест.')

lvl('Душвор')
P('w4d1-21', 'Ҷамъи факториалҳо', 'Адади n. 1! + 2! + … + n!-ро ёбед.', 'Як адад n (1 ≤ n ≤ 20).', 'Як адад.',
  READN + 'long long f = 1, s = 0;\nfor (long long i = 1; i <= n; i++) {\n    f *= i;\n    s += f;\n}\ncout << s << endl;', lambda s: str(sum(math.factorial(i) for i in range(1, n0(s) + 1))),
  ['4', '1', '20'] + [str(i) for i in (2, 3, 7, 10, 13, 17, 19)], why=lambda s: 'Факториалро дар давр нав кунед.')
P('w4d1-22', 'Квадратҳо то n', 'Адади n. Ҳамаи квадратҳои пурраро (1, 4, 9, …), ки аз n калон нестанд, бо фосила чоп кунед.', 'Як адад n (1 ≤ n ≤ 10⁶).', 'Ададҳо.',
  READN + 'for (long long i = 1; i * i <= n; i++) {\n    if (i > 1) cout << " ";\n    cout << i * i;\n}\ncout << endl;', lambda s: ' '.join(str(i * i) for i in range(1, math.isqrt(n0(s)) + 1)),
  ['20', '1', '100', '1000000'], lambda r: str(R(r, 1, 10**6)), why=lambda s: 'Шарти давр: i · i ≤ n.')
P('w4d1-23', 'Ҷамъи i·(i+1)', 'Адади n. 1·2 + 2·3 + … + n·(n+1)-ро ёбед.', 'Як адад n (1 ≤ n ≤ 10⁵).', 'Як адад.',
  READN + 'long long s = 0;\nfor (long long i = 1; i <= n; i++) s += i * (i + 1);\ncout << s << endl;', lambda s: str(sum(i * (i + 1) for i in range(1, n0(s) + 1))), ['3', '1', '100000'],
  lambda r: str(R(r, 1, 10**5)), why=lambda s: '2 + 6 + 12 + …')
P('w4d1-24', 'Ҷамъи тақсимнашавандаҳо', 'Ададҳои n ва k. Ҷамъи ададҳои аз 1 то n-ро, ки ба k тақсим намешаванд, ёбед.', 'Як сатр: n, k (1 ≤ n ≤ 10⁶, 1 ≤ k ≤ 10⁶).', 'Як адад.',
  body(['n', 'k']) + 'long long s = 0;\nfor (long long i = 1; i <= n; i++) {\n    if (i % k != 0) s += i;\n}\ncout << s << endl;', lambda s: (lambda n, k: str(sum(i for i in range(1, n + 1) if i % k)))(*nums(s)),
  ['10 3', '5 1', '7 10'], lambda r: f'{R(r, 1, 10**6)} {R(r, 1, 100)}', why=lambda s: 'i % k != 0.')
P('w4d1-25', 'Дони гандум', 'Дар хонаи 1-уми тахта 1 дона, дар хонаи 2-юм 2, дар 3-юм 4 ва ҳар дафъа ду баробар. Дар n хонаи аввал ҳамагӣ чанд дона ҳаст?', 'Як адад n (1 ≤ n ≤ 62).', 'Як адад.',
  READN + 'long long p = 1, s = 0;\nfor (long long i = 1; i <= n; i++) {\n    s += p;\n    p *= 2;\n}\ncout << s << endl;', lambda s: str(2 ** n0(s) - 1), ['3', '1', '62', '10'] + [str(i) for i in (2, 5, 20, 33, 50, 61)],
  why=lambda s: '1 + 2 + 4 + …')
P('w4d1-26', 'Фибоначчи то n', 'Адади n. Ҳамаи ададҳои Фибоначчиро (1, 1, 2, 3, 5, …), ки аз n калон нестанд, бо фосила чоп кунед.', 'Як адад n (1 ≤ n ≤ 10¹⁸).', 'Ададҳо.',
  READN + 'long long a = 1, b = 1;\ncout << a;\nfor (; b <= n; ) {\n    cout << " " << b;\n    long long c = a + b;\n    a = b;\n    b = c;\n}\ncout << endl;',
  lambda s: ' '.join(str(fib(i)) for i in range(1, 100) if fib(i) <= n0(s)), ['10', '1', '2', '1000000000000000000'], lambda r: str(R(r, 1, 10**18)), why=lambda s: 'Ҳар адад — ҷамъи ду пешина.')
P('w4d1-27', 'Адад ва квадрат', 'Адади n. Барои i = 1…n ҷуфтҳои «i:i²»-ро бо фосила чоп кунед.', 'Як адад n (1 ≤ n ≤ 100).', 'Масалан: 1:1 2:4 3:9',
  READN + 'for (long long i = 1; i <= n; i++) {\n    if (i > 1) cout << " ";\n    cout << i << ":" << i * i;\n}\ncout << endl;', lambda s: ' '.join(f'{i}:{i * i}' for i in range(1, n0(s) + 1)), ['3', '1', '100'],
  lambda r: str(R(r, 1, 100)), why=lambda s: 'Байни i ва i² — аломати «:».')
P('w4d1-28', 'Фоизи солона', 'Пасандоз s сомонӣ. Ҳар сол p фоиз (аз маблағи ҷорӣ, қисми бутун) илова мешавад. Пас аз n сол чанд мешавад?', 'Як сатр: s, p, n (0 ≤ s ≤ 10⁶, 0 ≤ p ≤ 20, 0 ≤ n ≤ 50).', 'Як адад.',
  body(['s', 'p', 'n']) + 'for (long long i = 1; i <= n; i++) {\n    s = s + s * p / 100;\n}\ncout << s << endl;', lambda s: (lambda s0, p, n: str(_comp(s0, p, n)))(*nums(s)), ['1000 10 2', '500 0 5', '100 20 50'],
  lambda r: f'{R(r, 0, 10**6)} {R(r, 0, 20)} {R(r, 0, 50)}', why=lambda s: 'Ҳар сол: s = s + s·p/100.')
P('w4d1-29', 'Ҷамъи рақамҳо дар фосила', 'Ададҳои a ва b (1 ≤ a ≤ b). Ҷамъи рақамҳои ҳамаи ададҳо аз a то b-ро ёбед.', 'Як сатр: a, b (b ≤ 10⁹, b − a ≤ 10⁵).', 'Як адад.',
  body(['a', 'b']) + 'long long s = 0;\nfor (long long i = a; i <= b; i++) {\n    for (long long m = i; m > 0; m /= 10) s += m % 10;\n}\ncout << s << endl;', lambda s: str(sum(sum(map(int, str(i))) for i in range(nums(s)[0], nums(s)[1] + 1))),
  ['1 10', '99 101', '5 5'], lambda r: (lambda a: f'{a} {R(r, a, a + 10**5)}')(R(r, 1, 10**9 - 10**5)), why=lambda s: 'Барои ҳар адад ҷамъи рақамҳо.')
P('w4d1-30', 'Каратиҳои умумӣ', 'Ададҳои n, a, b. Аз 1 то n чанд адад ҳам ба a ва ҳам ба b тақсим мешавад?', 'Як сатр: n, a, b (1 ≤ n ≤ 10⁶, 1 ≤ a, b ≤ 10³).', 'Як адад.',
  body(['n', 'a', 'b']) + 'long long c = 0;\nfor (long long i = 1; i <= n; i++) {\n    if (i % a == 0 && i % b == 0) c++;\n}\ncout << c << endl;', lambda s: (lambda n, a, b: str(n // math.lcm(a, b)))(*nums(s)),
  ['30 4 6', '10 3 7', '100 5 5'], lambda r: f'{R(r, 1, 10**6)} {R(r, 1, 100)} {R(r, 1, 100)}', why=lambda s: 'Ҳарду шарт бо &&.')

# ───────── Рӯзи 2: ҷадвалҳо ─────────
use(4, 2); lvl('Миёна')
P('w4d2-11', 'Ҷадвали ҷамъ', 'Адади n. Барои i = 1…10 сатрҳои «n + i = s»-ро чоп кунед.', 'Як адад n (|n| ≤ 10⁹).', '10 сатр.',
  READN + 'for (int i = 1; i <= 10; i++) {\n    cout << n << " + " << i << " = " << n + i << endl;\n}', lambda s: '\n'.join(f'{n0(s)} + {i} = {n0(s) + i}' for i in range(1, 11)), ['5', '0', '-3'],
  lambda r: str(R(r, -10**9, 10**9)), why=lambda s: 'Ҳар сатр як i.')
P('w4d2-12', 'Ҷадвали кубҳо', 'Адади n. Барои i = 1…n сатрҳои «i*i*i = куб»-ро чоп кунед.', 'Як адад n (1 ≤ n ≤ 1000).', 'n сатр.',
  READN + 'for (long long i = 1; i <= n; i++) {\n    cout << i << "*" << i << "*" << i << " = " << i * i * i << endl;\n}', lambda s: '\n'.join(f'{i}*{i}*{i} = {i ** 3}' for i in range(1, n0(s) + 1)),
  ['3', '1', '1000'], lambda r: str(R(r, 1, 1000)), why=lambda s: 'Масалан: 2*2*2 = 8')
P('w4d2-13', 'Ҷадвали дараҷаҳои 2', 'Адади n. Барои i = 0…n сатрҳои «2^i = қимат»-ро чоп кунед.', 'Як адад n (0 ≤ n ≤ 60).', 'n + 1 сатр.',
  READN + 'long long p = 1;\nfor (long long i = 0; i <= n; i++) {\n    cout << "2^" << i << " = " << p << endl;\n    p *= 2;\n}', lambda s: '\n'.join(f'2^{i} = {2 ** i}' for i in range(n0(s) + 1)),
  ['3', '0', '60'] + [str(i) for i in (1, 5, 10, 25, 40, 59)], why=lambda s: '2^0 = 1')
P('w4d2-14', 'Соат ва сония', 'Адади n. Барои h = 1…n сатрҳои «h соат = x сония»-ро чоп кунед.', 'Як адад n (1 ≤ n ≤ 100).', 'n сатр.',
  READN + 'for (long long h = 1; h <= n; h++) {\n    cout << h << " соат = " << h * 3600 << " сония" << endl;\n}', lambda s: '\n'.join(f'{h} соат = {h * 3600} сония' for h in range(1, n0(s) + 1)),
  ['3', '1', '100'], lambda r: str(R(r, 1, 100)), why=lambda s: '1 соат = 3600 сония')
P('w4d2-15', 'Ҷадвали нарх', 'Нархи як мол p ва адади n. Барои i = 1…n сатрҳои «i x p = ҳамагӣ»-ро чоп кунед.', 'Як сатр: p, n (0 ≤ p ≤ 10⁶, 1 ≤ n ≤ 100).', 'n сатр.',
  body(['p', 'n']) + 'for (long long i = 1; i <= n; i++) {\n    cout << i << " x " << p << " = " << i * p << endl;\n}', lambda s: (lambda p, n: '\n'.join(f'{i} x {p} = {i * p}' for i in range(1, n + 1)))(*nums(s)),
  ['15 3', '0 2', '1000000 100'], lambda r: f'{R(r, 0, 10**6)} {R(r, 1, 100)}', why=lambda s: 'Барои ҳар миқдор.')
P('w4d2-16', 'Селсий ва Фаренгейт', 'Ададҳои a ва b (каратиҳои 10, a ≤ b). Барои C = a, a + 10, …, b сатрҳои «C F»-ро чоп кунед, ки F = C · 9 / 5 + 32.', 'Як сатр: a, b (−500 ≤ a ≤ b ≤ 500).', 'Сатрҳо.',
  body(['a', 'b']) + 'for (long long c = a; c <= b; c += 10) {\n    cout << c << " " << c * 9 / 5 + 32 << endl;\n}', lambda s: (lambda a, b: '\n'.join(f'{c} {c * 9 // 5 + 32}' for c in range(a, b + 1, 10)))(*nums(s)),
  ['0 30', '-40 -40', '-20 20'], lambda r: (lambda a: f'{a} {a + 10 * R(r, 0, (500 - a) // 10)}')(10 * R(r, -50, 50)), why=lambda s: 'Қадам 10.')
P('w4d2-17', 'Ситора ва тире', 'Адади n. Сатри дарозии n-ро чоп кунед, ки аломатҳо навбат мегиранд: *-*-*…', 'Як адад n (1 ≤ n ≤ 1000).', 'Як сатр.',
  READN + 'for (long long i = 1; i <= n; i++) {\n    if (i % 2 == 1) cout << "*";\n    else cout << "-";\n}\ncout << endl;', lambda s: ''.join('*' if i % 2 else '-' for i in range(1, n0(s) + 1)), ['5', '1', '1000'],
  lambda r: str(R(r, 1, 1000)), why=lambda s: 'Ҷойҳои тоқ — *, ҷуфт — -.')
P('w4d2-18', 'Ҷадвали зарби k дар фосила', 'Ададҳои k, a, b (a ≤ b). Барои i = a…b сатрҳои «k x i = ҳосил»-ро чоп кунед.', 'Як сатр: k, a, b (|k| ≤ 10⁶, 1 ≤ a ≤ b ≤ 1000).', 'Сатрҳо.',
  body(['k', 'a', 'b']) + 'for (long long i = a; i <= b; i++) {\n    cout << k << " x " << i << " = " << k * i << endl;\n}', lambda s: (lambda k, a, b: '\n'.join(f'{k} x {i} = {k * i}' for i in range(a, b + 1)))(*nums(s)),
  ['7 3 5', '2 1 1', '-3 1 4'], lambda r: (lambda a: f'{R(r, -10**6, 10**6)} {a} {R(r, a, min(1000, a + 50))}')(R(r, 1, 1000)), why=lambda s: 'Аз a то b.')
P('w4d2-19', 'Ҷадвали фоизҳо', 'Адади s. Барои i = 10, 20, …, 100 сатрҳои «i% = s·i/100» (қисми бутун)-ро чоп кунед.', 'Як адад s (0 ≤ s ≤ 10⁹).', '10 сатр.',
  READN + 'for (int i = 10; i <= 100; i += 10) {\n    cout << i << "% = " << n * i / 100 << endl;\n}', lambda s: '\n'.join(f'{i}% = {n0(s) * i // 100}' for i in range(10, 101, 10)), ['250', '0', '999'],
  lambda r: str(R(r, 0, 10**9)), why=lambda s: 'Қадам 10.')
P('w4d2-20', 'Ҷуфт ва тоқ', 'Адади n. Барои i = 1…n сатрҳои «i ҷуфт» ё «i тоқ»-ро чоп кунед.', 'Як адад n (1 ≤ n ≤ 1000).', 'n сатр.',
  READN + 'for (long long i = 1; i <= n; i++) {\n    if (i % 2 == 0) cout << i << " ҷуфт" << endl;\n    else cout << i << " тоқ" << endl;\n}', lambda s: '\n'.join(f'{i} {"ҷуфт" if i % 2 == 0 else "тоқ"}' for i in range(1, n0(s) + 1)),
  ['4', '1', '1000'], lambda r: str(R(r, 1, 1000)), why=lambda s: 'Дар дохили давр if.')

lvl('Душвор')
P('w4d2-21', 'Ҷамъҳои ҷорӣ', 'Адади n. Барои i = 1…n сатрҳои «i ҷамъ» чоп кунед, ки ҷамъ = 1 + 2 + … + i.', 'Як адад n (1 ≤ n ≤ 1000).', 'n сатр.',
  READN + 'long long s = 0;\nfor (long long i = 1; i <= n; i++) {\n    s += i;\n    cout << i << " " << s << endl;\n}', lambda s: '\n'.join(f'{i} {i * (i + 1) // 2}' for i in range(1, n0(s) + 1)),
  ['4', '1', '1000'], lambda r: str(R(r, 1, 1000)), why=lambda s: 'Ҷамъро дар давр нав кунед.')
P('w4d2-22', 'Ҷадвали факториалҳо', 'Адади n. Барои i = 0…n сатрҳои «i! = қимат»-ро чоп кунед.', 'Як адад n (0 ≤ n ≤ 20).', 'n + 1 сатр.',
  READN + 'long long f = 1;\nfor (long long i = 0; i <= n; i++) {\n    if (i > 0) f *= i;\n    cout << i << "! = " << f << endl;\n}', lambda s: '\n'.join(f'{i}! = {math.factorial(i)}' for i in range(n0(s) + 1)),
  ['4', '0', '20'] + [str(i) for i in (1, 2, 7, 11, 15, 18, 19)], why=lambda s: '0! = 1')
P('w4d2-23', 'Ҷадвали Фибоначчи', 'Адади n. Барои i = 1…n сатрҳои «F(i) = қимат»-ро чоп кунед (F(1) = F(2) = 1).', 'Як адад n (1 ≤ n ≤ 90).', 'n сатр.',
  READN + 'long long a = 0, b = 1;\nfor (long long i = 1; i <= n; i++) {\n    long long c = a + b;\n    a = b;\n    b = c;\n    cout << "F(" << i << ") = " << a << endl;\n}', lambda s: '\n'.join(f'F({i}) = {fib(i)}' for i in range(1, n0(s) + 1)),
  ['5', '1', '90'] + [str(i) for i in (2, 3, 10, 30, 50, 75, 89)], why=lambda s: 'F(i) = F(i−1) + F(i−2)')
P('w4d2-24', 'Ҷадвали тақсимшавӣ', 'Ададҳои n ва k. Барои i = 1…n сатрҳои «i YES» (агар i ба k тақсим шавад) ё «i NO»-ро чоп кунед.', 'Як сатр: n, k (1 ≤ n ≤ 1000, 1 ≤ k ≤ 1000).', 'n сатр.',
  body(['n', 'k']) + 'for (long long i = 1; i <= n; i++) {\n    if (i % k == 0) cout << i << " YES" << endl;\n    else cout << i << " NO" << endl;\n}', lambda s: (lambda n, k: '\n'.join(f'{i} {yn(i % k == 0)}' for i in range(1, n + 1)))(*nums(s)),
  ['6 3', '1 1', '10 4'], lambda r: f'{R(r, 1, 1000)} {R(r, 1, 50)}', why=lambda s: 'i % k == 0.')
P('w4d2-25', 'Ду ҷадвали зарб', 'Ададҳои a ва b. Барои i = 1…10 сатрҳои «a x i = x | b x i = y»-ро чоп кунед.', 'Як сатр: a, b (|x| ≤ 10⁶).', '10 сатр.',
  body(['a', 'b']) + 'for (int i = 1; i <= 10; i++) {\n    cout << a << " x " << i << " = " << a * i << " | " << b << " x " << i << " = " << b * i << endl;\n}',
  lambda s: (lambda a, b: '\n'.join(f'{a} x {i} = {a * i} | {b} x {i} = {b * i}' for i in range(1, 11)))(*nums(s)), ['2 3', '0 9', '-5 7'], lambda r: rn(r, 2, -10**6, 10**6), why=lambda s: 'Ду ҷадвал паҳлуи ҳам.')
P('w4d2-26', 'Адад, квадрат, куб', 'Адади n. Барои i = 1…n сатрҳои «i i² i³»-ро бо фосила чоп кунед.', 'Як адад n (1 ≤ n ≤ 1000).', 'n сатр.',
  READN + 'for (long long i = 1; i <= n; i++) {\n    cout << i << " " << i * i << " " << i * i * i << endl;\n}', lambda s: '\n'.join(f'{i} {i * i} {i ** 3}' for i in range(1, n0(s) + 1)), ['3', '1', '1000'],
  lambda r: str(R(r, 1, 1000)), why=lambda s: 'Се сутун.')
P('w4d2-27', 'Ҷадвали бақияҳо', 'Ададҳои n ва k. Барои i = 1…k сатрҳои «n % i = бақия»-ро чоп кунед.', 'Як сатр: n, k (0 ≤ n ≤ 10⁹, 1 ≤ k ≤ 100).', 'k сатр.',
  body(['n', 'k']) + 'for (long long i = 1; i <= k; i++) {\n    cout << n << " % " << i << " = " << n % i << endl;\n}', lambda s: (lambda n, k: '\n'.join(f'{n} % {i} = {n % i}' for i in range(1, k + 1)))(*nums(s)),
  ['10 4', '0 2', '1000000000 100'], lambda r: f'{R(r, 0, 10**9)} {R(r, 1, 100)}', why=lambda s: 'Бақия барои ҳар i.')
P('w4d2-28', 'Ҷадвали вақт', 'Вақти оғоз h:m, қадам d дақиқа ва k сатр. Вақтҳоро дар шакли HH:MM (бо 0 дар пеш) чоп кунед; пас аз 23:59 — 00:00.', 'Як сатр: h, m, d, k (0 ≤ h ≤ 23, 0 ≤ m ≤ 59, 1 ≤ d ≤ 1000, 1 ≤ k ≤ 100).', 'k сатр.',
  body(['h', 'm', 'd', 'k']) + 'long long t = h * 60 + m;\nfor (long long i = 0; i < k; i++) {\n    long long x = (t + i * d) % 1440;\n    long long hh = x / 60, mm = x % 60;\n    if (hh < 10) cout << 0;\n    cout << hh << ":";\n    if (mm < 10) cout << 0;\n    cout << mm << endl;\n}',
  lambda s: (lambda h, m, d, k: '\n'.join(f'{(h * 60 + m + i * d) % 1440 // 60:02d}:{(h * 60 + m + i * d) % 60:02d}' for i in range(k)))(*nums(s)), ['8 0 45 4', '23 30 20 3', '0 5 60 1'],
  lambda r: f'{R(r, 0, 23)} {R(r, 0, 59)} {R(r, 1, 1000)} {R(r, 1, 100)}', why=lambda s: 'Масалан: 08:00, 08:45, …')
P('w4d2-29', 'Солҳои кабиса', 'Ададҳои a ва b (a ≤ b). Ҳамаи солҳои кабисаи аз a то b-ро ҳар кадомро дар сатри алоҳида чоп кунед. Агар набошад, NONE.', 'Як сатр: a, b (1 ≤ a ≤ b ≤ 10⁵).', 'Солҳо ё NONE.',
  body(['a', 'b']) + 'bool none = true;\nfor (long long y = a; y <= b; y++) {\n    if ((y % 4 == 0 && y % 100 != 0) || y % 400 == 0) {\n        cout << y << endl;\n        none = false;\n    }\n}\nif (none) cout << "NONE" << endl;',
  lambda s: '\n'.join(str(y) for y in range(nums(s)[0], nums(s)[1] + 1) if (y % 4 == 0 and y % 100 != 0) or y % 400 == 0) or 'NONE', ['2020 2030', '2001 2003', '1896 1904', '2000 2000'],
  lambda r: (lambda a: f'{a} {R(r, a, a + 200)}')(R(r, 1, 10**5 - 200)), why=lambda s: 'Қоидаи соли кабиса.')
P('w4d2-30', 'Ҷадвали тахфиф', 'Нархи мол p. Барои тахфифҳои 5%, 10%, …, 50% сатрҳои «d% p − p·d/100» (қисми бутуни тахфиф)-ро чоп кунед.', 'Як адад p (0 ≤ p ≤ 10⁹).', '10 сатр.',
  READN + 'for (int d = 5; d <= 50; d += 5) {\n    cout << d << "% " << n - n * d / 100 << endl;\n}', lambda s: '\n'.join(f'{d}% {n0(s) - n0(s) * d // 100}' for d in range(5, 51, 5)), ['200', '0', '999'],
  lambda r: str(R(r, 0, 10**9)), why=lambda s: 'Нархи нав барои ҳар тахфиф.')

# ───────── Рӯзи 3: формулаҳо бо for ─────────
use(4, 3); lvl('Миёна')
P('w4d3-11', 'Ҷамъи квадратҳои тоқ', 'Адади n. Ҷамъи квадратҳои ададҳои тоқи аз 1 то n-ро ёбед (1² + 3² + …).', 'Як адад n (1 ≤ n ≤ 10⁵).', 'Як адад.',
  READN + 'long long s = 0;\nfor (long long i = 1; i <= n; i += 2) s += i * i;\ncout << s << endl;', lambda s: str(sum(i * i for i in range(1, n0(s) + 1, 2))), ['5', '1', '100000'], lambda r: str(R(r, 1, 10**5)),
  why=lambda s: '1 + 9 + 25 + …')
P('w4d3-12', 'Ҷамъи 2⁰ то 2ⁿ', 'Адади n. 2⁰ + 2¹ + … + 2ⁿ-ро бо давр ёбед.', 'Як адад n (0 ≤ n ≤ 61).', 'Як адад.',
  READN + 'long long p = 1, s = 0;\nfor (long long i = 0; i <= n; i++) {\n    s += p;\n    p *= 2;\n}\ncout << s << endl;', lambda s: str(2 ** (n0(s) + 1) - 1), ['3', '0', '61'] + [str(i) for i in (1, 7, 15, 30, 44, 59, 60)],
  why=lambda s: '1 + 2 + 4 + …')
P('w4d3-13', 'Ададҳои панҷкунҷа', 'Ададҳои панҷкунҷа: k·(3k − 1)/2 (1, 5, 12, 22, …). Ҳамаи онҳоро, ки аз n калон нестанд, бо фосила чоп кунед.', 'Як адад n (1 ≤ n ≤ 10⁶).', 'Ададҳо.',
  READN + 'for (long long k = 1; k * (3 * k - 1) / 2 <= n; k++) {\n    if (k > 1) cout << " ";\n    cout << k * (3 * k - 1) / 2;\n}\ncout << endl;', lambda s: ' '.join(str(k * (3 * k - 1) // 2) for k in range(1, 10**5) if k * (3 * k - 1) // 2 <= n0(s)),
  ['30', '1', '1000000'], lambda r: str(R(r, 1, 10**6)), why=lambda s: '1, 5, 12, 22, 35, …')
P('w4d3-14', 'Прогрессияи геометрӣ', 'Ададҳои a, q ва n. a + a·q + a·q² + … (n ҷамъшаванда)-ро ёбед.', 'Як сатр: a, q, n (|a| ≤ 100, |q| ≤ 10, 1 ≤ n ≤ 15).', 'Як адад.',
  body(['a', 'q', 'n']) + 'long long t = a, s = 0;\nfor (long long i = 1; i <= n; i++) {\n    s += t;\n    t *= q;\n}\ncout << s << endl;', lambda s: (lambda a, q, n: str(sum(a * q ** i for i in range(n))))(*nums(s)),
  ['1 2 5', '3 -1 4', '100 10 15'], lambda r: f'{R(r, -100, 100)} {R(r, -10, 10)} {R(r, 1, 15)}', why=lambda s: 'Ҳар узв = пешина · q.')
P('w4d3-15', 'Квадратҳои навбатӣ', 'Адади n. 1² − 2² + 3² − … ± n²-ро ёбед.', 'Як адад n (1 ≤ n ≤ 10⁵).', 'Як адад.',
  READN + 'long long s = 0;\nfor (long long i = 1; i <= n; i++) {\n    if (i % 2 == 1) s += i * i;\n    else s -= i * i;\n}\ncout << s << endl;', lambda s: str(sum(i * i if i % 2 else -i * i for i in range(1, n0(s) + 1))),
  ['3', '4', '1', '100000'], lambda r: str(R(r, 1, 10**5)), why=lambda s: '1 − 4 + 9 − …')
P('w4d3-16', 'Ҷамъи рақамҳои n!', 'Адади n. Ҷамъи рақамҳои n!-ро ёбед.', 'Як адад n (0 ≤ n ≤ 20).', 'Як адад.',
  READN + 'long long f = 1;\nfor (long long i = 2; i <= n; i++) f *= i;\nlong long s = 0;\nfor (; f > 0; f /= 10) s += f % 10;\ncout << s << endl;', lambda s: str(sum(map(int, str(math.factorial(n0(s)))))),
  ['5', '0', '20'] + [str(i) for i in (1, 3, 8, 10, 14, 17, 19)], why=lambda s: f'{n0(s)}! = {math.factorial(n0(s))}')
P('w4d3-17', 'Ададҳо бо ҷамъи рақамҳои k', 'Ададҳои n ва k. Аз 1 то n чанд адад ҷамъи рақамҳояш ба k баробар аст?', 'Як сатр: n, k (1 ≤ n ≤ 10⁵, 1 ≤ k ≤ 50).', 'Як адад.',
  body(['n', 'k']) + 'long long c = 0;\nfor (long long i = 1; i <= n; i++) {\n    long long s = 0;\n    for (long long m = i; m > 0; m /= 10) s += m % 10;\n    if (s == k) c++;\n}\ncout << c << endl;',
  lambda s: (lambda n, k: str(sum(1 for i in range(1, n + 1) if sum(map(int, str(i))) == k)))(*nums(s)), ['20 2', '9 9', '100000 45'], lambda r: f'{R(r, 1, 10**5)} {R(r, 1, 30)}', why=lambda s: 'Барои ҳар адад ҷамъи рақамҳо.')
P('w4d3-18', 'Ҷамъи 1 + 11 + 111', 'Адади n. Ҷамъи 1 + 11 + 111 + … (n ҷамъшаванда)-ро ёбед.', 'Як адад n (1 ≤ n ≤ 17).', 'Як адад.',
  READN + 'long long t = 0, s = 0;\nfor (long long i = 1; i <= n; i++) {\n    t = t * 10 + 1;\n    s += t;\n}\ncout << s << endl;', lambda s: str(sum(int('1' * i) for i in range(1, n0(s) + 1))),
  ['3', '1', '17'] + [str(i) for i in (2, 5, 8, 10, 12, 15, 16)], why=lambda s: 't = t · 10 + 1.')
P('w4d3-19', 'Ҷамъи каратиҳои 3 ё 5', 'Адади n. Ҷамъи ҳамаи ададҳои аз n хурдро, ки ба 3 ё ба 5 тақсим мешаванд, ёбед.', 'Як адад n (1 ≤ n ≤ 10⁶).', 'Як адад.',
  READN + 'long long s = 0;\nfor (long long i = 1; i < n; i++) {\n    if (i % 3 == 0 || i % 5 == 0) s += i;\n}\ncout << s << endl;', lambda s: str(sum(i for i in range(1, n0(s)) if i % 3 == 0 or i % 5 == 0)),
  ['10', '1', '1000', '1000000'], lambda r: str(R(r, 1, 10**6)), why=lambda s: 'Барои 10: 3 + 5 + 6 + 9 = 23.')
P('w4d3-20', 'Ҷамъи ададҳои секунҷагӣ', 'Адади секунҷагии i: T(i) = 1 + 2 + … + i. Ҷамъи T(1) + T(2) + … + T(n)-ро ёбед.', 'Як адад n (1 ≤ n ≤ 10⁵).', 'Як адад.',
  READN + 'long long t = 0, s = 0;\nfor (long long i = 1; i <= n; i++) {\n    t += i;\n    s += t;\n}\ncout << s << endl;', lambda s: str(sum(i * (i + 1) // 2 for i in range(1, n0(s) + 1))), ['3', '1', '100000'],
  lambda r: str(R(r, 1, 10**5)), why=lambda s: '1 + 3 + 6 + …')

lvl('Душвор')
P('w4d3-21', 'Ҷуфтҳои ҳамсода', 'Адади n. Чанд ҷуфти (i, j) ҳаст, ки 1 ≤ i < j ≤ n ва ТУК(i, j) = 1?', 'Як адад n (1 ≤ n ≤ 500).', 'Як адад.',
  READN + 'long long c = 0;\nfor (long long i = 1; i <= n; i++) {\n    for (long long j = i + 1; j <= n; j++) {\n        long long a = i, b = j;\n        while (b != 0) {\n            long long t = a % b;\n            a = b;\n            b = t;\n        }\n        if (a == 1) c++;\n    }\n}\ncout << c << endl;',
  lambda s: str(sum(1 for i in range(1, n0(s) + 1) for j in range(i + 1, n0(s) + 1) if math.gcd(i, j) == 1)), ['4', '1', '500'], lambda r: str(R(r, 1, 500)), why=lambda s: 'Ҳамаи ҷуфтҳоро санҷед.')
P('w4d3-22', 'Фибоначчӣ бо модул', 'Ададҳои n ва m. F(n) mod m-ро ёбед (F(0) = 0, F(1) = 1).', 'Як сатр: n, m (0 ≤ n ≤ 10⁶, 1 ≤ m ≤ 10⁹).', 'Як адад.',
  body(['n', 'm']) + 'long long a = 0, b = 1 % m;\nfor (long long i = 0; i < n; i++) {\n    long long c = (a + b) % m;\n    a = b;\n    b = c;\n}\ncout << a << endl;', lambda s: str(_fibmod(*nums(s))), ['10 100', '0 7', '1000000 1000000007', '5 1'],
  lambda r: f'{R(r, 0, 10**6)} {R(r, 1, 10**9)}', why=lambda s: 'Бақияро дар ҳар қадам гиред.')
P('w4d3-23', 'Ҷамъи ҳамаи тақсимкунандаҳо', 'Адади n. Ҷамъи тақсимкунандаҳои ҳамаи ададҳои аз 1 то n-ро ёбед. (Маслиҳат: d дар n/d адад тақсимкунанда аст.)', 'Як адад n (1 ≤ n ≤ 10⁶).', 'Як адад.',
  READN + 'long long s = 0;\nfor (long long d = 1; d <= n; d++) s += d * (n / d);\ncout << s << endl;', lambda s: str(sum(d * (n0(s) // d) for d in range(1, n0(s) + 1))), ['4', '1', '1000000'],
  lambda r: str(R(r, 1, 10**6)), why=lambda s: 'Барои 4: 1 + 3 + 4 + 7 = 15.')
P('w4d3-24', 'Ададҳои Каталан', 'Адади n. Адади Каталан C(n)-ро ёбед: C(0) = 1, C(k+1) = C(k) · 2(2k + 1) / (k + 2).', 'Як адад n (0 ≤ n ≤ 30).', 'Як адад.',
  READN + 'long long c = 1;\nfor (long long k = 0; k < n; k++) {\n    c = c * 2 * (2 * k + 1) / (k + 2);\n}\ncout << c << endl;', lambda s: str(math.comb(2 * n0(s), n0(s)) // (n0(s) + 1)),
  ['3', '0', '30'] + [str(i) for i in (1, 2, 5, 10, 17, 25, 29)], why=lambda s: '1, 1, 2, 5, 14, 42, …')
P('w4d3-25', 'Комбинатсия', 'Ададҳои n ва k. Шумораи роҳҳои интихоби k ашё аз n ашё C(n, k)-ро ёбед. (res = res · (n − i) / (i + 1).)', 'Як сатр: n, k (0 ≤ k ≤ n ≤ 50).', 'Як адад.',
  body(['n', 'k']) + 'if (k > n - k) k = n - k;\nlong long res = 1;\nfor (long long i = 0; i < k; i++) {\n    res = res * (n - i) / (i + 1);\n}\ncout << res << endl;', lambda s: str(math.comb(*nums(s))), ['5 2', '7 0', '50 25', '10 10'],
  lambda r: (lambda n: f'{n} {R(r, 0, n)}')(R(r, 0, 50)), why=lambda s: 'Пас аз ҳар қадам бе бақия тақсим мешавад.')
P('w4d3-26', 'Содаҳои дугоник то n', 'Адади n. Чанд ҷуфти (p, p + 2) ҳаст, ки ҳарду сода ва p + 2 ≤ n?', 'Як адад n (1 ≤ n ≤ 10⁵).', 'Як адад.',
  READN + 'long long c = 0;\nfor (long long p = 2; p + 2 <= n; p++) {\n    bool ok = true;\n    for (long long q = p; q <= p + 2 && ok; q += 2) {\n        for (long long d = 2; d * d <= q; d++) {\n            if (q % d == 0) {\n                ok = false;\n                break;\n            }\n        }\n    }\n    if (ok) c++;\n}\ncout << c << endl;',
  lambda s: str(sum(1 for p in range(2, n0(s) - 1) if isprime(p) and isprime(p + 2))), ['13', '1', '100000'], lambda r: str(R(r, 1, 2 * 10**4)), why=lambda s: '(3, 5), (5, 7), (11, 13), …')
P('w4d3-27', 'Дараҷаи p дар n!', 'Ададҳои n ва p (p — сода). p дар n! чанд бор ҳамчун зарбкунанда омадааст? (n/p + n/p² + …)', 'Як сатр: n, p (0 ≤ n ≤ 10¹⁸, p — сода, 2 ≤ p ≤ 10⁶).', 'Як адад.',
  body(['n', 'p']) + 'long long c = 0;\nfor (long long m = n / p; m > 0; m /= p) c += m;\ncout << c << endl;', lambda s: str(_leg(*nums(s))), ['10 2', '10 3', '0 5', '1000000000000000000 7'],
  lambda r: f'{R(r, 0, 10**18)} {r.choice([2, 3, 5, 7, 11, 13, 97, 101, 999983])}', why=lambda s: 'n/p + n/p² + …')
P('w4d3-28', 'Зинапоя', 'Ба зинапоя бо n зина бо қадами 1 ё 2 зина баромадан мумкин аст. Чанд роҳи гуногун ҳаст?', 'Як адад n (1 ≤ n ≤ 80).', 'Як адад.',
  READN + 'long long a = 1, b = 1;\nfor (long long i = 2; i <= n; i++) {\n    long long c = a + b;\n    a = b;\n    b = c;\n}\ncout << b << endl;', lambda s: str(fib(n0(s) + 1)), ['3', '1', '80'] + [str(i) for i in (2, 4, 10, 25, 50, 70, 79)],
  why=lambda s: 'Роҳҳо(n) = Роҳҳо(n−1) + Роҳҳо(n−2).')
P('w4d3-29', 'Фибоначчиҳои ҷуфт', 'Адади n. Ҷамъи ададҳои ҷуфти Фибоначчиро, ки аз n калон нестанд, ёбед.', 'Як адад n (1 ≤ n ≤ 10¹⁸).', 'Як адад.',
  READN + 'long long a = 1, b = 2, s = 0;\nfor (; b <= n; ) {\n    if (b % 2 == 0) s += b;\n    long long c = a + b;\n    a = b;\n    b = c;\n}\ncout << s << endl;', lambda s: str(sum(f for f in (fib(i) for i in range(1, 100)) if f % 2 == 0 and f <= n0(s))),
  ['10', '1', '4000000', '1000000000000000000'], lambda r: str(R(r, 1, 10**18)), why=lambda s: '2 + 8 + 34 + …')
P('w4d3-30', 'Факториал бо модул', 'Ададҳои n ва m. n! mod m-ро ёбед.', 'Як сатр: n, m (0 ≤ n ≤ 10⁶, 1 ≤ m ≤ 10⁹).', 'Як адад.',
  body(['n', 'm']) + 'long long f = 1 % m;\nfor (long long i = 2; i <= n; i++) f = f * i % m;\ncout << f << endl;', lambda s: str(_factmod(*nums(s))), ['5 7', '0 10', '1000000 1000000007', '10 1'],
  lambda r: f'{R(r, 0, 10**6)} {R(r, 1, 10**9)}', why=lambda s: 'Бақияро дар ҳар қадам гиред.')

# ───────── Рӯзи 4: пайдарпаии ададҳо ─────────
use(4, 4); lvl('Миёна')
SEQ = 'long long n;\ncin >> n;\n'
P('w4d4-11', 'Ҳосили зарби n адад', 'Адади n ва n адад. Ҳосили зарби онҳоро ёбед.', 'Сатри 1: n (1 ≤ n ≤ 15). Сатри 2: n адад (|x| ≤ 10).', 'Як адад.',
  SEQ + 'long long p = 1;\nfor (long long i = 0; i < n; i++) {\n    long long x;\n    cin >> x;\n    p *= x;\n}\ncout << p << endl;', lambda s: str(math.prod(arr(s))), ['3\n2 3 4', '1\n-5', '4\n1 0 7 9'],
  lambda r: seq(r, 1, 15, -10, 10), why=lambda s: 'p = p · x.')
P('w4d4-12', 'Сифрҳо', 'Адади n ва n адад. Чандтои онҳо 0 аст?', 'Сатри 1: n (1 ≤ n ≤ 1000). Сатри 2: n адад.', 'Як адад.',
  SEQ + 'long long c = 0;\nfor (long long i = 0; i < n; i++) {\n    long long x;\n    cin >> x;\n    if (x == 0) c++;\n}\ncout << c << endl;', lambda s: str(arr(s).count(0)), ['5\n0 1 0 2 3', '1\n7', '3\n0 0 0'],
  lambda r: seq(r, 1, 30, -2, 2), why=lambda s: 'x == 0.')
P('w4d4-13', 'Ҷамъи манфиҳо', 'Адади n ва n адад. Ҷамъи ададҳои манфиро ёбед.', 'Сатри 1: n (1 ≤ n ≤ 1000). Сатри 2: n адад (|x| ≤ 10⁹).', 'Як адад.',
  SEQ + 'long long s = 0;\nfor (long long i = 0; i < n; i++) {\n    long long x;\n    cin >> x;\n    if (x < 0) s += x;\n}\ncout << s << endl;', lambda s: str(sum(x for x in arr(s) if x < 0)), ['4\n-1 2 -3 4', '1\n5', '2\n-7 -7'],
  lambda r: seq(r), why=lambda s: 'Танҳо манфиҳо.')
P('w4d4-14', 'Калонтарин ва хурдтарин', 'Адади n ва n адад. Калонтарин ва хурдтаринро бо фосила чоп кунед.', 'Сатри 1: n (1 ≤ n ≤ 1000). Сатри 2: n адад.', 'Ду адад.',
  SEQ + 'long long mx, mn;\nfor (long long i = 0; i < n; i++) {\n    long long x;\n    cin >> x;\n    if (i == 0 || x > mx) mx = x;\n    if (i == 0 || x < mn) mn = x;\n}\ncout << mx << " " << mn << endl;', lambda s: f'{max(arr(s))} {min(arr(s))}',
  ['4\n3 9 -2 5', '1\n7', '3\n4 4 4'], lambda r: seq(r), why=lambda s: 'Ду тағйирёбанда.')
P('w4d4-15', 'Аз миёна калон', 'Адади n ва n адад. Чанд адад аз миёнаи арифметикӣ калон аст? (Маслиҳат: x · n > ҷамъ; ададҳоро ду бор хондан мумкин нест — аввал ҳамаро дар хотир гиред ё ду давр.)', 'Сатри 1: n (1 ≤ n ≤ 1000). Сатри 2: n адад (|x| ≤ 10⁶).', 'Як адад.',
  '#include <iostream>\nusing namespace std;\n\nint main() {\n    long long n;\n    cin >> n;\n    long long a[1000], s = 0;\n    for (long long i = 0; i < n; i++) {\n        cin >> a[i];\n        s += a[i];\n    }\n    long long c = 0;\n    for (long long i = 0; i < n; i++) {\n        if (a[i] * n > s) c++;\n    }\n    cout << c << endl;\n    return 0;\n}\n',
  lambda s: (lambda v: str(sum(1 for x in v if x * len(v) > sum(v))))(arr(s)), ['4\n1 2 3 10', '1\n5', '3\n2 2 2'], lambda r: seq(r, 1, 100, -10**6, 10**6), why=lambda s: 'Аввал ҷамъ, баъд муқоиса.')
P('w4d4-16', 'Чанд бор k', 'Ададҳои n ва k, баъд n адад. Адади k чанд бор омадааст?', 'Сатри 1: n, k (1 ≤ n ≤ 1000). Сатри 2: n адад.', 'Як адад.',
  'long long n, k;\ncin >> n >> k;\nlong long c = 0;\nfor (long long i = 0; i < n; i++) {\n    long long x;\n    cin >> x;\n    if (x == k) c++;\n}\ncout << c << endl;', lambda s: (lambda v: str(v[2:2 + v[0]].count(v[1])))(nums(s)),
  ['5 3\n3 1 3 3 2', '1 7\n7', '3 0\n1 2 3'], lambda r: (lambda n: f'{n} {R(r, -3, 3)}\n' + rn(r, n, -3, 3))(R(r, 1, 30)), why=lambda s: 'x == k.')
P('w4d4-17', 'Ҷамъи ҷойҳои тоқ', 'Адади n ва n адад. Ҷамъи ададҳои дар ҷойҳои тоқ бударо (1-ум, 3-юм, …) ёбед.', 'Сатри 1: n (1 ≤ n ≤ 1000). Сатри 2: n адад (|x| ≤ 10⁹).', 'Як адад.',
  SEQ + 'long long s = 0;\nfor (long long i = 1; i <= n; i++) {\n    long long x;\n    cin >> x;\n    if (i % 2 == 1) s += x;\n}\ncout << s << endl;', lambda s: str(sum(arr(s)[::2])), ['5\n1 2 3 4 5', '1\n9', '2\n-4 7'],
  lambda r: seq(r), why=lambda s: 'Ҷойи 1, 3, 5, …')
P('w4d4-18', 'Ҷойи охирини калонтарин', 'Адади n ва n адад. Ҷойи охирини калонтаринро (1, 2, …) чоп кунед.', 'Сатри 1: n (1 ≤ n ≤ 1000). Сатри 2: n адад.', 'Як адад.',
  SEQ + 'long long mx = 0, pos = 0;\nfor (long long i = 1; i <= n; i++) {\n    long long x;\n    cin >> x;\n    if (i == 1 || x >= mx) {\n        mx = x;\n        pos = i;\n    }\n}\ncout << pos << endl;',
  lambda s: (lambda v: str(len(v) - v[::-1].index(max(v))))(arr(s)), ['5\n3 9 2 9 1', '1\n4', '3\n5 5 5'], lambda r: seq(r, 1, 20, -3, 3), why=lambda s: 'Бо >= ҷойи охиринро мегирем.')
P('w4d4-19', 'Мисли аввалин', 'Адади n ва n адад. Чанд адад ба адади аввал баробар аст (худи аввал ҳам ҳисоб)?', 'Сатри 1: n (1 ≤ n ≤ 1000). Сатри 2: n адад.', 'Як адад.',
  SEQ + 'long long first = 0, c = 0;\nfor (long long i = 0; i < n; i++) {\n    long long x;\n    cin >> x;\n    if (i == 0) first = x;\n    if (x == first) c++;\n}\ncout << c << endl;', lambda s: str(arr(s).count(arr(s)[0])),
  ['5\n2 1 2 2 3', '1\n7', '3\n4 5 6'], lambda r: seq(r, 1, 20, -2, 2), why=lambda s: 'Аввалинро нигоҳ доред.')
P('w4d4-20', 'Ҷуфтҳо − тоқҳо', 'Адади n ва n адад. Аз ҷамъи ададҳои ҷуфт ҷамъи ададҳои тоқро тарҳ кунед.', 'Сатри 1: n (1 ≤ n ≤ 1000). Сатри 2: n адад (|x| ≤ 10⁹).', 'Як адад.',
  SEQ + 'long long s = 0;\nfor (long long i = 0; i < n; i++) {\n    long long x;\n    cin >> x;\n    if (x % 2 == 0) s += x;\n    else s -= x;\n}\ncout << s << endl;', lambda s: str(sum(x if x % 2 == 0 else -x for x in arr(s))),
  ['4\n1 2 3 4', '1\n5', '2\n-2 -3'], lambda r: seq(r), why=lambda s: 'Ҷуфт — ҷамъ, тоқ — тарҳ.')

lvl('Душвор')
P('w4d4-21', 'Ҳамсояҳои баробар', 'Адади n ва n адад. Агар ду адади ҳамсояи баробар бошад YES, вагарна NO.', 'Сатри 1: n (1 ≤ n ≤ 1000). Сатри 2: n адад.', 'YES ё NO.',
  SEQ + 'long long prev = 0;\nbool ok = false;\nfor (long long i = 0; i < n; i++) {\n    long long x;\n    cin >> x;\n    if (i > 0 && x == prev) ok = true;\n    prev = x;\n}\nif (ok) cout << "YES";\nelse cout << "NO";\ncout << endl;',
  lambda s: (lambda v: yn(any(a == b for a, b in zip(v, v[1:]))))(arr(s)), ['4\n1 2 2 3', '3\n1 2 1', '1\n5'], lambda r: seq(r, 1, 10, 1, 4), why=lambda s: 'Бо пешина муқоиса кунед.')
P('w4d4-22', 'Ҷамъи калонтарини ду ҳамсоя', 'Адади n (n ≥ 2) ва n адад. Калонтарин ҷамъи ду адади ҳамсояро ёбед.', 'Сатри 1: n (2 ≤ n ≤ 1000). Сатри 2: n адад (|x| ≤ 10⁹).', 'Як адад.',
  SEQ + 'long long prev, best;\ncin >> prev;\nfor (long long i = 1; i < n; i++) {\n    long long x;\n    cin >> x;\n    if (i == 1 || prev + x > best) best = prev + x;\n    prev = x;\n}\ncout << best << endl;',
  lambda s: (lambda v: str(max(a + b for a, b in zip(v, v[1:]))))(arr(s)), ['4\n1 5 2 4', '2\n-3 -4', '3\n7 7 7'], lambda r: seq(r, 2, 30), why=lambda s: 'Ҳар ҷуфти ҳамсоя.')
P('w4d4-23', 'Қуллаҳо', 'Адади n ва n адад. Чанд адад аз ҳарду ҳамсояаш калон аст? (Адади аввал ва охир ҳисоб намешаванд.)', 'Сатри 1: n (1 ≤ n ≤ 1000). Сатри 2: n адад.', 'Як адад.',
  SEQ + 'long long a = 0, b = 0, c = 0;\nfor (long long i = 0; i < n; i++) {\n    long long x;\n    cin >> x;\n    if (i >= 2 && b > a && b > x) c++;\n    a = b;\n    b = x;\n}\ncout << c << endl;',
  lambda s: (lambda v: str(sum(1 for i in range(1, len(v) - 1) if v[i] > v[i - 1] and v[i] > v[i + 1])))(arr(s)), ['5\n1 3 2 5 4', '1\n5', '3\n2 2 2'], lambda r: seq(r, 1, 30, -5, 5), why=lambda s: 'Се адади пайдарпайро нигоҳ доред.')
P('w4d4-24', 'Мусбатҳои пайдарпай', 'Адади n ва n адад. Дарозтарин қисмати пайвастаи ададҳои мусбатро ёбед.', 'Сатри 1: n (1 ≤ n ≤ 1000). Сатри 2: n адад.', 'Як адад.',
  SEQ + 'long long cur = 0, best = 0;\nfor (long long i = 0; i < n; i++) {\n    long long x;\n    cin >> x;\n    if (x > 0) cur++;\n    else cur = 0;\n    if (cur > best) best = cur;\n}\ncout << best << endl;',
  lambda s: str(max((len(t) for t in ''.join('1' if x > 0 else '0' for x in arr(s)).split('0')), default=0)), ['6\n1 2 -1 3 4 5', '2\n-1 0', '3\n5 6 7'], lambda r: seq(r, 1, 30, -3, 5), why=lambda s: 'Мусбат — давомаш, вагарна 0.')
P('w4d4-25', 'Ҷамъи калонтарини қисмат', 'Адади n ва n адад. Калонтарин ҷамъи қисмати пайвастаро (ақаллан як адад) ёбед.', 'Сатри 1: n (1 ≤ n ≤ 1000). Сатри 2: n адад (|x| ≤ 10⁶).', 'Як адад.',
  SEQ + 'long long cur = 0, best = 0;\nfor (long long i = 0; i < n; i++) {\n    long long x;\n    cin >> x;\n    if (i == 0 || cur < 0) cur = x;\n    else cur += x;\n    if (i == 0 || cur > best) best = cur;\n}\ncout << best << endl;',
  lambda s: str(_kadane(arr(s))), ['5\n-2 1 -3 4 -1', '3\n-5 -2 -9', '4\n1 2 3 4', '7\n2 -1 2 -5 3 -1 4'], lambda r: seq(r, 1, 30, -10, 10), why=lambda s: 'Агар ҷамъи ҷорӣ манфӣ бошад — аз нав.')
P('w4d4-26', 'Рекордҳо', 'Адади n ва n адад. Чанд адад аз ҳамаи ададҳои пеш аз худ калон аст? (Адади аввал ҳамеша рекорд.)', 'Сатри 1: n (1 ≤ n ≤ 1000). Сатри 2: n адад.', 'Як адад.',
  SEQ + 'long long mx = 0, c = 0;\nfor (long long i = 0; i < n; i++) {\n    long long x;\n    cin >> x;\n    if (i == 0 || x > mx) {\n        c++;\n        mx = x;\n    }\n}\ncout << c << endl;',
  lambda s: (lambda v: str(sum(1 for i, x in enumerate(v) if i == 0 or x > max(v[:i]))))(arr(s)), ['5\n1 3 2 5 4', '1\n7', '3\n5 5 5'], lambda r: seq(r, 1, 30, -10, 10), why=lambda s: 'Калонтарини то ҳозираро нигоҳ доред.')
P('w4d4-27', 'Ҷаҳиши калонтарин', 'Адади n (n ≥ 2) ва n адад. Калонтарин фарқи (модул) байни ду адади ҳамсояро ёбед.', 'Сатри 1: n (2 ≤ n ≤ 1000). Сатри 2: n адад (|x| ≤ 10⁹).', 'Як адад.',
  SEQ + 'long long prev, best = 0;\ncin >> prev;\nfor (long long i = 1; i < n; i++) {\n    long long x;\n    cin >> x;\n    long long d = x > prev ? x - prev : prev - x;\n    if (d > best) best = d;\n    prev = x;\n}\ncout << best << endl;',
  lambda s: (lambda v: str(max(abs(a - b) for a, b in zip(v, v[1:]))))(arr(s)), ['4\n1 5 2 4', '2\n3 3', '3\n-5 5 0'], lambda r: seq(r, 2, 30), why=lambda s: 'Модули фарқ.')
P('w4d4-28', 'Ҷамъҳои пешванд', 'Адади n ва n адад. Барои ҳар ҷой ҷамъи ададҳоро аз аввал то он ҷо бо фосила чоп кунед.', 'Сатри 1: n (1 ≤ n ≤ 1000). Сатри 2: n адад (|x| ≤ 10⁹).', 'n адад.',
  SEQ + 'long long s = 0;\nfor (long long i = 0; i < n; i++) {\n    long long x;\n    cin >> x;\n    s += x;\n    if (i > 0) cout << " ";\n    cout << s;\n}\ncout << endl;',
  lambda s: ' '.join(str(sum(arr(s)[:i + 1])) for i in range(len(arr(s)))), ['4\n1 2 3 4', '1\n-5', '3\n5 -5 5'], lambda r: seq(r), why=lambda s: 'Ҷамъи ҷорӣ.')
P('w4d4-29', 'Миёна бе калон ва хурд', 'Адади n (n ≥ 3) ва n адад. Як калонтарин ва як хурдтаринро хориҷ карда, қисми бутуни миёнаи боқимондаро ёбед.', 'Сатри 1: n (3 ≤ n ≤ 1000). Сатри 2: n адад (0 ≤ x ≤ 1000).', 'Як адад.',
  SEQ + 'long long s = 0, mx = 0, mn = 0;\nfor (long long i = 0; i < n; i++) {\n    long long x;\n    cin >> x;\n    s += x;\n    if (i == 0 || x > mx) mx = x;\n    if (i == 0 || x < mn) mn = x;\n}\ncout << (s - mx - mn) / (n - 2) << endl;',
  lambda s: (lambda v: str((sum(v) - max(v) - min(v)) // (len(v) - 2)))(arr(s)), ['5\n1 2 3 4 100', '3\n5 5 5', '4\n0 10 20 30'], lambda r: seq(r, 3, 30, 0, 1000), why=lambda s: '(ҷамъ − калон − хурд) / (n − 2).')
P('w4d4-30', 'Ҳамсояҳо бо ҷамъи ҷуфт', 'Адади n ва n адад. Чанд ҷуфти ҳамсоя ҷамъи ҷуфт доранд?', 'Сатри 1: n (1 ≤ n ≤ 1000). Сатри 2: n адад.', 'Як адад.',
  SEQ + 'long long prev = 0, c = 0;\nfor (long long i = 0; i < n; i++) {\n    long long x;\n    cin >> x;\n    if (i > 0 && (prev + x) % 2 == 0) c++;\n    prev = x;\n}\ncout << c << endl;',
  lambda s: (lambda v: str(sum(1 for a, b in zip(v, v[1:]) if (a + b) % 2 == 0)))(arr(s)), ['4\n1 3 2 4', '1\n7', '3\n1 2 3'], lambda r: seq(r), why=lambda s: '(пешина + x) % 2 == 0.')

# ───────── Рӯзи 5: давр дар давр ─────────
use(4, 5); lvl('Миёна')
P('w4d5-11', 'Росткунҷаи ситорагӣ', 'Ададҳои n ва m. Росткунҷаи n сатр ва m сутун аз «*» чоп кунед.', 'Як сатр: n, m (1 ≤ n, m ≤ 50).', 'n сатр.',
  body(['n', 'm']) + 'for (long long i = 0; i < n; i++) {\n    for (long long j = 0; j < m; j++) cout << "*";\n    cout << endl;\n}', lambda s: '\n'.join('*' * nums(s)[1] for _ in range(nums(s)[0])), ['2 3', '1 1', '4 2'],
  lambda r: rn(r, 2, 1, 50), why=lambda s: 'Давр дар давр.')
P('w4d5-12', 'Секунҷаи рақамҳо', 'Адади n. Сатри i аз рақами i, i маротиба, иборат аст (1, 22, 333, …).', 'Як адад n (1 ≤ n ≤ 9).', 'n сатр.',
  READN + 'for (long long i = 1; i <= n; i++) {\n    for (long long j = 1; j <= i; j++) cout << i;\n    cout << endl;\n}', lambda s: '\n'.join(str(i) * i for i in range(1, n0(s) + 1)), [str(i) for i in range(1, 10)] + ['3'],
  why=lambda s: 'Сатри i — i аломат.')
P('w4d5-13', 'Секунҷаи рост', 'Адади n. Секунҷаи ситорагиро ба тарафи рост ҳамвор чоп кунед (сатри i: n − i фосила ва i ситора).', 'Як адад n (1 ≤ n ≤ 50).', 'n сатр.',
  READN + 'for (long long i = 1; i <= n; i++) {\n    for (long long j = 0; j < n - i; j++) cout << " ";\n    for (long long j = 0; j < i; j++) cout << "*";\n    cout << endl;\n}', lambda s: '\n'.join(' ' * (n0(s) - i) + '*' * i for i in range(1, n0(s) + 1)),
  ['3', '1', '50'], lambda r: str(R(r, 1, 50)), why=lambda s: 'Аввал фосила, баъд ситора.')
P('w4d5-14', 'Квадрати ададҳо', 'Адади n. n сатр чоп кунед, ҳар сатр: 1 2 … n.', 'Як адад n (1 ≤ n ≤ 50).', 'n сатр.',
  READN + 'for (long long i = 1; i <= n; i++) {\n    for (long long j = 1; j <= n; j++) {\n        cout << j;\n        if (j < n) cout << " ";\n    }\n    cout << endl;\n}', lambda s: '\n'.join(' '.join(str(j) for j in range(1, n0(s) + 1)) for _ in range(n0(s))),
  ['3', '1', '50'], lambda r: str(R(r, 1, 50)), why=lambda s: 'Ҳамаи сатрҳо якхела.')
P('w4d5-15', 'Ҷадвали ҷамъ n×n', 'Адади n. Ҷадвали n×n чоп кунед, ки дар сатри i ва сутуни j адади i + j аст.', 'Як адад n (1 ≤ n ≤ 50).', 'n сатр.',
  READN + 'for (long long i = 1; i <= n; i++) {\n    for (long long j = 1; j <= n; j++) {\n        cout << i + j;\n        if (j < n) cout << " ";\n    }\n    cout << endl;\n}', lambda s: '\n'.join(' '.join(str(i + j) for j in range(1, n0(s) + 1)) for i in range(1, n0(s) + 1)),
  ['3', '1', '50'], lambda r: str(R(r, 1, 50)), why=lambda s: 'i + j.')
P('w4d5-16', 'Диагонал', 'Адади n. Квадрати n×n чоп кунед: дар диагонали асосӣ «*», дар дигар ҷойҳо «.».', 'Як адад n (1 ≤ n ≤ 50).', 'n сатр.',
  READN + 'for (long long i = 0; i < n; i++) {\n    for (long long j = 0; j < n; j++) {\n        if (i == j) cout << "*";\n        else cout << ".";\n    }\n    cout << endl;\n}', lambda s: '\n'.join(''.join('*' if i == j else '.' for j in range(n0(s))) for i in range(n0(s))),
  ['3', '1', '50'], lambda r: str(R(r, 1, 50)), why=lambda s: 'i == j.')
P('w4d5-17', 'Зинапояи #', 'Адади n. Сатри i аз i аломати «#» иборат аст.', 'Як адад n (1 ≤ n ≤ 50).', 'n сатр.',
  READN + 'for (long long i = 1; i <= n; i++) {\n    for (long long j = 0; j < i; j++) cout << "#";\n    cout << endl;\n}', lambda s: '\n'.join('#' * i for i in range(1, n0(s) + 1)), ['3', '1', '50'], lambda r: str(R(r, 1, 50)),
  why=lambda s: 'Сатри i — i аломат.')
P('w4d5-18', 'Ҷуфтҳо бо ҷамъи ҷуфт', 'Адади n. Чанд ҷуфти (i, j) ҳаст, ки 1 ≤ i < j ≤ n ва i + j ҷуфт аст?', 'Як адад n (1 ≤ n ≤ 1000).', 'Як адад.',
  READN + 'long long c = 0;\nfor (long long i = 1; i <= n; i++) {\n    for (long long j = i + 1; j <= n; j++) {\n        if ((i + j) % 2 == 0) c++;\n    }\n}\ncout << c << endl;', lambda s: (lambda n: str((n // 2) * (n // 2 - 1) // 2 + ((n + 1) // 2) * ((n + 1) // 2 - 1) // 2))(n0(s)),
  ['4', '1', '1000'], lambda r: str(R(r, 1, 1000)), why=lambda s: 'Ҳарду ҷуфт ё ҳарду тоқ.')
P('w4d5-19', 'Ҷамъи ҳамаи i·j', 'Адади n. Ҷамъи i · j-ро барои ҳамаи 1 ≤ i ≤ n ва 1 ≤ j ≤ n ёбед.', 'Як адад n (1 ≤ n ≤ 1000).', 'Як адад.',
  READN + 'long long s = 0;\nfor (long long i = 1; i <= n; i++) {\n    for (long long j = 1; j <= n; j++) s += i * j;\n}\ncout << s << endl;', lambda s: str((n0(s) * (n0(s) + 1) // 2) ** 2), ['2', '1', '1000'],
  lambda r: str(R(r, 1, 1000)), why=lambda s: 'Ду давр.')
P('w4d5-20', 'Секунҷаи ҳарфҳо', 'Адади n. Сатри i ҳарфҳои A, B, … (i ҳарфи аввал)-ро дорад.', 'Як адад n (1 ≤ n ≤ 26).', 'n сатр.',
  READN + 'for (long long i = 1; i <= n; i++) {\n    for (long long j = 0; j < i; j++) cout << char(\'A\' + j);\n    cout << endl;\n}', lambda s: '\n'.join(''.join(chr(65 + j) for j in range(i)) for i in range(1, n0(s) + 1)),
  ['3', '1', '26'], lambda r: str(R(r, 1, 26)), why=lambda s: "char('A' + j).")

lvl('Душвор')
P('w4d5-21', 'Ромб', 'Адади n. Ромби ситорагиро бо n сатри боло чоп кунед (сатри i: n − i фосила ва 2i − 1 ситора; баъд баръакс).', 'Як адад n (1 ≤ n ≤ 30).', '2n − 1 сатр.',
  READN + 'for (long long i = 1; i <= n; i++) {\n    for (long long j = 0; j < n - i; j++) cout << " ";\n    for (long long j = 0; j < 2 * i - 1; j++) cout << "*";\n    cout << endl;\n}\nfor (long long i = n - 1; i >= 1; i--) {\n    for (long long j = 0; j < n - i; j++) cout << " ";\n    for (long long j = 0; j < 2 * i - 1; j++) cout << "*";\n    cout << endl;\n}',
  lambda s: (lambda n: '\n'.join(' ' * (n - i) + '*' * (2 * i - 1) for i in list(range(1, n + 1)) + list(range(n - 1, 0, -1))))(n0(s)), ['3', '1', '30'], lambda r: str(R(r, 1, 30)), why=lambda s: 'Боло ва поён.')
P('w4d5-22', 'Ҳарфи X', 'Адади тоқи n. Квадрати n×n чоп кунед: дар ҳарду диагонал «*», дар дигар ҷойҳо «.».', 'Як адади тоқ n (1 ≤ n ≤ 49).', 'n сатр.',
  READN + 'for (long long i = 0; i < n; i++) {\n    for (long long j = 0; j < n; j++) {\n        if (i == j || i + j == n - 1) cout << "*";\n        else cout << ".";\n    }\n    cout << endl;\n}',
  lambda s: '\n'.join(''.join('*' if i == j or i + j == n0(s) - 1 else '.' for j in range(n0(s))) for i in range(n0(s))), ['5', '1', '49'], lambda r: str(2 * R(r, 0, 24) + 1), why=lambda s: 'i == j ё i + j == n − 1.')
P('w4d5-23', 'Секунҷаи Паскал', 'Адади n. n сатри аввали секунҷаи Паскалро чоп кунед (ададҳо бо фосила).', 'Як адад n (1 ≤ n ≤ 30).', 'n сатр.',
  READN + 'for (long long i = 0; i < n; i++) {\n    long long c = 1;\n    for (long long k = 0; k <= i; k++) {\n        if (k > 0) cout << " ";\n        cout << c;\n        c = c * (i - k) / (k + 1);\n    }\n    cout << endl;\n}',
  lambda s: '\n'.join(' '.join(str(math.comb(i, k)) for k in range(i + 1)) for i in range(n0(s))), ['4', '1', '30'], lambda r: str(R(r, 1, 30)), why=lambda s: '1 / 1 1 / 1 2 1 / …')
P('w4d5-24', 'Ҷадвали ТУК', 'Адади n. Ҷадвали n×n чоп кунед, ки дар сатри i ва сутуни j ТУК(i, j) аст.', 'Як адад n (1 ≤ n ≤ 30).', 'n сатр.',
  READN + 'for (long long i = 1; i <= n; i++) {\n    for (long long j = 1; j <= n; j++) {\n        long long a = i, b = j;\n        while (b != 0) {\n            long long t = a % b;\n            a = b;\n            b = t;\n        }\n        cout << a;\n        if (j < n) cout << " ";\n    }\n    cout << endl;\n}',
  lambda s: '\n'.join(' '.join(str(math.gcd(i, j)) for j in range(1, n0(s) + 1)) for i in range(1, n0(s) + 1)), ['4', '1', '30'], lambda r: str(R(r, 1, 30)), why=lambda s: 'Давр дар давр + Евклид.')
P('w4d5-25', 'Сегонаҳо бо ҷамъи n', 'Адади n. Чанд сегонаи (a, b, c) ҳаст, ки 1 ≤ a ≤ b ≤ c ва a + b + c = n?', 'Як адад n (1 ≤ n ≤ 3000).', 'Як адад.',
  READN + 'long long cnt = 0;\nfor (long long a = 1; a <= n; a++) {\n    for (long long b = a; a + b <= n; b++) {\n        long long c = n - a - b;\n        if (c >= b) cnt++;\n    }\n}\ncout << cnt << endl;',
  lambda s: str(sum(1 for a in range(1, n0(s) + 1) for b in range(a, n0(s) - a + 1) if n0(s) - a - b >= b)), ['6', '2', '3000'], lambda r: str(R(r, 1, 1500)), why=lambda s: 'c = n − a − b.')
P('w4d5-26', 'Мор', 'Адади n. Ададҳои 1…n² -ро дар ҷадвали n×n нависед: сатрҳои тоқ аз чап ба рост, сатрҳои ҷуфт аз рост ба чап.', 'Як адад n (1 ≤ n ≤ 30).', 'n сатр.',
  READN + 'for (long long i = 0; i < n; i++) {\n    for (long long j = 0; j < n; j++) {\n        long long v = (i % 2 == 0) ? i * n + j + 1 : i * n + (n - j);\n        cout << v;\n        if (j < n - 1) cout << " ";\n    }\n    cout << endl;\n}',
  lambda s: '\n'.join(' '.join(str(i * n0(s) + j + 1 if i % 2 == 0 else i * n0(s) + n0(s) - j) for j in range(n0(s))) for i in range(n0(s))), ['3', '1', '30'], lambda r: str(R(r, 1, 30)),
  why=lambda s: '1 2 3 / 6 5 4 / 7 8 9')
P('w4d5-27', 'Ду квадрат', 'Адади n. Чанд ҷуфти (a, b) ҳаст, ки 0 ≤ a ≤ b ва a² + b² = n?', 'Як адад n (0 ≤ n ≤ 10⁶).', 'Як адад.',
  READN + 'long long c = 0;\nfor (long long a = 0; a * a <= n; a++) {\n    for (long long b = a; a * a + b * b <= n; b++) {\n        if (a * a + b * b == n) c++;\n    }\n}\ncout << c << endl;',
  lambda s: str(sum(1 for a in range(math.isqrt(n0(s)) + 1) for b in [math.isqrt(n0(s) - a * a)] if b >= a and a * a + b * b == n0(s))), ['25', '3', '0', '1000000'], lambda r: str(R(r, 0, 10**6)),
  why=lambda s: 'Барои 25: 0² + 5² ва 3² + 4².')
P('w4d5-28', 'Хонаҳои сафед', 'Тахтаи n×m. Хонаи (1, 1) сафед аст ва рангҳо навбат мегиранд. Чанд хона сафед аст? Бо давр дар давр ҳисоб кунед.', 'Як сатр: n, m (1 ≤ n, m ≤ 1000).', 'Як адад.',
  body(['n', 'm']) + 'long long c = 0;\nfor (long long i = 1; i <= n; i++) {\n    for (long long j = 1; j <= m; j++) {\n        if ((i + j) % 2 == 0) c++;\n    }\n}\ncout << c << endl;', lambda s: (lambda n, m: str((n * m + 1) // 2))(*nums(s)),
  ['3 3', '1 1', '2 5'], lambda r: rn(r, 2, 1, 1000), why=lambda s: '(i + j) % 2 == 0.')
P('w4d5-29', 'Ҳамаи росткунҷаҳо', 'Тахтаи n×m хона. Чанд росткунҷа (бо ҳама андоза) ҳаст? Бо давр дар давр ҳисоб кунед: ҳар ҷуфти сатрҳо × ҳар ҷуфти сутунҳо.', 'Як сатр: n, m (1 ≤ n, m ≤ 100).', 'Як адад.',
  body(['n', 'm']) + 'long long c = 0;\nfor (long long a = 1; a <= n; a++) {\n    for (long long b = a; b <= n; b++) {\n        for (long long x = 1; x <= m; x++) {\n            for (long long y = x; y <= m; y++) c++;\n        }\n    }\n}\ncout << c << endl;',
  lambda s: (lambda n, m: str(n * (n + 1) // 2 * (m * (m + 1) // 2)))(*nums(s)), ['2 2', '1 1', '100 100'], lambda r: rn(r, 2, 1, 100), why=lambda s: 'Чор давр.')
P('w4d5-30', 'Тангаҳои 1, 2 ва 5', 'Адади s. Бо чанд роҳ s дирамро бо тангаҳои 1, 2 ва 5 дирамӣ ҷамъ кардан мумкин аст? (Тартиб аҳамият надорад.)', 'Як адад s (0 ≤ s ≤ 10⁴).', 'Як адад.',
  READN + 'long long c = 0;\nfor (long long f = 0; f * 5 <= n; f++) {\n    for (long long t = 0; f * 5 + t * 2 <= n; t++) c++;\n}\ncout << c << endl;', lambda s: str(sum((n0(s) - 5 * f) // 2 + 1 for f in range(n0(s) // 5 + 1))),
  ['5', '0', '10', '10000'], lambda r: str(R(r, 0, 10**4)), why=lambda s: 'Шумораи 5-ҳо ва 2-ҳо; боқимонда бо 1-ҳо.')

# ───────── Имтиҳони ҳафтаи 4 ─────────
use(4, 6); lvl('Осон')
P('w4eA-3', 'Ҷамъи ҷуфтҳо дар фосила', 'Ададҳои a ва b (a ≤ b). Ҷамъи ададҳои ҷуфти аз a то b-ро ёбед.', 'Як сатр: a, b (|x| ≤ 10⁶).', 'Як адад.',
  body(['a', 'b']) + 'long long s = 0;\nfor (long long i = a; i <= b; i++) {\n    if (i % 2 == 0) s += i;\n}\ncout << s << endl;', lambda s: str(sum(i for i in range(nums(s)[0], nums(s)[1] + 1) if i % 2 == 0)),
  ['1 10', '3 3', '-4 4'], lambda r: (lambda a: f'{a} {R(r, a, 10**6)}')(R(r, -10**6, 10**6)), why=lambda s: 'i % 2 == 0.')
P('w4eA-4', 'Квадратҳо', 'Адади n. Квадратҳои ададҳои 1…n-ро бо фосила чоп кунед.', 'Як адад n (1 ≤ n ≤ 1000).', 'n адад.',
  READN + 'for (long long i = 1; i <= n; i++) {\n    cout << i * i;\n    if (i < n) cout << " ";\n}\ncout << endl;', lambda s: ' '.join(str(i * i) for i in range(1, n0(s) + 1)), ['4', '1', '1000'], lambda r: str(R(r, 1, 1000)),
  why=lambda s: '1 4 9 16 …')
P('w4eA-5', 'Факториали дугона', 'Адади n. n!! = n · (n − 2) · (n − 4) · … (то 1 ё 2) -ро ёбед; 0!! = 1.', 'Як адад n (0 ≤ n ≤ 30).', 'Як адад.',
  READN + 'long long p = 1;\nfor (long long i = n; i >= 2; i -= 2) p *= i;\ncout << p << endl;', lambda s: str(math.prod(range(n0(s), 1, -2))), ['7', '0', '30', '8'] + [str(i) for i in (1, 2, 3, 15, 22, 29)],
  why=lambda s: 'Қадам −2.')
P('w4eA-6', 'Манфиҳо', 'Адади n ва n адад. Чандтои онҳо манфӣ аст?', 'Сатри 1: n (1 ≤ n ≤ 1000). Сатри 2: n адад.', 'Як адад.',
  SEQ + 'long long c = 0;\nfor (long long i = 0; i < n; i++) {\n    long long x;\n    cin >> x;\n    if (x < 0) c++;\n}\ncout << c << endl;', lambda s: str(sum(1 for x in arr(s) if x < 0)), ['4\n-1 2 -3 4', '1\n5', '2\n-7 -7'],
  lambda r: seq(r), why=lambda s: 'x < 0.')
P('w4eA-7', 'Аз n то 1 бо вергул', 'Адади n. Ададҳои n, n − 1, …, 1-ро бо ", " ҷудо карда чоп кунед.', 'Як адад n (1 ≤ n ≤ 1000).', 'Масалан: 3, 2, 1',
  READN + 'for (long long i = n; i >= 1; i--) {\n    cout << i;\n    if (i > 1) cout << ", ";\n}\ncout << endl;', lambda s: ', '.join(str(i) for i in range(n0(s), 0, -1)), ['3', '1', '1000'], lambda r: str(R(r, 1, 1000)),
  why=lambda s: 'Пас аз 1 вергул нест.')
P('w4eA-8', 'Росткунҷаи рақамӣ', 'Ададҳои n ва m. n сатр чоп кунед, ҳар сатр ададҳои 1 то m бе фосила (масалан, 123).', 'Як сатр: n, m (1 ≤ n ≤ 20, 1 ≤ m ≤ 9).', 'n сатр.',
  body(['n', 'm']) + 'for (long long i = 0; i < n; i++) {\n    for (long long j = 1; j <= m; j++) cout << j;\n    cout << endl;\n}', lambda s: '\n'.join(''.join(str(j) for j in range(1, nums(s)[1] + 1)) for _ in range(nums(s)[0])),
  ['2 3', '1 1', '20 9'], lambda r: f'{R(r, 1, 20)} {R(r, 1, 9)}', why=lambda s: 'Давр дар давр.')
P('w4eA-9', 'Ҷамъи мусбатҳо', 'Адади n ва n адад. Ҷамъи ададҳои мусбатро ёбед.', 'Сатри 1: n (1 ≤ n ≤ 1000). Сатри 2: n адад (|x| ≤ 10⁹).', 'Як адад.',
  SEQ + 'long long s = 0;\nfor (long long i = 0; i < n; i++) {\n    long long x;\n    cin >> x;\n    if (x > 0) s += x;\n}\ncout << s << endl;', lambda s: str(sum(x for x in arr(s) if x > 0)), ['4\n-1 2 -3 4', '1\n-5', '2\n7 7'],
  lambda r: seq(r), why=lambda s: 'Танҳо мусбатҳо.')
P('w4eA-10', 'Факториал бо модули 10⁹+7', 'Адади n. n! mod 1000000007-ро ёбед.', 'Як адад n (0 ≤ n ≤ 10⁶).', 'Як адад.',
  READN + 'long long f = 1;\nfor (long long i = 2; i <= n; i++) f = f * i % 1000000007;\ncout << f << endl;', lambda s: str(_factmod(n0(s), 10**9 + 7)), ['5', '0', '1000000'], lambda r: str(R(r, 0, 10**6)),
  why=lambda s: 'Бақияро дар ҳар қадам гиред.')

lvl('Миёна')
P('w4eB-3', 'Фарқи калон ва хурд', 'Адади n ва n адад. Фарқи калонтарин ва хурдтаринро ёбед.', 'Сатри 1: n (1 ≤ n ≤ 1000). Сатри 2: n адад (|x| ≤ 10⁹).', 'Як адад.',
  SEQ + 'long long mx = 0, mn = 0;\nfor (long long i = 0; i < n; i++) {\n    long long x;\n    cin >> x;\n    if (i == 0 || x > mx) mx = x;\n    if (i == 0 || x < mn) mn = x;\n}\ncout << mx - mn << endl;', lambda s: str(max(arr(s)) - min(arr(s))),
  ['4\n3 9 -2 5', '1\n7', '3\n4 4 4'], lambda r: seq(r), why=lambda s: 'Калонтарин − хурдтарин.')
P('w4eB-4', 'Ҷамъи содаҳо дар рӯйхат', 'Адади n ва n адад. Ҷамъи ададҳои содаро ёбед.', 'Сатри 1: n (1 ≤ n ≤ 100). Сатри 2: n адад (1 ≤ x ≤ 10⁶).', 'Як адад.',
  SEQ + 'long long s = 0;\nfor (long long i = 0; i < n; i++) {\n    long long x;\n    cin >> x;\n    bool p = x >= 2;\n    for (long long d = 2; d * d <= x; d++) {\n        if (x % d == 0) {\n            p = false;\n            break;\n        }\n    }\n    if (p) s += x;\n}\ncout << s << endl;',
  lambda s: str(sum(x for x in arr(s) if isprime(x))), ['5\n1 2 3 4 5', '1\n1', '3\n7 11 13'], lambda r: seq(r, 1, 100, 1, 10**6), why=lambda s: 'Ҳар ададро санҷед.')
P('w4eB-5', 'Тахтаи 0 ва 1', 'Ададҳои n ва m. Тахтаи n×m чоп кунед: дар хонае, ки i + j ҷуфт аст 1, вагарна 0 (i, j аз 1).', 'Як сатр: n, m (1 ≤ n, m ≤ 50).', 'n сатр.',
  body(['n', 'm']) + 'for (long long i = 1; i <= n; i++) {\n    for (long long j = 1; j <= m; j++) {\n        if ((i + j) % 2 == 0) cout << 1;\n        else cout << 0;\n    }\n    cout << endl;\n}',
  lambda s: '\n'.join(''.join('1' if (i + j) % 2 == 0 else '0' for j in range(1, nums(s)[1] + 1)) for i in range(1, nums(s)[0] + 1)), ['2 3', '1 1', '50 50'], lambda r: rn(r, 2, 1, 50), why=lambda s: '(i + j) % 2.')
P('w4eB-6', 'Калонтарин чанд бор', 'Адади n ва n адад. Калонтарин чанд бор омадааст?', 'Сатри 1: n (1 ≤ n ≤ 1000). Сатри 2: n адад.', 'Як адад.',
  SEQ + 'long long mx = 0, c = 0;\nfor (long long i = 0; i < n; i++) {\n    long long x;\n    cin >> x;\n    if (i == 0 || x > mx) {\n        mx = x;\n        c = 1;\n    } else if (x == mx) {\n        c++;\n    }\n}\ncout << c << endl;',
  lambda s: str(arr(s).count(max(arr(s)))), ['5\n3 9 2 9 1', '1\n4', '3\n5 5 5'], lambda r: seq(r, 1, 20, -3, 3), why=lambda s: 'Калонтари нав — аз 1.')
P('w4eB-7', 'Ҷамъи (i−1)·i', 'Адади n. 1·2 + 2·3 + … + (n − 1)·n-ро ёбед (барои n = 1 — 0).', 'Як адад n (1 ≤ n ≤ 10⁵).', 'Як адад.',
  READN + 'long long s = 0;\nfor (long long i = 2; i <= n; i++) s += (i - 1) * i;\ncout << s << endl;', lambda s: str(sum((i - 1) * i for i in range(2, n0(s) + 1))), ['3', '1', '100000'], lambda r: str(R(r, 1, 10**5)),
  why=lambda s: '2 + 6 + …')
P('w4eB-8', 'Шумораи ҳамаи рақамҳо', 'Адади n. Барои навиштани ҳамаи ададҳо аз 1 то n чанд рақам лозим аст?', 'Як адад n (1 ≤ n ≤ 10⁶).', 'Як адад.',
  READN + 'long long c = 0;\nfor (long long i = 1; i <= n; i++) {\n    for (long long m = i; m > 0; m /= 10) c++;\n}\ncout << c << endl;', lambda s: str(sum(len(str(i)) for i in range(1, n0(s) + 1))), ['12', '1', '1000000'],
  lambda r: str(R(r, 1, 10**6)), why=lambda s: 'Барои 12: 9 + 3·2 = 15.')
P('w4eB-9', 'Ҷуфтҳо бо зарби хурд', 'Адади n. Чанд ҷуфти (i, j) ҳаст, ки 1 ≤ i < j ва i · j ≤ n?', 'Як адад n (1 ≤ n ≤ 10⁵).', 'Як адад.',
  READN + 'long long c = 0;\nfor (long long i = 1; i * (i + 1) <= n; i++) {\n    for (long long j = i + 1; i * j <= n; j++) c++;\n}\ncout << c << endl;',
  lambda s: str(sum(max(0, n0(s) // i - i) for i in range(1, math.isqrt(n0(s)) + 1))), ['6', '1', '100000'], lambda r: str(R(r, 1, 10**5)), why=lambda s: 'Барои 6: (1,2) (1,3) (1,4) (1,5) (1,6) (2,3).')
P('w4eB-10', 'Секунҷаи Флойд', 'Адади n. n сатр чоп кунед: сатри 1 — 1, сатри 2 — 2 3, сатри 3 — 4 5 6 ва ғайра.', 'Як адад n (1 ≤ n ≤ 50).', 'n сатр.',
  READN + 'long long k = 1;\nfor (long long i = 1; i <= n; i++) {\n    for (long long j = 1; j <= i; j++) {\n        cout << k;\n        if (j < i) cout << " ";\n        k++;\n    }\n    cout << endl;\n}',
  lambda s: '\n'.join(' '.join(str(i * (i - 1) // 2 + j) for j in range(1, i + 1)) for i in range(1, n0(s) + 1)), ['4', '1', '50'], lambda r: str(R(r, 1, 50)), why=lambda s: 'Ҳисобкунак дар берун аз давр.')

lvl('Душвор')
P('w4eX-2', 'Квадрати сеҳрнок', 'Ҷадвали 3×3 (9 адад, сатр ба сатр). Агар ҷамъи ҳар сатр, ҳар сутун ва ду диагонал баробар бошад YES, вагарна NO.', 'Се сатр, дар ҳар кадом 3 адад (|x| ≤ 10⁶).', 'YES ё NO.',
  'long long a[3][3];\nfor (int i = 0; i < 3; i++)\n    for (int j = 0; j < 3; j++) cin >> a[i][j];\nlong long t = a[0][0] + a[1][1] + a[2][2];\nbool ok = (a[0][2] + a[1][1] + a[2][0] == t);\nfor (int i = 0; i < 3; i++) {\n    long long r = 0, c = 0;\n    for (int j = 0; j < 3; j++) {\n        r += a[i][j];\n        c += a[j][i];\n    }\n    if (r != t || c != t) ok = false;\n}\nif (ok) cout << "YES";\nelse cout << "NO";\ncout << endl;',
  lambda s: yn(_magic(nums(s))), ['2 7 6\n9 5 1\n4 3 8', '1 2 3\n4 5 6\n7 8 9', '5 5 5\n5 5 5\n5 5 5', '8 1 6\n3 5 7\n4 9 2'],
  lambda r: r.choice([rn(r, 9, 1, 3), '4 9 2\n3 5 7\n8 1 6', '6 1 8\n7 5 3\n2 9 4', '2 9 4\n7 5 3\n6 1 8']), why=lambda s: 'Ҳашт ҷамъ бояд баробар бошанд.')
P('w4eX-3', 'Ададҳои Армстронг то n', 'Адади n. Ҳамаи ададҳои Армстронгро аз 1 то n бо фосила чоп кунед (153 = 1³ + 5³ + 3³).', 'Як адад n (1 ≤ n ≤ 10⁶).', 'Ададҳо.',
  READN + 'bool first = true;\nfor (long long x = 1; x <= n; x++) {\n    long long k = 0;\n    for (long long m = x; m > 0; m /= 10) k++;\n    long long s = 0;\n    for (long long m = x; m > 0; m /= 10) {\n        long long d = m % 10, p = 1;\n        for (long long i = 0; i < k; i++) p *= d;\n        s += p;\n    }\n    if (s == x) {\n        if (!first) cout << " ";\n        cout << x;\n        first = false;\n    }\n}\ncout << endl;',
  lambda s: ' '.join(str(x) for x in (1, 2, 3, 4, 5, 6, 7, 8, 9, 153, 370, 371, 407, 1634, 8208, 9474, 54748, 92727, 93084, 548834) if x <= n0(s)), ['200', '1', '1000000', '10000'],
  lambda r: str(R(r, 1, 10**6)), why=lambda s: 'Барои ҳар адад санҷед.')
P('w4eX-4', 'Рақамҳои гуногун то n', 'Адади n. Аз 1 то n чанд адад ҳамаи рақамҳояш гуногун аст?', 'Як адад n (1 ≤ n ≤ 10⁵).', 'Як адад.',
  READN + 'long long c = 0;\nfor (long long x = 1; x <= n; x++) {\n    int used[10] = {0};\n    bool ok = true;\n    for (long long m = x; m > 0; m /= 10) {\n        if (used[m % 10]) ok = false;\n        used[m % 10] = 1;\n    }\n    if (ok) c++;\n}\ncout << c << endl;',
  lambda s: str(sum(1 for x in range(1, n0(s) + 1) if len(set(str(x))) == len(str(x)))), ['20', '1', '100000'], lambda r: str(R(r, 1, 10**5)), why=lambda s: 'Барои 20: ғайр аз 11 — 19 адад.')
P('w4eX-5', 'Сатри Паскал', 'Адади n. Сатри n-уми секунҷаи Паскалро (C(n, 0) … C(n, n)) бо фосила чоп кунед.', 'Як адад n (0 ≤ n ≤ 60).', 'n + 1 адад.',
  READN + 'long long c = 1;\nfor (long long k = 0; k <= n; k++) {\n    if (k > 0) cout << " ";\n    cout << c;\n    if (k < n) c = c / (k + 1) * (n - k) + c % (k + 1) * (n - k) / (k + 1);\n}\ncout << endl;',
  lambda s: ' '.join(str(math.comb(n0(s), k)) for k in range(n0(s) + 1)), ['4', '0', '60', '1'] + [str(i) for i in (5, 10, 25, 33, 48, 59)], why=lambda s: '1 4 6 4 1')
P('w4eX-6', 'Қисмати афзояндаи дарозтарин', 'Адади n ва n адад. Дарозии қисмати пайвастаи қатъиян афзояндаи дарозтарин ва ҷамъи онро чоп кунед (агар чанд бошад — аввалинашро).', 'Сатри 1: n (1 ≤ n ≤ 1000). Сатри 2: n адад (|x| ≤ 10⁶).', 'Ду адад.',
  SEQ + 'long long prev = 0, len = 0, sum = 0, bl = 0, bs = 0;\nfor (long long i = 0; i < n; i++) {\n    long long x;\n    cin >> x;\n    if (i > 0 && x > prev) {\n        len++;\n        sum += x;\n    } else {\n        len = 1;\n        sum = x;\n    }\n    if (len > bl) {\n        bl = len;\n        bs = sum;\n    }\n    prev = x;\n}\ncout << bl << " " << bs << endl;',
  lambda s: '{} {}'.format(*_incrun(arr(s))), ['6\n1 2 3 1 5 6', '1\n7', '5\n5 4 3 2 1', '6\n1 2 1 2 3 0'], lambda r: seq(r, 1, 30, -10, 10), why=lambda s: 'Дарозӣ ва ҷамъи ҷорӣ.')
P('w4eX-7', 'Ададҳои қадамӣ', 'Адади n. Адади қадамӣ — ҳар ду рақами ҳамсояаш 1 фарқ доранд (масалан, 123, 321, 101). Аз 1 то n чанд адади қадамӣ ҳаст? (Ададҳои якрақама ҳам ҳисоб.)', 'Як адад n (1 ≤ n ≤ 10⁶).', 'Як адад.',
  READN + 'long long c = 0;\nfor (long long x = 1; x <= n; x++) {\n    bool ok = true;\n    for (long long m = x; m >= 10; m /= 10) {\n        long long a = m % 10, b = m / 10 % 10;\n        if (a - b != 1 && b - a != 1) ok = false;\n    }\n    if (ok) c++;\n}\ncout << c << endl;',
  lambda s: str(sum(1 for x in range(1, n0(s) + 1) if all(abs(int(a) - int(b)) == 1 for a, b in zip(str(x), str(x)[1:])))), ['20', '9', '1000000'], lambda r: str(R(r, 1, 2 * 10**5)),
  why=lambda s: 'Барои 20: 1–9, 10, 12 — 11 адад.')
P('w4eX-8', 'Гипотезаи Голдбах', 'Адади ҷуфти n (n ≥ 4). Онро ҳамчун ҷамъи ду адади сода p + q (p ≤ q) нависед; ҷуфтеро чоп кунед, ки p хурдтарин аст.', 'Як адади ҷуфт n (4 ≤ n ≤ 10⁶).', 'Ду адад: p ва q.',
  READN + 'for (long long p = 2; p <= n / 2; p++) {\n    bool a = true, b = true;\n    for (long long d = 2; d * d <= p; d++) if (p % d == 0) a = false;\n    for (long long d = 2; d * d <= n - p; d++) if ((n - p) % d == 0) b = false;\n    if (a && b) {\n        cout << p << " " << n - p << endl;\n        break;\n    }\n}',
  lambda s: (lambda n: (lambda p: f'{p} {n - p}')(next(p for p in range(2, n // 2 + 1) if isprime(p) and isprime(n - p))))(n0(s)), ['10', '4', '1000000', '28'], lambda r: str(2 * R(r, 2, 5 * 10**5)),
  why=lambda s: 'Аз p = 2 сар кунед.')
P('w4eX-9', 'Ҳаракатҳои асп', 'Тахтаи n×n ва асп дар хонаи (x, y). Асп бо як ҳаракат ба чанд хона рафта метавонад?', 'Як сатр: n, x, y (1 ≤ x, y ≤ n ≤ 10⁹).', 'Як адад аз 0 то 8.',
  body(['n', 'x', 'y']) + 'long long c = 0;\nfor (long long dx = -2; dx <= 2; dx++) {\n    for (long long dy = -2; dy <= 2; dy++) {\n        if (dx * dx + dy * dy == 5) {\n            long long a = x + dx, b = y + dy;\n            if (a >= 1 && a <= n && b >= 1 && b <= n) c++;\n        }\n    }\n}\ncout << c << endl;',
  lambda s: (lambda n, x, y: str(sum(1 for dx in range(-2, 3) for dy in range(-2, 3) if dx * dx + dy * dy == 5 and 1 <= x + dx <= n and 1 <= y + dy <= n)))(*nums(s)), ['8 1 1', '8 4 4', '1 1 1', '3 2 2'],
  lambda r: (lambda n: f'{n} {R(r, 1, n)} {R(r, 1, n)}')(r.choice([R(r, 1, 10), 8, R(r, 1, 10**9)])), why=lambda s: 'Ҳамаи 8 ҳаракатро санҷед.')
P('w4eX-10', 'Ҳарфи Z', 'Адади n. Квадрати n×n чоп кунед: сатри аввал ва охир пурра «*», дар сатрҳои дигар «*» танҳо дар диагонали баръакс (i + j = n − 1), дигар ҷойҳо «.».', 'Як адад n (1 ≤ n ≤ 50).', 'n сатр.',
  READN + 'for (long long i = 0; i < n; i++) {\n    for (long long j = 0; j < n; j++) {\n        if (i == 0 || i == n - 1 || i + j == n - 1) cout << "*";\n        else cout << ".";\n    }\n    cout << endl;\n}',
  lambda s: '\n'.join(''.join('*' if i in (0, n0(s) - 1) or i + j == n0(s) - 1 else '.' for j in range(n0(s))) for i in range(n0(s))), ['4', '1', '50'], lambda r: str(R(r, 1, 50)), why=lambda s: 'Се шарт бо ||.')
exam_order(4)
lvl(None)

# ───────── Ёрирасонҳои Python (ҳалли мустақил) ─────────
def _comp(s, p, n):
    for _ in range(n): s = s + s * p // 100
    return s
def _fibmod(n, m):
    a, b = 0, 1 % m
    for _ in range(n): a, b = b, (a + b) % m
    return a
def _leg(n, p):
    c, q = 0, p
    while q <= n:
        c += n // q; q *= p
    return c
def _factmod(n, m):
    f = 1 % m
    for i in range(2, n + 1): f = f * i % m
    return f
def _kadane(v):
    best = cur = v[0]
    for x in v[1:]:
        cur = max(x, cur + x); best = max(best, cur)
    return best
def _incrun(v):
    bl, bs, l, s = 1, v[0], 1, v[0]
    for a, b in zip(v, v[1:]):
        if b > a: l += 1; s += b
        else: l, s = 1, b
        if l > bl: bl, bs = l, s
    return bl, bs
def _magic(v):
    a = [v[0:3], v[3:6], v[6:9]]
    t = a[0][0] + a[1][1] + a[2][2]
    lines = [sum(r) for r in a] + [sum(a[i][j] for i in range(3)) for j in range(3)] + [a[0][2] + a[1][1] + a[2][0]]
    return all(x == t for x in lines)
