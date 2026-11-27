# Ҳафтаи 4: даври for
from lib import *
R = lambda r, a, b: r.randint(a, b)
def body(names):
    return 'long long ' + ', '.join(names) + ';\ncin >> ' + ' >> '.join(names) + ';\n'
def seq(r, n_lo=1, n_hi=20, lo=-1000, hi=1000):
    n = R(r, n_lo, n_hi)
    return f'{n}\n' + ' '.join(str(R(r, lo, hi)) for _ in range(n))
def arr(s): v = nums(s); return v[1:1 + v[0]]

H1 = ['for (int i = 1; i <= n; i++) { ... }', 'Ҷамъро пеш аз давр 0 кунед: long long s = 0;', 'Ададҳоро бо фосила чоп кунед; фосилаи охир зарур нест.']
day(4, 1, 'Ҳисоб бо for', 'loops', H1)
P('w4d1-1', 'Аз 1 то n', 'Адади n. Ададҳои 1, 2, …, n-ро бо фосила чоп кунед.', 'Як адад n (1 ≤ n ≤ 1000).', 'Ададҳо бо фосила.',
  body(['n']) + 'for (int i = 1; i <= n; i++) {\n    cout << i;\n    if (i < n) cout << " ";\n}\ncout << endl;', lambda s: ' '.join(str(i) for i in range(1, nums(s)[0] + 1)), ['5', '1', '1000'], lambda r: str(R(r,1,1000)), why=lambda s: '1 2 3 …')
P('w4d1-2', 'Ҷамъи 1 то n', 'Адади n. Ҷамъи 1 + 2 + … + n-ро бо давр ёбед.', 'Як адад n (1 ≤ n ≤ 10⁶).', 'Як адад.',
  body(['n']) + 'long long s = 0;\nfor (long long i = 1; i <= n; i++) s += i;\ncout << s << endl;', lambda s: str(nums(s)[0] * (nums(s)[0] + 1) // 2), ['5', '1', '1000000'], lambda r: str(R(r,1,10**6)),
  why=lambda s: f'1 + … + {s.strip()}')
P('w4d1-3', 'Аз n то 1', 'Адади n. Ададҳои n, n−1, …, 1-ро бо фосила чоп кунед.', 'Як адад n (1 ≤ n ≤ 1000).', 'Ададҳо бо фосила.',
  body(['n']) + 'for (long long i = n; i >= 1; i--) {\n    cout << i;\n    if (i > 1) cout << " ";\n}\ncout << endl;', lambda s: ' '.join(str(i) for i in range(nums(s)[0], 0, -1)), ['5', '1', '1000'], lambda r: str(R(r,1,1000)), why=lambda s: 'i-- кам мекунад.')
P('w4d1-4', 'Ҷамъи ҷуфтҳо', 'Адади n. Ҷамъи ададҳои ҷуфти аз 1 то n-ро ёбед.', 'Як адад n (1 ≤ n ≤ 10⁶).', 'Як адад.',
  body(['n']) + 'long long s = 0;\nfor (long long i = 2; i <= n; i += 2) s += i;\ncout << s << endl;', lambda s: str(sum(range(2, nums(s)[0] + 1, 2))), ['10', '1', '7', '1000000'], lambda r: str(R(r,1,10**6)), why=lambda s: '2 + 4 + …')
P('w4d1-5', 'Факториал', 'Адади n. n! = 1·2·…·n-ро ёбед.', 'Як адад n (0 ≤ n ≤ 20).', 'Як адад.',
  body(['n']) + 'long long f = 1;\nfor (long long i = 2; i <= n; i++) f *= i;\ncout << f << endl;', lambda s: str(__import__('math').factorial(nums(s)[0])), [str(i) for i in [5, 0, 1, 20, 10, 3]], why=lambda s: '0! = 1.')
P('w4d1-6', 'Аз a то b', 'Ададҳои a ва b (a ≤ b). Ададҳои аз a то b-ро бо фосила чоп кунед.', 'Як сатр: a, b (|a|, |b| ≤ 10⁹, b − a ≤ 1000).', 'Ададҳо.',
  body(['a', 'b']) + 'for (long long i = a; i <= b; i++) {\n    cout << i;\n    if (i < b) cout << " ";\n}\ncout << endl;', lambda s: ' '.join(str(i) for i in range(nums(s)[0], nums(s)[1] + 1)),
  ['3 7', '5 5', '-2 2'], lambda r: (lambda a: f'{a} {a + R(r,0,1000)}')(R(r,-10**9,10**9 - 1000)), why=lambda s: 'Аз a сар карда.')
P('w4d1-7', 'Ҷамъи a то b', 'Ададҳои a ва b (a ≤ b). Ҷамъи ҳамаи ададҳои бутун аз a то b-ро ёбед.', 'Як сатр: a, b (|a|, |b| ≤ 10⁶).', 'Як адад.',
  body(['a', 'b']) + 'long long s = 0;\nfor (long long i = a; i <= b; i++) s += i;\ncout << s << endl;', lambda s: str(sum(range(nums(s)[0], nums(s)[1] + 1))), ['3 7', '5 5', '-3 3'],
  lambda r: (lambda a: f'{a} {R(r,a,10**6)}')(R(r,-10**6,10**6)), why=lambda s: 'Ҳамаи ададҳо аз a то b.')
P('w4d1-8', 'Каратиҳои k', 'Ададҳои n ва k. Аз 1 то n чанд адад ба k тақсим мешавад? Бо давр ҳисоб кунед.', 'Як сатр: n, k (1 ≤ n ≤ 10⁶, 1 ≤ k ≤ 10⁶).', 'Як адад.',
  body(['n', 'k']) + 'long long cnt = 0;\nfor (long long i = 1; i <= n; i++) {\n    if (i % k == 0) cnt++;\n}\ncout << cnt << endl;', lambda s: str(nums(s)[0] // nums(s)[1]), ['10 3', '5 7', '1000000 1'],
  lambda r: f'{R(r,1,10**6)} {R(r,1,1000)}', why=lambda s: 'i % k == 0.')
P('w4d1-9', 'Ҷамъи квадратҳо', 'Адади n. 1² + 2² + … + n²-ро ёбед.', 'Як адад n (1 ≤ n ≤ 10⁶).', 'Як адад.',
  body(['n']) + 'long long s = 0;\nfor (long long i = 1; i <= n; i++) s += i * i;\ncout << s << endl;', lambda s: (lambda n: str(n * (n + 1) * (2 * n + 1) // 6))(nums(s)[0]), ['3', '1', '1000000'], lambda r: str(R(r,1,10**6)),
  why=lambda s: '1 + 4 + 9 + …')
P('w4d1-10', 'Қадам k', 'Ададҳои n ва k. Ададҳои 0, k, 2k, …, ки аз n калон нестанд, бо фосила чоп кунед.', 'Як сатр: n, k (0 ≤ n ≤ 10⁶, 1 ≤ k ≤ 10⁶, на зиёда аз 1000 адад).', 'Ададҳо.',
  body(['n', 'k']) + 'for (long long i = 0; i <= n; i += k) {\n    if (i > 0) cout << " ";\n    cout << i;\n}\ncout << endl;', lambda s: ' '.join(str(i) for i in range(0, nums(s)[0] + 1, nums(s)[1])),
  ['10 3', '0 5', '20 5'], lambda r: (lambda k: f'{R(r,0,k*999)} {k}')(R(r,1,1000)), why=lambda s: 'i += k.')

H2 = ['Ҷадвал: for (int i = 1; i <= 10; i++) cout << ... << endl;', 'Ҳар сатр — як такрори давр.', 'Шаклро айнан мисли намуна чоп кунед (фосилаҳо!).']
day(4, 2, 'Ҷадвалҳо', 'loops', H2)
P('w4d2-1', 'Ҷадвали зарб', 'Адади n. Ҷадвали зарбро барои i = 1…10 дар шакли «n x i = натиҷа» чоп кунед.', 'Як адад n (|n| ≤ 10⁶).', '10 сатр.',
  body(['n']) + 'for (int i = 1; i <= 10; i++) {\n    cout << n << " x " << i << " = " << n * i << endl;\n}', lambda s: '\n'.join(f'{nums(s)[0]} x {i} = {nums(s)[0]*i}' for i in range(1, 11)), ['7', '1', '0', '-3'],
  lambda r: str(R(r,-10**6,10**6)), why=lambda s: 'Ҳар сатр як зарб.')
P('w4d2-2', 'Ададҳои тоқ', 'Адади n. Ҳамаи ададҳои тоқи аз 1 то n-ро бо фосила чоп кунед.', 'Як адад n (1 ≤ n ≤ 2000).', 'Ададҳо.',
  body(['n']) + 'for (long long i = 1; i <= n; i += 2) {\n    if (i > 1) cout << " ";\n    cout << i;\n}\ncout << endl;', lambda s: ' '.join(str(i) for i in range(1, nums(s)[0] + 1, 2)), ['10', '1', '7'], lambda r: str(R(r,1,2000)),
  why=lambda s: '1 3 5 …')
P('w4d2-3', 'Дараҷаҳои 2 то n', 'Адади n. 2⁰, 2¹, …, 2ⁿ-ро бо фосила чоп кунед.', 'Як адад n (0 ≤ n ≤ 62).', 'Ададҳо.',
  body(['n']) + 'long long p = 1;\nfor (int i = 0; i <= n; i++) {\n    if (i > 0) cout << " ";\n    cout << p;\n    p *= 2;\n}\ncout << endl;', lambda s: ' '.join(str(1 << i) for i in range(nums(s)[0] + 1)), ['5', '0', '62'],
  lambda r: str(R(r,0,62)), why=lambda s: 'Ҳар дафъа дучанд.')
P('w4d2-4', 'Ҷадвали квадратҳо', 'Адади n. Барои i = 1…n сатри «i i²» чоп кунед.', 'Як адад n (1 ≤ n ≤ 1000).', 'n сатр.',
  body(['n']) + 'for (long long i = 1; i <= n; i++) {\n    cout << i << " " << i * i << endl;\n}', lambda s: '\n'.join(f'{i} {i*i}' for i in range(1, nums(s)[0] + 1)), ['3', '1', '10'], lambda r: str(R(r,1,1000)), why=lambda s: 'i ва i·i.')
P('w4d2-5', 'Ба 3 ё ба 5', 'Адади n. Ададҳои аз 1 то n-ро, ки ба 3 ё ба 5 тақсим мешаванд, бо фосила чоп кунед. Агар набошад, 0 чоп кунед.', 'Як адад n (1 ≤ n ≤ 3000).', 'Ададҳо.',
  body(['n']) + 'bool any = false;\nfor (long long i = 1; i <= n; i++) {\n    if (i % 3 == 0 || i % 5 == 0) {\n        if (any) cout << " ";\n        cout << i;\n        any = true;\n    }\n}\nif (!any) cout << 0;\ncout << endl;',
  lambda s: ' '.join(str(i) for i in range(1, nums(s)[0] + 1) if i % 3 == 0 or i % 5 == 0) or '0', ['15', '2', '3'], lambda r: str(R(r,1,3000)), why=lambda s: 'Шарти ||.')
P('w4d2-6', 'Ҷамъи алоҳидашаванда', 'Адади n. 1 − 2 + 3 − 4 + … ± n-ро ёбед.', 'Як адад n (1 ≤ n ≤ 10⁶).', 'Як адад.',
  body(['n']) + 'long long s = 0;\nfor (long long i = 1; i <= n; i++) {\n    if (i % 2 == 1) s += i;\n    else s -= i;\n}\ncout << s << endl;', lambda s: (lambda n: str((n + 1) // 2 if n % 2 else -(n // 2)))(nums(s)[0]),
  ['4', '1', '5', '1000000'], lambda r: str(R(r,1,10**6)), why=lambda s: 'Тоқҳо +, ҷуфтҳо −.')
P('w4d2-7', 'Ҷамъи рақамҳои 1 то n', 'Адади n. Ҷамъи рақамҳои ҳамаи ададҳои аз 1 то n-ро ёбед.', 'Як адад n (1 ≤ n ≤ 10⁶).', 'Як адад.',
  body(['n']) + 'long long s = 0;\nfor (long long i = 1; i <= n; i++) {\n    long long x = i;\n    while (x > 0) {\n        s += x % 10;\n        x /= 10;\n    }\n}\ncout << s << endl;',
  lambda s: str(sum(sum(map(int, str(i))) for i in range(1, nums(s)[0] + 1))), ['12', '1', '9', '1000000'], lambda r: str(R(r,1,10**5)), why=lambda s: 'Давр дар давр.')
P('w4d2-8', 'Тоқҳо дар фосила', 'Ададҳои a ва b (a ≤ b). Чанд адади тоқ дар [a, b] ҳаст?', 'Як сатр: a, b (|a|, |b| ≤ 10⁶).', 'Як адад.',
  body(['a', 'b']) + 'long long cnt = 0;\nfor (long long i = a; i <= b; i++) {\n    if (i % 2 != 0) cnt++;\n}\ncout << cnt << endl;', lambda s: str(sum(1 for i in range(nums(s)[0], nums(s)[1] + 1) if i % 2)),
  ['1 10', '2 2', '-3 3'], lambda r: (lambda a: f'{a} {R(r,a,10**6)}')(R(r,-10**6,10**6)), why=lambda s: 'i % 2 != 0 (барои манфӣ ҳам).')
P('w4d2-9', 'Миёнаи 1 то n', 'Адади n. Қисми бутуни миёнаи арифметикии 1, 2, …, n-ро бо давр ёбед.', 'Як адад n (1 ≤ n ≤ 10⁶).', 'Як адад.',
  body(['n']) + 'long long s = 0;\nfor (long long i = 1; i <= n; i++) s += i;\ncout << s / n << endl;', lambda s: (lambda n: str(n * (n + 1) // 2 // n))(nums(s)[0]), ['4', '1', '5'], lambda r: str(R(r,1,10**6)), why=lambda s: 'Ҷамъ / n.')
P('w4d2-10', 'Сатри ситораҳо', 'Адади n. n ситора (*) бе фосила дар як сатр чоп кунед.', 'Як адад n (1 ≤ n ≤ 1000).', 'Як сатр.',
  body(['n']) + 'for (int i = 0; i < n; i++) cout << "*";\ncout << endl;', lambda s: '*' * nums(s)[0], ['5', '1', '1000'], lambda r: str(R(r,1,1000)), why=lambda s: 'n бор «*».')

H3 = ['Натиҷаро дар тағйирёбанда ҷамъ кунед ва баъд аз давр чоп кунед.', 'Барои ададҳои калон long long.', 'Давр дар давр: даври дохилӣ барои ҳар i аз нав сар мешавад.']
day(4, 3, 'Формулаҳо бо for', 'loops', H3)
P('w4d3-1', 'Дараҷа бо for', 'Ададҳои a ва b. aᵇ-ро бо даври for ҳисоб кунед (натиҷа ≤ 10¹⁸).', 'Як сатр: a, b (0 ≤ b ≤ 62).', 'Як адад.',
  body(['a', 'b']) + 'long long p = 1;\nfor (long long i = 0; i < b; i++) p *= a;\ncout << p << endl;', lambda s: str(nums(s)[0] ** nums(s)[1]), ['3 4', '7 0', '2 62', '-2 5'],
  lambda r: (lambda a: f'{a} {R(r,0, max(1, int(17 / __import__("math").log10(max(2, abs(a))))))}')(R(r,-30,30)), why=lambda s: 'b бор зарб.')
P('w4d3-2', 'Фибоначчии n-ум', 'Адади n. n-умин адади Фибоначчиро ёбед (F₁ = F₂ = 1).', 'Як адад n (1 ≤ n ≤ 90).', 'Як адад.',
  body(['n']) + 'long long a = 1, b = 1;\nfor (long long i = 3; i <= n; i++) {\n    long long c = a + b;\n    a = b;\n    b = c;\n}\ncout << b << endl;', lambda s: str(fib(nums(s)[0])), [str(i) for i in [6, 1, 2, 90, 10, 50]], why=lambda s: 'F(n) = F(n−1) + F(n−2).')
def fib(n):
    a, b = 1, 1
    for _ in range(n - 2): a, b = b, a + b
    return b
PROBLEMS[-1]['py'] = lambda s: str(fib(nums(s)[0]))
P('w4d3-3', 'Ҷамъи тоқҳои аввал', 'Адади n. Ҷамъи n адади тоқи аввал (1 + 3 + 5 + …)-ро ёбед.', 'Як адад n (1 ≤ n ≤ 10⁶).', 'Як адад.',
  body(['n']) + 'long long s = 0;\nfor (long long i = 0; i < n; i++) s += 2 * i + 1;\ncout << s << endl;', lambda s: str(nums(s)[0] ** 2), ['3', '1', '1000000'], lambda r: str(R(r,1,10**6)), why=lambda s: '1 + 3 + 5 …')
P('w4d3-4', 'Ҷамъи каратиҳои 7', 'Адади n. Ҷамъи ададҳои аз 1 то n, ки ба 7 тақсим мешаванд.', 'Як адад n (1 ≤ n ≤ 10⁶).', 'Як адад.',
  body(['n']) + 'long long s = 0;\nfor (long long i = 7; i <= n; i += 7) s += i;\ncout << s << endl;', lambda s: str(sum(range(7, nums(s)[0] + 1, 7))), ['20', '6', '7', '1000000'], lambda r: str(R(r,1,10**6)), why=lambda s: '7 + 14 + …')
P('w4d3-5', 'Ҷамъи рақамҳо ҷуфт', 'Адади n. Чанд адад аз 1 то n ҷамъи рақамҳои ҷуфт дорад?', 'Як адад n (1 ≤ n ≤ 10⁶).', 'Як адад.',
  body(['n']) + 'long long cnt = 0;\nfor (long long i = 1; i <= n; i++) {\n    long long x = i, s = 0;\n    while (x > 0) {\n        s += x % 10;\n        x /= 10;\n    }\n    if (s % 2 == 0) cnt++;\n}\ncout << cnt << endl;',
  lambda s: str(sum(1 for i in range(1, nums(s)[0] + 1) if sum(map(int, str(i))) % 2 == 0)), ['20', '1', '11'], lambda r: str(R(r,1,10**5)), why=lambda s: 'Барои ҳар адад ҷамъи рақамҳо.')
P('w4d3-6', 'Ададҳои мукаммал то n', 'Адади n. Ҳамаи ададҳои мукаммалро аз 1 то n бо фосила чоп кунед. Агар набошад, 0.', 'Як адад n (1 ≤ n ≤ 10000).', 'Ададҳо.',
  body(['n']) + 'bool any = false;\nfor (long long x = 2; x <= n; x++) {\n    long long s = 1;\n    for (long long d = 2; d * d <= x; d++) {\n        if (x % d == 0) {\n            s += d;\n            if (d != x / d) s += x / d;\n        }\n    }\n    if (s == x) {\n        if (any) cout << " ";\n        cout << x;\n        any = true;\n    }\n}\nif (!any) cout << 0;\ncout << endl;',
  lambda s: ' '.join(str(x) for x in (6, 28, 496, 8128) if x <= nums(s)[0]) or '0', ['30', '5', '10000', '496'], lambda r: str(R(r,1,10000)), why=lambda s: '6, 28, 496, 8128.')
P('w4d3-7', 'Ададҳои сода то n', 'Адади n. Ҳамаи ададҳои содаи аз 2 то n-ро бо фосила чоп кунед. Агар набошад, 0.', 'Як адад n (1 ≤ n ≤ 10000).', 'Ададҳо.',
  body(['n']) + 'bool any = false;\nfor (long long x = 2; x <= n; x++) {\n    bool prime = true;\n    for (long long d = 2; d * d <= x; d++) {\n        if (x % d == 0) { prime = false; break; }\n    }\n    if (prime) {\n        if (any) cout << " ";\n        cout << x;\n        any = true;\n    }\n}\nif (!any) cout << 0;\ncout << endl;',
  lambda s: ' '.join(str(x) for x in range(2, nums(s)[0] + 1) if all(x % d for d in range(2, int(x**0.5) + 1))) or '0', ['20', '1', '2', '10000'], lambda r: str(R(r,1,10000)), why=lambda s: 'Барои ҳар x тафтиш.')
P('w4d3-8', 'Ададҳои секунҷагӣ', 'Адади n. Ҷамъи T₁ + T₂ + … + Tₙ, ки Tᵢ = 1 + 2 + … + i.', 'Як адад n (1 ≤ n ≤ 10⁵).', 'Як адад.',
  body(['n']) + 'long long s = 0, t = 0;\nfor (long long i = 1; i <= n; i++) {\n    t += i;\n    s += t;\n}\ncout << s << endl;', lambda s: (lambda n: str(n * (n + 1) * (n + 2) // 6))(nums(s)[0]), ['3', '1', '100000'], lambda r: str(R(r,1,10**5)), why=lambda s: '1 + 3 + 6 + …')
P('w4d3-9', 'Тақсимкунандаҳоро чоп кун', 'Адади n. Ҳамаи тақсимкунандаҳои онро аз хурд ба калон бо фосила чоп кунед.', 'Як адад n (1 ≤ n ≤ 10⁶).', 'Ададҳо.',
  body(['n']) + 'for (long long i = 1; i <= n; i++) {\n    if (n % i == 0) {\n        if (i > 1) cout << " ";\n        cout << i;\n    }\n}\ncout << endl;', lambda s: ' '.join(str(i) for i in range(1, nums(s)[0] + 1) if nums(s)[0] % i == 0),
  ['12', '1', '13', '1000000'], lambda r: str(R(r,1,10**6)), why=lambda s: 'n % i == 0.')
P('w4d3-10', 'Ҷамъи ададҳо бо шарт', 'Ададҳои n ва k. Ҷамъи ададҳои аз 1 то n, ки ба k тақсим намешаванд.', 'Як сатр: n, k (1 ≤ n ≤ 10⁶, 1 ≤ k ≤ 10⁶).', 'Як адад.',
  body(['n', 'k']) + 'long long s = 0;\nfor (long long i = 1; i <= n; i++) {\n    if (i % k != 0) s += i;\n}\ncout << s << endl;', lambda s: str(sum(i for i in range(1, nums(s)[0] + 1) if i % nums(s)[1])), ['10 3', '5 1', '1000000 7'],
  lambda r: f'{R(r,1,10**5)} {R(r,1,100)}', why=lambda s: 'Шарти i % k != 0.')

H4 = ['Аввал n-ро хонед, баъд дар давр n адад.', 'for (int i = 0; i < n; i++) { cin >> x; ... }', 'Калонтарин/хурдтаринро аз адади аввал оғоз кунед.']
day(4, 4, 'Пайдарпаии ададҳо', 'loops', H4)
P('w4d4-1', 'Ҷамъи n адад', 'Адади n ва баъд n адад. Ҷамъи онҳоро ёбед.', 'Сатри 1: n (1 ≤ n ≤ 10⁵). Сатри 2: n адад (|x| ≤ 10⁹).', 'Як адад.',
  body(['n']) + 'long long s = 0, x;\nfor (int i = 0; i < n; i++) {\n    cin >> x;\n    s += x;\n}\ncout << s << endl;', lambda s: str(sum(arr(s))), ['3\n1 2 3', '1\n-5', '4\n1000000000 1000000000 1000000000 1000000000'], seq, why=lambda s: 'Ҳамаро ҷамъ кунед.')
P('w4d4-2', 'Калонтарини n адад', 'n адад. Калонтаринро ёбед.', 'Сатри 1: n (1 ≤ n ≤ 10⁵). Сатри 2: n адад.', 'Як адад.',
  body(['n']) + 'long long x, mx;\ncin >> mx;\nfor (int i = 1; i < n; i++) {\n    cin >> x;\n    if (x > mx) mx = x;\n}\ncout << mx << endl;', lambda s: str(max(arr(s))), ['3\n1 5 3', '1\n-7', '3\n-1 -5 -3'], seq, why=lambda s: 'Аз адади аввал.')
P('w4d4-3', 'Хурдтарин ва ҷояш', 'n адад. Хурдтарин ва рақами тартибии аввалин бор омаданашро (аз 1) чоп кунед.', 'Сатри 1: n (1 ≤ n ≤ 10⁵). Сатри 2: n адад.', 'Ду адад.',
  body(['n']) + 'long long x, mn = 0;\nint pos = 0;\nfor (int i = 1; i <= n; i++) {\n    cin >> x;\n    if (i == 1 || x < mn) {\n        mn = x;\n        pos = i;\n    }\n}\ncout << mn << " " << pos << endl;',
  lambda s: (lambda a: f'{min(a)} {a.index(min(a)) + 1}')(arr(s)), ['4\n5 2 8 2', '1\n7', '3\n-1 -1 -2'], seq, why=lambda s: 'Танҳо агар қатъиян хурдтар бошад, ҷойро нав кунед.')
P('w4d4-4', 'Шумораи мусбатҳо', 'n адад. Чандтоаш мусбат аст?', 'Сатри 1: n. Сатри 2: n адад.', 'Як адад.',
  body(['n']) + 'long long x;\nint cnt = 0;\nfor (int i = 0; i < n; i++) {\n    cin >> x;\n    if (x > 0) cnt++;\n}\ncout << cnt << endl;', lambda s: str(sum(1 for x in arr(s) if x > 0)), ['4\n1 -2 0 5', '1\n0', '2\n-1 -1'], seq, why=lambda s: 'x > 0.')
P('w4d4-5', 'Миёнаи арифметикӣ', 'n адади мусбат. Қисми бутуни миёнаи онҳоро ёбед.', 'Сатри 1: n. Сатри 2: n адад (1 ≤ x ≤ 10⁹).', 'Як адад.',
  body(['n']) + 'long long s = 0, x;\nfor (int i = 0; i < n; i++) {\n    cin >> x;\n    s += x;\n}\ncout << s / n << endl;', lambda s: str(sum(arr(s)) // len(arr(s))), ['3\n1 2 4', '1\n7', '2\n1 2'], lambda r: seq(r, 1, 20, 1, 10**9), why=lambda s: 'Ҷамъ / n.')
P('w4d4-6', 'Шумораи ҷуфтҳо', 'n адад. Чандтоаш ҷуфт аст?', 'Сатри 1: n. Сатри 2: n адад.', 'Як адад.',
  body(['n']) + 'long long x;\nint cnt = 0;\nfor (int i = 0; i < n; i++) {\n    cin >> x;\n    if (x % 2 == 0) cnt++;\n}\ncout << cnt << endl;', lambda s: str(sum(1 for x in arr(s) if x % 2 == 0)), ['4\n1 2 0 -4', '1\n3', '2\n-1 7'], seq, why=lambda s: 'x % 2 == 0.')
P('w4d4-7', 'Ҷамъи ҷойҳои ҷуфт', 'n адад. Ҷамъи ададҳоеро, ки дар ҷойҳои ҷуфт (2, 4, 6, …) меистанд, ёбед.', 'Сатри 1: n. Сатри 2: n адад.', 'Як адад.',
  body(['n']) + 'long long s = 0, x;\nfor (int i = 1; i <= n; i++) {\n    cin >> x;\n    if (i % 2 == 0) s += x;\n}\ncout << s << endl;', lambda s: str(sum(arr(s)[1::2])), ['5\n1 2 3 4 5', '1\n9', '2\n-1 -2'], seq, why=lambda s: 'Ҷойҳо аз 1 ҳисоб мешаванд.')
P('w4d4-8', 'Калонтарини дуюм', 'n адад (ақаллан ду қимати гуногун). Калонтарин қиматро пас аз калонтарин ёбед (ададҳои такрорӣ як қимат ҳисоб мешаванд).', 'Сатри 1: n. Сатри 2: n адад.', 'Як адад.',
  body(['n']) + 'long long x, a = -4000000000000000000LL, b = -4000000000000000000LL;\nfor (int i = 0; i < n; i++) {\n    cin >> x;\n    if (x > a) {\n        b = a;\n        a = x;\n    } else if (x < a && x > b) {\n        b = x;\n    }\n}\ncout << b << endl;',
  lambda s: str(sorted(set(arr(s)))[-2]), ['4\n5 2 8 2', '3\n7 7 3', '2\n-1 -2', '5\n9 9 9 1 9'], lambda r: (lambda t: t if len(set(arr(t))) > 1 else '2\n1 2')(seq(r, 2, 20)), why=lambda s: 'Ду тағйирёбанда: a ва b.')
P('w4d4-9', 'Калонтар аз пешина', 'n адад. Чанд адад аз адади пеш аз худ қатъиян калонтар аст?', 'Сатри 1: n. Сатри 2: n адад.', 'Як адад.',
  body(['n']) + 'long long prev, x;\nint cnt = 0;\ncin >> prev;\nfor (int i = 1; i < n; i++) {\n    cin >> x;\n    if (x > prev) cnt++;\n    prev = x;\n}\ncout << cnt << endl;',
  lambda s: (lambda a: str(sum(1 for i in range(1, len(a)) if a[i] > a[i - 1])))(arr(s)), ['5\n1 3 2 5 5', '1\n4', '3\n3 2 1'], seq, why=lambda s: 'prev-ро нигоҳ доред.')
P('w4d4-10', 'Қисмати афзоянда', 'n адад. Дарозии калонтарин қисмати пай дар пайи қатъиян афзояндаро ёбед.', 'Сатри 1: n. Сатри 2: n адад.', 'Як адад.',
  body(['n']) + 'long long prev, x;\nint cur = 1, best = 1;\ncin >> prev;\nfor (int i = 1; i < n; i++) {\n    cin >> x;\n    if (x > prev) cur++;\n    else cur = 1;\n    if (cur > best) best = cur;\n    prev = x;\n}\ncout << best << endl;',
  lambda s: str(longest_inc(arr(s))), ['6\n1 2 3 1 2 0', '1\n5', '4\n4 3 2 1', '5\n1 2 3 4 5'], seq, why=lambda s: 'Дарозии ҷорӣ ва беҳтарин.')
def longest_inc(a):
    best = cur = 1
    for i in range(1, len(a)):
        cur = cur + 1 if a[i] > a[i - 1] else 1
        best = max(best, cur)
    return best
PROBLEMS[-1]['py'] = lambda s: str(longest_inc(arr(s)))

H5 = ['Давр дар давр: for (i …) { for (j …) { … } cout << endl; }', 'Даври берунӣ — сатрҳо, даври дохилӣ — аломатҳо дар сатр.', 'Шаклро дар коғаз кашед ва ҳисоб кунед, ки дар сатри i чанд аломат аст.']
day(4, 5, 'Давр дар давр', 'loops', H5)
P('w4d5-1', 'Квадрати ситорагӣ', 'Адади n. Квадрати n×n аз ситораҳо чоп кунед.', 'Як адад n (1 ≤ n ≤ 100).', 'n сатр.',
  body(['n']) + 'for (int i = 0; i < n; i++) {\n    for (int j = 0; j < n; j++) cout << "*";\n    cout << endl;\n}', lambda s: '\n'.join('*' * nums(s)[0] for _ in range(nums(s)[0])), ['3', '1', '100'], lambda r: str(R(r,1,100)), why=lambda s: 'n сатр, ҳар кадом n ситора.')
P('w4d5-2', 'Секунҷаи ситорагӣ', 'Адади n. Дар сатри i (1…n) i ситора чоп кунед.', 'Як адад n (1 ≤ n ≤ 100).', 'n сатр.',
  body(['n']) + 'for (int i = 1; i <= n; i++) {\n    for (int j = 0; j < i; j++) cout << "*";\n    cout << endl;\n}', lambda s: '\n'.join('*' * i for i in range(1, nums(s)[0] + 1)), ['3', '1', '100'], lambda r: str(R(r,1,100)), why=lambda s: 'Сатри i — i ситора.')
P('w4d5-3', 'Ҷадвали зарби n×n', 'Адади n. Ҷадвали зарби n×n чоп кунед: дар сатри i ададҳои i·1, i·2, …, i·n бо фосила.', 'Як адад n (1 ≤ n ≤ 50).', 'n сатр.',
  body(['n']) + 'for (int i = 1; i <= n; i++) {\n    for (int j = 1; j <= n; j++) {\n        cout << i * j;\n        if (j < n) cout << " ";\n    }\n    cout << endl;\n}', lambda s: '\n'.join(' '.join(str(i * j) for j in range(1, nums(s)[0] + 1)) for i in range(1, nums(s)[0] + 1)),
  ['3', '1', '50'], lambda r: str(R(r,1,50)), why=lambda s: 'i·j.')
P('w4d5-4', 'Секунҷаи ададӣ', 'Адади n. Дар сатри i ададҳои 1 то i-ро бо фосила чоп кунед.', 'Як адад n (1 ≤ n ≤ 100).', 'n сатр.',
  body(['n']) + 'for (int i = 1; i <= n; i++) {\n    for (int j = 1; j <= i; j++) {\n        cout << j;\n        if (j < i) cout << " ";\n    }\n    cout << endl;\n}', lambda s: '\n'.join(' '.join(str(j) for j in range(1, i + 1)) for i in range(1, nums(s)[0] + 1)),
  ['3', '1', '100'], lambda r: str(R(r,1,100)), why=lambda s: '1; 1 2; 1 2 3; …')
P('w4d5-5', 'Ҷуфтҳо бо ҷамъи k', 'n адад ва k. Чанд ҷуфти (i, j), i < j, ҳаст, ки a[i] + a[j] = k?', 'Сатри 1: n, k (1 ≤ n ≤ 1000). Сатри 2: n адад.', 'Як адад.',
  '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n;\n    long long k;\n    cin >> n >> k;\n    vector<long long> a(n);\n    for (int i = 0; i < n; i++) cin >> a[i];\n    long long cnt = 0;\n    for (int i = 0; i < n; i++)\n        for (int j = i + 1; j < n; j++)\n            if (a[i] + a[j] == k) cnt++;\n    cout << cnt << endl;\n    return 0;\n}\n',
  lambda s: (lambda v: (lambda n, k, a: str(sum(1 for i in range(n) for j in range(i + 1, n) if a[i] + a[j] == k)))(v[0], v[1], v[2:2 + v[0]]))(nums(s)),
  ['4 5\n1 4 2 3', '1 2\n1', '3 0\n0 0 0'], lambda r: (lambda n: f'{n} {R(r,-5,5)}\n' + ' '.join(str(R(r,-5,5)) for _ in range(n)))(R(r,1,300)), why=lambda s: 'Ду давр: i ва j > i.')
P('w4d5-6', 'Росткунҷаи холӣ', 'Ададҳои a (сатр) ва b (сутун). Росткунҷаи a×b-ро чоп кунед, ки танҳо канораш аз «#» ва дохилаш аз «.» аст.', 'Як сатр: a, b (1 ≤ a, b ≤ 50).', 'a сатр.',
  body(['a', 'b']) + 'for (int i = 1; i <= a; i++) {\n    for (int j = 1; j <= b; j++) {\n        if (i == 1 || i == a || j == 1 || j == b) cout << "#";\n        else cout << ".";\n    }\n    cout << endl;\n}',
  lambda s: (lambda a, b: '\n'.join(''.join('#' if i in (1, a) or j in (1, b) else '.' for j in range(1, b + 1)) for i in range(1, a + 1)))(*nums(s)), ['3 4', '1 1', '2 5', '5 3'],
  lambda r: f'{R(r,1,50)} {R(r,1,50)}', why=lambda s: 'Кавор — сатр ё сутуни аввал/охир.')
P('w4d5-7', 'Пирамида', 'Адади n. Пирамидаи n-сатра чоп кунед: дар сатри i аввал (n − i) фосила, баъд (2i − 1) ситора.', 'Як адад n (1 ≤ n ≤ 50).', 'n сатр.',
  body(['n']) + 'for (int i = 1; i <= n; i++) {\n    for (int j = 0; j < n - i; j++) cout << " ";\n    for (int j = 0; j < 2 * i - 1; j++) cout << "*";\n    cout << endl;\n}', lambda s: '\n'.join(' ' * (nums(s)[0] - i) + '*' * (2 * i - 1) for i in range(1, nums(s)[0] + 1)),
  ['3', '1', '50'], lambda r: str(R(r,1,50)), why=lambda s: 'Фосилаҳои аввал муҳиманд.')
P('w4d5-8', 'Ҳамаи ҷуфтҳо', 'Адади n. Ҳамаи ҷуфтҳои (i, j)-ро, ки 1 ≤ i < j ≤ n, ҳар кадом дар сатри алоҳида «i j» чоп кунед. Агар набошад — чизе чоп накунед.', 'Як адад n (1 ≤ n ≤ 50).', 'Сатрҳо.',
  body(['n']) + 'for (int i = 1; i <= n; i++) {\n    for (int j = i + 1; j <= n; j++) {\n        cout << i << " " << j << endl;\n    }\n}', lambda s: '\n'.join(f'{i} {j}' for i in range(1, nums(s)[0] + 1) for j in range(i + 1, nums(s)[0] + 1)),
  ['3', '2', '1', '50'], lambda r: str(R(r,1,50)), why=lambda s: 'j аз i + 1 сар мешавад.')
P('w4d5-9', 'Сегонаҳои Пифагор', 'Адади n. Чанд сегонаи a ≤ b ≤ c ≤ n ҳаст, ки a² + b² = c²?', 'Як адад n (1 ≤ n ≤ 300).', 'Як адад.',
  body(['n']) + 'long long cnt = 0;\nfor (long long a = 1; a <= n; a++)\n    for (long long b = a; b <= n; b++)\n        for (long long c = b; c <= n; c++)\n            if (a * a + b * b == c * c) cnt++;\ncout << cnt << endl;',
  lambda s: str(pyth(nums(s)[0])), ['5', '4', '13', '300'], lambda r: str(R(r,1,300)), why=lambda s: '3, 4, 5 — мисоли машҳур.')
def pyth(n):
    sq = {c * c for c in range(1, n + 1)}
    return sum(1 for a in range(1, n + 1) for b in range(a, n + 1) if a * a + b * b in sq)
PROBLEMS[-1]['py'] = lambda s: str(pyth(nums(s)[0]))
P('w4d5-10', 'Тахтаи шоҳмот', 'Адади n. Тахтаи n×n аз «#» ва «.» чоп кунед, ки хонаи чапи боло «#» аст ва рангҳо иваз мешаванд.', 'Як адад n (1 ≤ n ≤ 100).', 'n сатр.',
  body(['n']) + 'for (int i = 0; i < n; i++) {\n    for (int j = 0; j < n; j++) {\n        if ((i + j) % 2 == 0) cout << "#";\n        else cout << ".";\n    }\n    cout << endl;\n}', lambda s: '\n'.join(''.join('#' if (i + j) % 2 == 0 else '.' for j in range(nums(s)[0])) for i in range(nums(s)[0])),
  ['4', '1', '3'], lambda r: str(R(r,1,100)), why=lambda s: '(i + j) % 2.')

day(4, 6, 'Имтиҳони ҳафтаи 4', 'loops', H5, kind='exam')
P('w4e-1', 'Ҷуфтҳо дар фосила', 'Ададҳои a ва b (a ≤ b). Ҷамъи ададҳои ҷуфт дар [a, b]-ро ёбед.', 'Як сатр: a, b (|a|, |b| ≤ 10⁶).', 'Як адад.',
  body(['a', 'b']) + 'long long s = 0;\nfor (long long i = a; i <= b; i++) {\n    if (i % 2 == 0) s += i;\n}\ncout << s << endl;', lambda s: str(sum(i for i in range(nums(s)[0], nums(s)[1] + 1) if i % 2 == 0)), ['1 10', '3 3', '-4 4'],
  lambda r: (lambda a: f'{a} {R(r,a,10**6)}')(R(r,-10**6,10**6)), why=lambda s: 'Танҳо ҷуфтҳо.')
P('w4e-2', 'Шумораи содаҳо', 'Адади n. Чанд адади сода аз 2 то n ҳаст?', 'Як адад n (1 ≤ n ≤ 20000).', 'Як адад.',
  body(['n']) + 'int cnt = 0;\nfor (long long x = 2; x <= n; x++) {\n    bool prime = true;\n    for (long long d = 2; d * d <= x; d++) {\n        if (x % d == 0) { prime = false; break; }\n    }\n    if (prime) cnt++;\n}\ncout << cnt << endl;',
  lambda s: str(sum(1 for x in range(2, nums(s)[0] + 1) if all(x % d for d in range(2, int(x**0.5) + 1)))), ['10', '1', '2', '20000'], lambda r: str(R(r,1,20000)), why=lambda s: '2, 3, 5, 7, …')
P('w4e-3', 'Секунҷаи баръакс', 'Адади n. Дар сатри i (1…n) n − i + 1 ситора чоп кунед.', 'Як адад n (1 ≤ n ≤ 100).', 'n сатр.',
  body(['n']) + 'for (int i = n; i >= 1; i--) {\n    for (int j = 0; j < i; j++) cout << "*";\n    cout << endl;\n}', lambda s: '\n'.join('*' * i for i in range(nums(s)[0], 0, -1)), ['3', '1', '100'], lambda r: str(R(r,1,100)), why=lambda s: 'Аз n то 1.')
P('w4e-4', 'Фосилаи ададҳо', 'n адад. Фарқи калонтарин ва хурдтаринро ёбед.', 'Сатри 1: n (1 ≤ n ≤ 10⁵). Сатри 2: n адад (|x| ≤ 10⁹).', 'Як адад.',
  body(['n']) + 'long long x, mx, mn;\ncin >> x;\nmx = mn = x;\nfor (int i = 1; i < n; i++) {\n    cin >> x;\n    if (x > mx) mx = x;\n    if (x < mn) mn = x;\n}\ncout << mx - mn << endl;', lambda s: str(max(arr(s)) - min(arr(s))),
  ['4\n3 9 1 5', '1\n7', '3\n-1000000000 0 1000000000'], lambda r: seq(r, 1, 20, -10**9, 10**9), why=lambda s: 'max − min.')
P('w4e-5', 'Ҷадвали зарб то n', 'Адади n. Барои i = 1…n ва j = 1…n, ки i ≤ j, сатри «i x j = i·j» чоп кунед.', 'Як адад n (1 ≤ n ≤ 30).', 'Сатрҳо.',
  body(['n']) + 'for (int i = 1; i <= n; i++) {\n    for (int j = i; j <= n; j++) {\n        cout << i << " x " << j << " = " << i * j << endl;\n    }\n}', lambda s: '\n'.join(f'{i} x {j} = {i*j}' for i in range(1, nums(s)[0] + 1) for j in range(i, nums(s)[0] + 1)),
  ['3', '1', '30'], lambda r: str(R(r,1,30)), why=lambda s: 'j аз i сар мешавад.')
