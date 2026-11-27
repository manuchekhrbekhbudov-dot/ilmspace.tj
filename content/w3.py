# Ҳафтаи 3: даври while ва тақсим (рақамҳо, ТУК, тақсимкунандаҳо)
from lib import *
R = lambda r, a, b: r.randint(a, b)
def body(names):
    return 'long long ' + ', '.join(names) + ';\ncin >> ' + ' >> '.join(names) + ';\n'
def digits(n): return [int(c) for c in str(n)]
def big(r): return str(r.choice([R(r,0,9), R(r,10,999), R(r,1000,10**9), R(r,10**9,10**18)]))

H1 = ['while (n > 0) { ... n = n / 10; }', 'Рақами охирин: n % 10.', 'Адади 0 як рақам дорад — онро алоҳида фикр кунед.']
day(3, 1, 'Рақамҳои адад', 'loops', H1)
P('w3d1-1', 'Шумораи рақамҳо', 'Адади n (≥ 0). Чанд рақам дорад?', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'int cnt = 0;\ndo {\n    cnt++;\n    n /= 10;\n} while (n > 0);\ncout << cnt << endl;', lambda s: str(len(str(nums(s)[0]))), ['2025', '7', '0', '1000000000000000000'], big,
  why=lambda s: f'{s.strip()} — {len(s.strip())} рақам.')
P('w3d1-2', 'Ҷамъи рақамҳо', 'Адади n. Ҷамъи рақамҳои онро ёбед.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'long long sum = 0;\nwhile (n > 0) {\n    sum += n % 10;\n    n /= 10;\n}\ncout << sum << endl;', lambda s: str(sum(digits(nums(s)[0]))), ['2025', '7', '0', '999999999999999999'], big,
  why=lambda s: ' + '.join(s.strip()) + f' = {sum(digits(nums(s)[0]))}')
P('w3d1-3', 'Ҳосили зарби рақамҳо', 'Адади n (≥ 1). Ҳосили зарби рақамҳои онро ёбед.', 'Як адад n (1 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'long long p = 1;\nwhile (n > 0) {\n    p *= n % 10;\n    n /= 10;\n}\ncout << p << endl;',
  lambda s: str(__import__('math').prod(digits(nums(s)[0]))), ['234', '7', '105', '999999999999999999'], lambda r: str(R(r,1,10**18)), why=lambda s: ' · '.join(s.strip()))
P('w3d1-4', 'Рақами аввал', 'Адади n. Рақами аввали (чапи) онро чоп кунед.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Як рақам.',
  body(['n']) + 'while (n >= 10) {\n    n /= 10;\n}\ncout << n << endl;', lambda s: s.strip()[0], ['2025', '7', '0', '900'], big, why=lambda s: f'Рақами аввал — {s.strip()[0]}.')
P('w3d1-5', 'Рақамҳои ҷуфт', 'Адади n. Чанд рақами ҷуфт дорад? (0 ҳам ҷуфт аст)', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'int cnt = 0;\ndo {\n    if (n % 10 % 2 == 0) cnt++;\n    n /= 10;\n} while (n > 0);\ncout << cnt << endl;', lambda s: str(sum(1 for d in digits(nums(s)[0]) if d % 2 == 0)),
  ['2025', '7', '0', '13579'], big, why=lambda s: 'Ҳар рақамро ҷудо тафтиш кунед.')
P('w3d1-6', 'Рақами калонтарин', 'Адади n. Рақами калонтарини онро чоп кунед.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Як рақам.',
  body(['n']) + 'long long mx = 0;\ndo {\n    if (n % 10 > mx) mx = n % 10;\n    n /= 10;\n} while (n > 0);\ncout << mx << endl;', lambda s: str(max(digits(nums(s)[0]))), ['2025', '7', '0', '1119'], big,
  why=lambda s: f'Калонтарин — {max(s.strip())}.')
P('w3d1-7', 'Рақами d чанд бор', 'Адади n ва рақами d. Рақами d дар n чанд бор омадааст?', 'Як сатр: n, d (0 ≤ n ≤ 10¹⁸, 0 ≤ d ≤ 9).', 'Як адад.',
  body(['n', 'd']) + 'int cnt = 0;\ndo {\n    if (n % 10 == d) cnt++;\n    n /= 10;\n} while (n > 0);\ncout << cnt << endl;', lambda s: str(s.split()[0].count(s.split()[1])),
  ['2025 2', '7 3', '0 0', '1000 0'], lambda r: f'{big(r)} {R(r,0,9)}', why=lambda s: 'Ҳар рақамро бо d муқоиса кунед.')
P('w3d1-8', 'Нулҳо', 'Адади n. Чанд рақами 0 дорад?', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'int cnt = 0;\ndo {\n    if (n % 10 == 0) cnt++;\n    n /= 10;\n} while (n > 0);\ncout << cnt << endl;', lambda s: str(s.strip().count('0')), ['1005', '7', '0', '1000000000000000000'], big,
  why=lambda s: f'Нулҳо: {s.strip().count("0")}.')
P('w3d1-9', 'Рақамҳои тоқ', 'Адади n. Чанд рақами тоқ дорад?', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'int cnt = 0;\nwhile (n > 0) {\n    if (n % 10 % 2 == 1) cnt++;\n    n /= 10;\n}\ncout << cnt << endl;', lambda s: str(sum(1 for d in digits(nums(s)[0]) if d % 2)), ['2025', '7', '0', '2468'], big,
  why=lambda s: 'Тоқ: 1, 3, 5, 7, 9.')
P('w3d1-10', 'Ҷамъ ба 3', 'Адади n. Агар ҷамъи рақамҳо ба 3 тақсим шавад YES, вагарна NO.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'YES ё NO.',
  body(['n']) + 'long long s = 0;\nwhile (n > 0) {\n    s += n % 10;\n    n /= 10;\n}\nif (s % 3 == 0) cout << "YES";\nelse cout << "NO";\ncout << endl;',
  lambda s: 'YES' if sum(digits(nums(s)[0])) % 3 == 0 else 'NO', ['123', '124', '0', '999999999999999999'], big, why=lambda s: f'Ҷамъи рақамҳо {sum(digits(nums(s)[0]))}.')

H2 = ['Чаппа: rev = rev * 10 + n % 10; n /= 10;', 'Нусхаи n-ро нигоҳ доред, агар баъд лозим шавад.', 'Нулҳои охир дар чаппа нест мешаванд (120 → 21).']
day(3, 2, 'Чаппа кардани адад', 'loops', H2)
P('w3d2-1', 'Адади чаппа', 'Адади n. Рақамҳои онро баръакс карда, ҳамчун адад чоп кунед (120 → 21).', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'long long rev = 0;\nwhile (n > 0) {\n    rev = rev * 10 + n % 10;\n    n /= 10;\n}\ncout << rev << endl;', lambda s: str(int(s.strip()[::-1])), ['1234', '120', '0', '7', '1000000000000000000'], big,
  why=lambda s: f'{s.strip()} → {int(s.strip()[::-1])}')
P('w3d2-2', 'Адади палиндром', 'Адади n. Агар аз чап ва рост якхела хонда шавад YES, вагарна NO.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'YES ё NO.',
  body(['n']) + 'long long m = n, rev = 0;\nwhile (m > 0) {\n    rev = rev * 10 + m % 10;\n    m /= 10;\n}\nif (rev == n) cout << "YES";\nelse cout << "NO";\ncout << endl;',
  lambda s: 'YES' if s.strip() == s.strip()[::-1] else 'NO', ['12321', '1231', '0', '7', '10', '1221'], lambda r: r.choice([big(r), (lambda x: x + x[::-1])(str(R(r,1,99999)))]), why=lambda s: 'Чаппаро бо худи адад муқоиса кунед.')
P('w3d2-3', 'Рақамҳо бо фосила', 'Адади n. Рақамҳои онро аз чап ба рост бо фосила чоп кунед.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Рақамҳо бо фосила.',
  body(['n']) + 'long long p = 1;\nwhile (n / p >= 10) p *= 10;\nwhile (p > 0) {\n    cout << n / p % 10;\n    if (p > 1) cout << " ";\n    p /= 10;\n}\ncout << endl;',
  lambda s: ' '.join(s.strip()), ['2025', '7', '0', '100'], big, why=lambda s: ' '.join(s.strip()))
P('w3d2-4', 'Рақамҳо аз охир', 'Адади n. Рақамҳои онро аз охир ба аввал бо фосила чоп кунед.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Рақамҳо бо фосила.',
  body(['n']) + 'do {\n    cout << n % 10;\n    n /= 10;\n    if (n > 0) cout << " ";\n} while (n > 0);\ncout << endl;', lambda s: ' '.join(s.strip()[::-1]), ['2025', '7', '0', '100'], big,
  why=lambda s: ' '.join(s.strip()[::-1]))
P('w3d2-5', 'Калон: адад ё чаппааш', 'Адади n. Аз n ва чаппаи он калонтаринашро чоп кунед.', 'Як адад n (0 ≤ n ≤ 10¹⁷).', 'Як адад.',
  body(['n']) + 'long long m = n, rev = 0;\nwhile (m > 0) {\n    rev = rev * 10 + m % 10;\n    m /= 10;\n}\nif (rev > n) cout << rev;\nelse cout << n;\ncout << endl;',
  lambda s: str(max(int(s.strip()), int(s.strip()[::-1]))), ['12', '21', '0', '100'], lambda r: str(R(r,0,10**17)), why=lambda s: f'{s.strip()} ва {int(s.strip()[::-1])}')
P('w3d2-6', 'Бе рақами аввал ва охир', 'Адади n (≥ 100). Рақами аввал ва охирро хориҷ карда, ҳамчун адад чоп кунед (12345 → 234, 1005 → 0).', 'Як адад n (100 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'n /= 10;\nlong long p = 1;\nwhile (n / p >= 10) p *= 10;\ncout << n % p << endl;', lambda s: str(int(s.strip()[1:-1])), ['12345', '100', '1005', '999'], lambda r: str(R(r,100,10**18)),
  why=lambda s: f'{s.strip()} → {int(s.strip()[1:-1])}')
P('w3d2-7', 'Адад ва чаппааш', 'Адади n. Ҷамъи n ва чаппаи онро чоп кунед.', 'Як адад n (0 ≤ n ≤ 10¹⁷).', 'Як адад.',
  body(['n']) + 'long long m = n, rev = 0;\nwhile (m > 0) {\n    rev = rev * 10 + m % 10;\n    m /= 10;\n}\ncout << n + rev << endl;', lambda s: str(int(s.strip()) + int(s.strip()[::-1])), ['12', '120', '0', '99'],
  lambda r: str(R(r,0,10**17)), why=lambda s: f'{s.strip()} + {int(s.strip()[::-1])}')
P('w3d2-8', 'Танҳо рақамҳои ҷуфт', 'Адади n. Аз он танҳо рақамҳои ҷуфтро бо ҳамон тартиб нигоҳ доред ва ҳамчун адад чоп кунед. Агар рақами ҷуфт набошад — 0.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'long long res = 0, p = 1;\nwhile (n > 0) {\n    long long d = n % 10;\n    if (d % 2 == 0) {\n        res += d * p;\n        p *= 10;\n    }\n    n /= 10;\n}\ncout << res << endl;',
  lambda s: str(int(''.join(c for c in s.strip() if int(c) % 2 == 0) or '0')), ['123456', '135', '0', '2084'], big, why=lambda s: 'Рақамҳои тоқро партоед.')
P('w3d2-9', 'Ду рақами охирро иваз кун', 'Адади n (≥ 10). Ду рақами охирро ҷой иваз кунед (1234 → 1243) ва ҳамчун адад чоп кунед.', 'Як адад n (10 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'long long a = n % 10, b = n / 10 % 10;\ncout << n / 100 * 100 + a * 10 + b << endl;', lambda s: (lambda t: str(int(t[:-2] + t[-1] + t[-2])))(s.strip()), ['1234', '10', '99', '1000'],
  lambda r: str(R(r,10,10**18)), why=lambda s: 'Рақамҳои воҳид ва даҳҳоро иваз кунед.')
P('w3d2-10', 'Рақамҳо афзоянда', 'Адади n. Агар рақамҳои он аз чап ба рост қатъиян афзоянда бошанд (1359) YES, вагарна NO. Адади якрақама — YES.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'YES ё NO.',
  body(['n']) + 'bool ok = true;\nwhile (n >= 10) {\n    if (n % 10 <= n / 10 % 10) ok = false;\n    n /= 10;\n}\nif (ok) cout << "YES";\nelse cout << "NO";\ncout << endl;',
  lambda s: 'YES' if all(a < b for a, b in zip(s.strip(), s.strip()[1:])) else 'NO', ['1359', '1355', '7', '0', '98', '123456789'], lambda r: r.choice([big(r), ''.join(sorted(r.sample('123456789', R(r,1,9))))]),
  why=lambda s: 'Ҳар рақам аз пешинааш калон бошад.')

H3 = ['Тақсимкунанда: n % i == 0.', 'ТУК: while (b != 0) { t = a % b; a = b; b = t; }', 'Барои сода будан то i * i <= n тафтиш кардан кифоя аст.']
day(3, 3, 'Тақсимкунандаҳо ва ТУК', 'loops', H3)
P('w3d3-1', 'ТУК', 'Ду адад a ва b. Тақсимкунандаи умумии калонтаринро ёбед.', 'Як сатр: a, b (1 ≤ a, b ≤ 10¹⁸).', 'Як адад.',
  body(['a', 'b']) + 'while (b != 0) {\n    long long t = a % b;\n    a = b;\n    b = t;\n}\ncout << a << endl;', lambda s: str(__import__('math').gcd(*nums(s))), ['12 18', '7 13', '10 10', '1000000000000000000 500000000000000000'],
  lambda r: f'{R(r,1,10**18)} {R(r,1,10**18)}', why=lambda s: 'Алгоритми Евклид.')
P('w3d3-2', 'ХУК', 'Ду адад a ва b. Хурдтарин каратии умумиро ёбед (ХУК = a / ТУК · b).', 'Як сатр: a, b (1 ≤ a, b ≤ 10⁹).', 'Як адад.',
  body(['a', 'b']) + 'long long x = a, y = b;\nwhile (y != 0) {\n    long long t = x % y;\n    x = y;\n    y = t;\n}\ncout << a / x * b << endl;', lambda s: (lambda a, b: str(a * b // __import__('math').gcd(a, b)))(*nums(s)),
  ['4 6', '7 13', '5 5', '1000000000 999999999'], lambda r: f'{R(r,1,10**9)} {R(r,1,10**9)}', why=lambda s: 'Аввал ТУК-ро ёбед.')
P('w3d3-3', 'Шумораи тақсимкунандаҳо', 'Адади n. Чанд тақсимкунанда дорад (1 ва худаш ҳам)?', 'Як адад n (1 ≤ n ≤ 10¹²).', 'Як адад.',
  body(['n']) + 'long long cnt = 0, i = 1;\nwhile (i * i <= n) {\n    if (n % i == 0) {\n        cnt++;\n        if (i != n / i) cnt++;\n    }\n    i++;\n}\ncout << cnt << endl;',
  lambda s: (lambda n: str(sum((1 if i * i == n else 2) for i in range(1, int(n**0.5) + 2) if i * i <= n and n % i == 0)))(nums(s)[0]), ['12', '1', '7', '36', '1000000000000'], lambda r: str(R(r,1,10**6)),
  why=lambda s: 'Тақсимкунандаҳо ҷуфт-ҷуфт меоянд.')
P('w3d3-4', 'Ҷамъи тақсимкунандаҳо', 'Адади n. Ҷамъи ҳамаи тақсимкунандаҳои онро ёбед.', 'Як адад n (1 ≤ n ≤ 10⁶).', 'Як адад.',
  body(['n']) + 'long long s = 0, i = 1;\nwhile (i <= n) {\n    if (n % i == 0) s += i;\n    i++;\n}\ncout << s << endl;', lambda s: (lambda n: str(sum(i for i in range(1, n + 1) if n % i == 0)))(nums(s)[0]), ['6', '1', '7', '12'],
  lambda r: str(R(r,1,10**5)), why=lambda s: 'Ҳамаи i, ки n % i == 0.')
P('w3d3-5', 'Адади сода', 'Адади n. Агар сода бошад YES, вагарна NO. (1 сода нест)', 'Як адад n (1 ≤ n ≤ 10¹²).', 'YES ё NO.',
  body(['n']) + 'bool prime = n >= 2;\nlong long i = 2;\nwhile (i * i <= n) {\n    if (n % i == 0) prime = false;\n    i++;\n}\nif (prime) cout << "YES";\nelse cout << "NO";\ncout << endl;',
  lambda s: (lambda n: 'YES' if n >= 2 and all(n % i for i in range(2, int(n**0.5) + 1)) else 'NO')(nums(s)[0]), ['7', '1', '2', '9', '999999999989', '1000000000000'], lambda r: str(R(r,1,10**6)),
  why=lambda s: 'То √n тафтиш кунед.')
P('w3d3-6', 'Тақсимкунандаи хурдтарин', 'Адади n (≥ 2). Хурдтарин тақсимкунандаи аз 1 калони онро ёбед.', 'Як адад n (2 ≤ n ≤ 10¹²).', 'Як адад.',
  body(['n']) + 'long long i = 2;\nwhile (i * i <= n && n % i != 0) i++;\nif (i * i > n) i = n;\ncout << i << endl;',
  lambda s: (lambda n: str(next((i for i in range(2, int(n**0.5) + 1) if n % i == 0), n)))(nums(s)[0]), ['15', '7', '2', '49', '999999999989'], lambda r: str(R(r,2,10**6)), why=lambda s: 'Аз 2 сар карда ҷустуҷӯ кунед.')
P('w3d3-7', 'Адади мукаммал', 'Адад мукаммал аст, агар ба ҷамъи тақсимкунандаҳояш (бе худаш) баробар бошад: 6 = 1 + 2 + 3. YES ё NO.', 'Як адад n (1 ≤ n ≤ 10⁶).', 'YES ё NO.',
  body(['n']) + 'long long s = 0, i = 1;\nwhile (i < n) {\n    if (n % i == 0) s += i;\n    i++;\n}\nif (s == n) cout << "YES";\nelse cout << "NO";\ncout << endl;',
  lambda s: (lambda n: 'YES' if sum(i for i in range(1, n) if n % i == 0) == n else 'NO')(nums(s)[0]), ['6', '28', '12', '1', '496', '8128'], lambda r: str(R(r,1,10**5)), why=lambda s: 'Тақсимкунандаҳоро бе худи n ҷамъ кунед.')
P('w3d3-8', 'Касри содда', 'Каср a/b. Онро содда кунед ва сурат ва махраҷро бо фосила чоп кунед.', 'Як сатр: a, b (1 ≤ a, b ≤ 10¹⁸).', 'Ду адад.',
  body(['a', 'b']) + 'long long x = a, y = b;\nwhile (y != 0) {\n    long long t = x % y;\n    x = y;\n    y = t;\n}\ncout << a / x << " " << b / x << endl;',
  lambda s: (lambda a, b, g: f'{a//g} {b//g}')(*nums(s), __import__('math').gcd(*nums(s))), ['6 8', '3 7', '10 10', '100 25'], lambda r: f'{R(r,1,10**18)} {R(r,1,10**18)}', why=lambda s: 'Ба ТУК тақсим кунед.')
P('w3d3-9', 'Байнаш сода', 'Ду адад. Агар ТУК-и онҳо 1 бошад YES, вагарна NO.', 'Як сатр: a, b (1 ≤ a, b ≤ 10¹⁸).', 'YES ё NO.',
  body(['a', 'b']) + 'while (b != 0) {\n    long long t = a % b;\n    a = b;\n    b = t;\n}\nif (a == 1) cout << "YES";\nelse cout << "NO";\ncout << endl;',
  lambda s: 'YES' if __import__('math').gcd(*nums(s)) == 1 else 'NO', ['8 15', '6 9', '1 1', '7 7'], lambda r: f'{R(r,1,1000)} {R(r,1,1000)}', why=lambda s: 'ТУК == 1?')
P('w3d3-10', 'Зарбкунандаҳои сода', 'Адади n (≥ 2). Онро ба зарбкунандаҳои сода ҷудо карда, аз хурд ба калон бо фосила чоп кунед (12 → 2 2 3).', 'Як адад n (2 ≤ n ≤ 10¹²).', 'Ададҳо бо фосила.',
  body(['n']) + 'long long i = 2;\nbool first = true;\nwhile (i * i <= n) {\n    while (n % i == 0) {\n        if (!first) cout << " ";\n        cout << i;\n        first = false;\n        n /= i;\n    }\n    i++;\n}\nif (n > 1) {\n    if (!first) cout << " ";\n    cout << n;\n}\ncout << endl;',
  lambda s: (lambda n: (lambda f: ' '.join(map(str, f)))((lambda n: (lambda res: res)(__import__('functools').reduce(lambda acc, _: acc, [], None) or factor(n)))(n)))(nums(s)[0]),
  ['12', '7', '2', '1000000000000', '999999999989', '360'], lambda r: str(R(r,2,10**6)), why=lambda s: 'Аз 2 сар карда тақсим кунед.')

def factor(n):
    f, i = [], 2
    while i * i <= n:
        while n % i == 0:
            f.append(i); n //= i
        i += 1
    if n > 1: f.append(n)
    return f
PROBLEMS[-1]['py'] = lambda s: ' '.join(map(str, factor(nums(s)[0])))

H4 = ['Давр то шарт иҷро мешавад: while (n > 1) { ... }', 'Ҳисобкунакро (steps++) дар дохили давр зиёд кунед.', 'Ба пур шудани long long диққат диҳед.']
day(3, 4, 'Дараҷаҳо ва нимкунӣ', 'loops', H4)
P('w3d4-1', 'Нимкунӣ то 1', 'Адади n. Онро ба 2 тақсим мекунем (қисми бутун), то 1 шавад. Чанд қадам лозим?', 'Як адад n (1 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'int steps = 0;\nwhile (n > 1) {\n    n /= 2;\n    steps++;\n}\ncout << steps << endl;', lambda s: str(nums(s)[0].bit_length() - 1), ['8', '1', '10', '1000000000000000000'], lambda r: str(R(r,1,10**18)),
  why=lambda s: 'Ҳар қадам n = n / 2.')
P('w3d4-2', 'Дараҷаҳои 2', 'Адади n. Ҳамаи дараҷаҳои 2-ро, ки аз n калон нестанд (1, 2, 4, …), бо фосила чоп кунед.', 'Як адад n (1 ≤ n ≤ 10¹⁸).', 'Ададҳо бо фосила.',
  body(['n']) + 'long long p = 1;\ncout << p;\nwhile (p * 2 <= n) {\n    p *= 2;\n    cout << " " << p;\n}\ncout << endl;',
  lambda s: (lambda n: ' '.join(str(1 << k) for k in range(n.bit_length())))(nums(s)[0]), ['10', '1', '16', '1000000000000000000'], lambda r: str(R(r,1,10**18)), why=lambda s: '1, 2, 4, 8, …')
P('w3d4-3', 'Дараҷаи 2 аст?', 'Адади n. Агар n дараҷаи 2 бошад (1, 2, 4, 8, …) YES, вагарна NO.', 'Як адад n (1 ≤ n ≤ 10¹⁸).', 'YES ё NO.',
  body(['n']) + 'while (n % 2 == 0) n /= 2;\nif (n == 1) cout << "YES";\nelse cout << "NO";\ncout << endl;', lambda s: 'YES' if nums(s)[0] & (nums(s)[0] - 1) == 0 else 'NO',
  ['16', '12', '1', '576460752303423488', '1000000000000000000'], lambda r: str(r.choice([1 << R(r,0,59), R(r,1,10**18)])), why=lambda s: 'То ҷуфт аст, ба 2 тақсим кунед.')
P('w3d4-4', 'Пайдарпаии Коллатс', 'Адади n. Агар ҷуфт бошад n = n / 2, вагарна n = 3n + 1. Чанд қадам то 1 лозим?', 'Як адад n (1 ≤ n ≤ 10⁶).', 'Як адад.',
  body(['n']) + 'int steps = 0;\nwhile (n != 1) {\n    if (n % 2 == 0) n /= 2;\n    else n = 3 * n + 1;\n    steps++;\n}\ncout << steps << endl;',
  lambda s: (lambda n: str((lambda f: f(f, n, 0))(lambda f, n, c: c if n == 1 else f(f, n // 2 if n % 2 == 0 else 3 * n + 1, c + 1))))(nums(s)[0]), ['6', '1', '27', '7'], lambda r: str(R(r,1,10**6)), why=lambda s: 'Қоидаро то 1 такрор кунед.')
P('w3d4-5', 'Дараҷаи 3', 'Адади n. Калонтарин k-ро ёбед, ки 3ᵏ ≤ n.', 'Як адад n (1 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'long long p = 1;\nint k = 0;\nwhile (p * 3 <= n) {\n    p *= 3;\n    k++;\n}\ncout << k << endl;',
  lambda s: (lambda n: str(max(k for k in range(0, 40) if 3**k <= n)))(nums(s)[0]), ['10', '1', '27', '26', '1000000000000000000'], lambda r: str(R(r,1,10**18)), why=lambda s: '3, 9, 27, …')
P('w3d4-6', 'Дараҷа', 'Ададҳои a ва b. aᵇ-ро ҳисоб кунед (натиҷа ≤ 10¹⁸).', 'Як сатр: a, b (0 ≤ b ≤ 60).', 'Як адад.',
  body(['a', 'b']) + 'long long p = 1;\nwhile (b > 0) {\n    p *= a;\n    b--;\n}\ncout << p << endl;', lambda s: str(nums(s)[0] ** nums(s)[1]), ['2 10', '5 0', '-3 3', '10 18', '0 5'],
  lambda r: (lambda a: f'{a} {R(r,0, max(1, int(17 / __import__("math").log10(max(2, abs(a))))))}')(R(r,-50,50)), why=lambda s: 'a-ро b бор зарб кунед.')
P('w3d4-7', 'Пасандоз', 'Маблағ s. Ҳар моҳ p фоиз илова мешавад (s = s + s·p/100, тақсими бутун). Пас аз чанд моҳ маблағ ба t ё зиёдтар мерасад? (s ≥ 100, p ≥ 1)', 'Як сатр: s, p, t (100 ≤ s ≤ t ≤ 10¹²).', 'Як адад.',
  body(['s', 'p', 't']) + 'int months = 0;\nwhile (s < t) {\n    s += s * p / 100;\n    months++;\n}\ncout << months << endl;',
  lambda s: (lambda s0, p, t: (lambda f: f(f, s0, 0))(lambda f, s, m: m if s >= t else f(f, s + s * p // 100, m + 1)))(*nums(s)) if False else str(deposit(*nums(s))),
  ['1000 10 1331', '500 5 500', '100 1 105', '100 100 1000000000000'], lambda r: (lambda s: f'{s} {R(r,1,100)} {s + R(r,0,10**6)}')(R(r,100,10**6)), why=lambda s: 'Ҳар моҳ маблағро нав кунед.')
def deposit(s, p, t):
    m = 0
    while s < t:
        s += s * p // 100; m += 1
    return m
PROBLEMS[-1]['py'] = lambda s: str(deposit(*nums(s)))
P('w3d4-8', 'Дучанд то калон', 'Аз 1 оғоз карда, ададро дучанд мекунем, то аз n калон шавад. Чанд бор дучанд кардем?', 'Як адад n (1 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'long long x = 1;\nint cnt = 0;\nwhile (x <= n) {\n    x *= 2;\n    cnt++;\n}\ncout << cnt << endl;', lambda s: str(nums(s)[0].bit_length()), ['1', '5', '8', '1000000000000000000'], lambda r: str(R(r,1,10**18)),
  why=lambda s: '1 → 2 → 4 → …')
P('w3d4-9', 'Адад дар системаи дуӣ', 'Адади n. Онро дар системаи дуӣ чоп кунед.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Сатри 0 ва 1.',
  'long long n;\ncin >> n;\nstring s = "";\ndo {\n    s = char(\'0\' + n % 2) + s;\n    n /= 2;\n} while (n > 0);\ncout << s << endl;', lambda s: bin(nums(s)[0])[2:], ['5', '0', '8', '1000000000000000000'],
  lambda r: str(R(r,0,10**18)), why=lambda s: 'Бақияҳои тақсим ба 2 — аз охир.', inc='#include <iostream>\n#include <string>')
P('w3d4-10', 'Решаи рақамӣ', 'Адади n. Ҷамъи рақамҳоро гирифта, то як рақам монад, такрор кунед (9875 → 29 → 11 → 2).', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Як рақам.',
  body(['n']) + 'while (n >= 10) {\n    long long s = 0;\n    while (n > 0) {\n        s += n % 10;\n        n /= 10;\n    }\n    n = s;\n}\ncout << n << endl;',
  lambda s: (lambda n: str(0 if n == 0 else 1 + (n - 1) % 9))(nums(s)[0]), ['9875', '7', '0', '999999999999999999'], big, why=lambda s: 'Давр дар давр.')

H5 = ['Хондан то шарт: while (cin >> x && x != 0) { ... }', 'Ҳисобкунак ва ҷамъро пеш аз давр 0 кунед.', 'Калонтаринро аз адади аввал оғоз кунед.']
day(3, 5, 'Хондан то сифр', 'loops', H5)
def zseq(r, lo=-1000, hi=1000, z=0):
    k = R(r, 0, 20)
    xs = [R(r, lo, hi) for _ in range(k)]
    xs = [x if x != z else x + 1 for x in xs]
    return ' '.join(map(str, xs + [z]))
def till(s, z=0):
    out = []
    for x in nums(s):
        if x == z: break
        out.append(x)
    return out
P('w3d5-1', 'Ҷамъ то сифр', 'Ададҳо пай дар пай дода мешаванд, охирин — 0. Ҷамъи ададҳоро (бе 0) ёбед.', 'Ададҳо, охирин 0 (|x| ≤ 10⁹, на зиёда аз 10⁵ адад).', 'Як адад.',
  'long long x, s = 0;\nwhile (cin >> x && x != 0) {\n    s += x;\n}\ncout << s << endl;', lambda s: str(sum(till(s))), ['1 2 3 0', '0', '-5 5 7 0'], zseq, why=lambda s: 'То 0 ҷамъ кунед.')
P('w3d5-2', 'Шумора то сифр', 'Ададҳо дода мешаванд, охирин — 0. Чанд адад пеш аз 0 буд?', 'Ададҳо, охирин 0.', 'Як адад.',
  'long long x;\nint cnt = 0;\nwhile (cin >> x && x != 0) {\n    cnt++;\n}\ncout << cnt << endl;', lambda s: str(len(till(s))), ['1 2 3 0', '0', '5 0'], zseq, why=lambda s: 'Ҳисобкунак.')
P('w3d5-3', 'Калонтарин то сифр', 'Ададҳо дода мешаванд, охирин — 0 (ақаллан як адад пеш аз 0). Калонтаринро ёбед.', 'Ададҳо, охирин 0.', 'Як адад.',
  'long long x, mx;\ncin >> mx;\nwhile (cin >> x && x != 0) {\n    if (x > mx) mx = x;\n}\ncout << mx << endl;', lambda s: str(max(till(s))), ['1 5 3 0', '-7 0', '-1 -5 -3 0'],
  lambda r: (lambda t: t if not t.startswith('0') else '1 ' + t)(zseq(r)), why=lambda s: 'Аз адади аввал оғоз кунед.')
P('w3d5-4', 'Ҷуфтҳо то −1', 'Ададҳо дода мешаванд, охирин — −1. Чанд адади ҷуфт буд? (ададҳо ғайриманфӣ)', 'Ададҳо, охирин −1 (0 ≤ x ≤ 10⁹).', 'Як адад.',
  'long long x;\nint cnt = 0;\nwhile (cin >> x && x != -1) {\n    if (x % 2 == 0) cnt++;\n}\ncout << cnt << endl;', lambda s: str(sum(1 for x in till(s, -1) if x % 2 == 0)), ['1 2 4 0 -1', '-1', '3 5 -1'],
  lambda r: zseq(r, 0, 1000, -1), why=lambda s: '0 ҳам ҷуфт аст.')
P('w3d5-5', 'Фибоначчи калон аз n', 'Пайдарпаии Фибоначчи: 1, 1, 2, 3, 5, 8, … Аввалин адади Фибоначчиро, ки аз n калон аст, ёбед.', 'Як адад n (0 ≤ n ≤ 10¹⁷).', 'Як адад.',
  body(['n']) + 'long long a = 1, b = 1;\nwhile (a <= n) {\n    long long c = a + b;\n    a = b;\n    b = c;\n}\ncout << a << endl;', lambda s: str(fib_above(nums(s)[0])), ['10', '0', '1', '100000000000000000'], lambda r: str(R(r,0,10**17)),
  why=lambda s: 'Ҳар адад — ҷамъи ду пешина.')
def fib_above(n):
    a, b = 1, 1
    while a <= n: a, b = b, a + b
    return a
PROBLEMS[-1]['py'] = lambda s: str(fib_above(nums(s)[0]))
P('w3d5-6', 'Миёна то сифр', 'Ададҳои мусбат дода мешаванд, охирин — 0 (ақаллан як адад). Қисми бутуни миёнаи арифметикиро ёбед.', 'Ададҳо, охирин 0 (1 ≤ x ≤ 10⁹).', 'Як адад.',
  'long long x, s = 0, cnt = 0;\nwhile (cin >> x && x != 0) {\n    s += x;\n    cnt++;\n}\ncout << s / cnt << endl;', lambda s: str(sum(till(s)) // len(till(s))), ['1 2 4 0', '7 0', '10 20 0'],
  lambda r: ' '.join(str(R(r,1,10**9)) for _ in range(R(r,1,20))) + ' 0', why=lambda s: 'Ҷамъ / шумора.')
P('w3d5-7', 'Мусбатҳо то сифр', 'Ададҳо дода мешаванд, охирин — 0. Чандтоаш мусбат буд?', 'Ададҳо, охирин 0.', 'Як адад.',
  'long long x;\nint cnt = 0;\nwhile (cin >> x && x != 0) {\n    if (x > 0) cnt++;\n}\ncout << cnt << endl;', lambda s: str(sum(1 for x in till(s) if x > 0)), ['1 -2 3 0', '0', '-1 -1 0'], zseq, why=lambda s: 'Танҳо x > 0.')
P('w3d5-8', 'Квадратҳо то n', 'Адади n. Ҳамаи квадратҳои ададҳои бутуни мусбатро (1, 4, 9, …), ки аз n калон нестанд, бо фосила чоп кунед.', 'Як адад n (1 ≤ n ≤ 10¹⁰).', 'Ададҳо бо фосила.',
  body(['n']) + 'long long i = 1;\ncout << 1;\ni = 2;\nwhile (i * i <= n) {\n    cout << " " << i * i;\n    i++;\n}\ncout << endl;', lambda s: ' '.join(str(i * i) for i in range(1, int(nums(s)[0] ** 0.5) + 2) if i * i <= nums(s)[0]),
  ['10', '1', '16', '100'], lambda r: str(R(r,1,10**6)), why=lambda s: '1, 4, 9, 16, …')
P('w3d5-9', 'Адади содаи навбатӣ', 'Адади n. Хурдтарин адади содаи аз n калонро ёбед.', 'Як адад n (0 ≤ n ≤ 10¹²).', 'Як адад.',
  body(['n']) + 'long long x = n + 1;\nwhile (true) {\n    bool prime = x >= 2;\n    for (long long i = 2; i * i <= x; i++) {\n        if (x % i == 0) { prime = false; break; }\n    }\n    if (prime) break;\n    x++;\n}\ncout << x << endl;',
  lambda s: str(next_prime(nums(s)[0])), ['10', '0', '13', '999999999988'], lambda r: str(R(r,0,10**9)), why=lambda s: 'Аз n + 1 сар карда тафтиш кунед.')
def is_p(x):
    if x < 2: return False
    i = 2
    while i * i <= x:
        if x % i == 0: return False
        i += 1
    return True
def next_prime(n):
    x = n + 1
    while not is_p(x): x += 1
    return x
PROBLEMS[-1]['py'] = lambda s: str(next_prime(nums(s)[0]))
P('w3d5-10', 'Пули майда', 'Маблағи n дирам бо тангаҳои 50, 20, 10, 5 ва 1 дирам дода мешавад. Аввал тангаҳои калон. Ҳадди ақал чанд танга лозим?', 'Як адад n (0 ≤ n ≤ 10⁹).', 'Як адад.',
  body(['n']) + 'long long cnt = 0;\nwhile (n >= 50) { n -= 50; cnt++; }\nwhile (n >= 20) { n -= 20; cnt++; }\nwhile (n >= 10) { n -= 10; cnt++; }\nwhile (n >= 5) { n -= 5; cnt++; }\ncnt += n;\ncout << cnt << endl;',
  lambda s: (lambda n: str(n // 50 + n % 50 // 20 + n % 50 % 20 // 10 + n % 50 % 20 % 10 // 5 + n % 5))(nums(s)[0]), ['86', '0', '50', '99'], lambda r: str(R(r,0,10**4)), why=lambda s: 'Аз тангаи калон сар кунед.')

day(3, 6, 'Имтиҳони ҳафтаи 3', 'loops', H3, kind='exam')
P('w3e-1', 'Рақамҳо: шумора ва ҷамъ', 'Адади n. Шумора ва ҷамъи рақамҳоро бо фосила чоп кунед.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Ду адад.',
  body(['n']) + 'long long cnt = 0, s = 0;\ndo {\n    s += n % 10;\n    cnt++;\n    n /= 10;\n} while (n > 0);\ncout << cnt << " " << s << endl;', lambda s: f'{len(s.strip())} {sum(digits(nums(s)[0]))}',
  ['2025', '0', '999'], big, why=lambda s: 'Ҳарду дар як давр.')
P('w3e-2', 'Чаппа ва палиндром', 'Адади n. Аввал чаппаи онро, баъд YES (агар палиндром бошад) ё NO чоп кунед.', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Адад ва калима.',
  body(['n']) + 'long long m = n, rev = 0;\nwhile (m > 0) {\n    rev = rev * 10 + m % 10;\n    m /= 10;\n}\ncout << rev << " " << (rev == n ? "YES" : "NO") << endl;',
  lambda s: f"{int(s.strip()[::-1])} {'YES' if s.strip() == s.strip()[::-1] else 'NO'}", ['121', '120', '0', '7'], big, why=lambda s: 'Чаппа ва муқоиса.')
P('w3e-3', 'ТУК ва ХУК', 'Ду адад. ТУК ва ХУК-ро бо фосила чоп кунед.', 'Як сатр: a, b (1 ≤ a, b ≤ 10⁹).', 'Ду адад.',
  body(['a', 'b']) + 'long long x = a, y = b;\nwhile (y != 0) {\n    long long t = x % y;\n    x = y;\n    y = t;\n}\ncout << x << " " << a / x * b << endl;',
  lambda s: (lambda a, b, g: f'{g} {a // g * b}')(*nums(s), __import__('math').gcd(*nums(s))), ['12 18', '7 5', '10 10'], lambda r: f'{R(r,1,10**9)} {R(r,1,10**9)}', why=lambda s: 'ХУК = a / ТУК · b.')
P('w3e-4', 'Зарбкунандаҳо', 'Адади n (≥ 2). Зарбкунандаҳои содаро аз хурд ба калон бо фосила чоп кунед.', 'Як адад n (2 ≤ n ≤ 10¹²).', 'Ададҳо.',
  PROBLEMS[[p['slug'] for p in PROBLEMS].index('w3d3-10')]['solution'], lambda s: ' '.join(map(str, factor(nums(s)[0]))), ['60', '13', '1024', '999999999989'], lambda r: str(R(r,2,10**9)), why=lambda s: 'Тақсими пайдарпай.')
P('w3e-5', 'Системаи дуӣ: чанд воҳид', 'Адади n. Дар навишти дуии он чанд рақами 1 ҳаст?', 'Як адад n (0 ≤ n ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'int cnt = 0;\nwhile (n > 0) {\n    cnt += n % 2;\n    n /= 2;\n}\ncout << cnt << endl;', lambda s: str(bin(nums(s)[0]).count('1')), ['5', '0', '255', '1000000000000000000'], lambda r: str(R(r,0,10**18)),
  why=lambda s: f'{bin(nums(s)[0])[2:]}')
