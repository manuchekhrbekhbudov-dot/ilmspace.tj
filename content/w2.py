# Ҳафтаи 2: шартҳо (if / else, else if, && ва ||)
from lib import *
R = lambda r, a, b: r.randint(a, b)

def C(slug, title, text, names, ccond, pcond, yes, no, inp, tests, gen=None, why=None):
    """Масъалаи «ҳа/не»: агар шарт дуруст бошад yes, вагарна no."""
    cpp = ('long long ' + ', '.join(names) + ';\ncin >> ' + ' >> '.join(names) + ';\n'
           f'if ({ccond}) {{\n    cout << "{yes}" << endl;\n}} else {{\n    cout << "{no}" << endl;\n}}')
    def py(s):
        v = dict(zip(names, nums(s)))
        return yes if eval(pcond, {'abs': abs}, v) else no
    P(slug, title, text, inp, f'{yes} ё {no}.', cpp, py, tests, gen, why=why or (lambda s: f'Шарт {"дуруст" if py(s) == yes else "нодуруст"} аст, бинобар ин {py(s)}.'))

def body(names):
    return 'long long ' + ', '.join(names) + ';\ncin >> ' + ' >> '.join(names) + ';\n'

H1 = ['if (шарт) { ... } else { ... }', 'Барои муқоиса: >, <, >=, <=, == (ду аломати баробар!), !=.', 'Ҳолати баробариро фаромӯш накунед.']
day(2, 1, 'Муқоиса', 'cond', H1)
C('w2d1-1', 'Калонтар аст?', 'Ду адад a ва b. Агар a аз b калон бошад, YES, вагарна NO чоп кунед.', ['a', 'b'], 'a > b', 'a > b', 'YES', 'NO', 'Як сатр: a, b (|x| ≤ 10⁹).',
  ['5 3', '3 5', '4 4'], lambda r: f'{R(r,-9,9)} {R(r,-9,9)}')
P('w2d1-2', 'Калонтарини ду адад', 'Ду адад дода шудаанд. Калонтаринашро чоп кунед.', 'Як сатр: a, b (|x| ≤ 10⁹).', 'Як адад.',
  body(['a', 'b']) + 'if (a > b) {\n    cout << a << endl;\n} else {\n    cout << b << endl;\n}', lambda s: str(max(nums(s))), ['5 3', '3 5', '-2 -2', '-1000000000 1000000000'], lambda r: f'{R(r,-10**9,10**9)} {R(r,-10**9,10**9)}',
  why=lambda s: f'Аз {s.split()[0]} ва {s.split()[1]} калонтар — {max(nums(s))}.')
P('w2d1-3', 'Хурдтарини ду адад', 'Ду адад дода шудаанд. Хурдтаринашро чоп кунед.', 'Як сатр: a, b (|x| ≤ 10⁹).', 'Як адад.',
  body(['a', 'b']) + 'if (a < b) {\n    cout << a << endl;\n} else {\n    cout << b << endl;\n}', lambda s: str(min(nums(s))), ['5 3', '3 5', '7 7'], lambda r: f'{R(r,-10**9,10**9)} {R(r,-10**9,10**9)}',
  why=lambda s: f'Хурдтарин — {min(nums(s))}.')
P('w2d1-4', 'Муқоисаи ду адад', 'Ду адад a ва b. Агар якум калон бошад A, агар дуюм калон бошад B, агар баробар бошанд EQUAL чоп кунед.', 'Як сатр: a, b (|x| ≤ 10⁹).', 'A, B ё EQUAL.',
  body(['a', 'b']) + 'if (a > b) {\n    cout << "A" << endl;\n} else if (a < b) {\n    cout << "B" << endl;\n} else {\n    cout << "EQUAL" << endl;\n}',
  lambda s: (lambda a, b: 'A' if a > b else 'B' if a < b else 'EQUAL')(*nums(s)), ['8 3', '2 7', '5 5', '-5 -5', '0 -1'], lambda r: f'{R(r,-5,5)} {R(r,-5,5)}',
  why=lambda s: 'Се ҳолат: калон, хурд ё баробар.')
C('w2d1-5', 'Адади мусбат', 'Адади n дода шудааст. Агар он мусбат бошад POSITIVE, вагарна NOT POSITIVE чоп кунед.', ['n'], 'n > 0', 'n > 0', 'POSITIVE', 'NOT POSITIVE', 'Як адад n (|n| ≤ 10⁹).',
  ['5', '-3', '0'], lambda r: str(R(r,-100,100)))
C('w2d1-6', 'Имтиҳон гузашт?', 'Шогирд s хол гирифт. Агар хол 56 ё зиёд бошад PASS, вагарна FAIL чоп кунед.', ['s'], 's >= 56', 's >= 56', 'PASS', 'FAIL', 'Як адад s (0 ≤ s ≤ 100).',
  ['70', '30', '56', '55'], lambda r: str(R(r,0,100)))
C('w2d1-7', 'Калонсол', 'Синну соли шахс a. Агар 18 ё зиёд бошад ADULT, вагарна CHILD чоп кунед.', ['a'], 'a >= 18', 'a >= 18', 'ADULT', 'CHILD', 'Як адад a (0 ≤ a ≤ 150).',
  ['20', '10', '18', '17'], lambda r: str(R(r,0,100)))
P('w2d1-8', 'Модули адад', 'Адади n. Модули онро (бе аломати минус) чоп кунед.', 'Як адад n (|n| ≤ 10¹⁸).', 'Як адад.',
  body(['n']) + 'if (n < 0) {\n    n = -n;\n}\ncout << n << endl;', lambda s: str(abs(nums(s)[0])), ['-5', '7', '0', '-1000000000000000000'], lambda r: str(R(r,-10**18,10**18)),
  why=lambda s: f'|{s.strip()}| = {abs(nums(s)[0])}')
P('w2d1-9', 'Пул кифоя мекунад?', 'Дар кисса m сомонӣ ҳаст, нархи мол p. Агар пул кифоя бошад, YES ва бақияро чоп кунед, вагарна NO ва чанд сомонӣ намерасад.', 'Як сатр: m, p (0 ≤ m, p ≤ 10⁹).', 'YES бақия ё NO камбуд.',
  body(['m', 'p']) + 'if (m >= p) {\n    cout << "YES " << m - p << endl;\n} else {\n    cout << "NO " << p - m << endl;\n}',
  lambda s: (lambda m, p: f'YES {m-p}' if m >= p else f'NO {p-m}')(*nums(s)), ['50 30', '20 35', '10 10'], lambda r: f'{R(r,0,1000)} {R(r,0,1000)}', why=lambda s: 'Муқоиса m ва p.')
P('w2d1-10', 'Ҷамъ ё зарб?', 'Ду адад a ва b. Агар a + b калонтар бошад SUM, агар a · b калонтар бошад PRODUCT, агар баробар бошанд EQUAL чоп кунед.', 'Як сатр: a, b (|x| ≤ 10⁵).', 'SUM, PRODUCT ё EQUAL.',
  body(['a', 'b']) + 'if (a + b > a * b) {\n    cout << "SUM" << endl;\n} else if (a + b < a * b) {\n    cout << "PRODUCT" << endl;\n} else {\n    cout << "EQUAL" << endl;\n}',
  lambda s: (lambda a, b: 'SUM' if a + b > a * b else 'PRODUCT' if a + b < a * b else 'EQUAL')(*nums(s)), ['1 5', '3 4', '2 2', '0 0'], lambda r: f'{R(r,-20,20)} {R(r,-20,20)}',
  why=lambda s: (lambda a, b: f'{a}+{b}={a+b}, {a}·{b}={a*b}')(*nums(s)))

H2 = ['Ҷуфт: n % 2 == 0.', 'Тақсимшавӣ ба k: n % k == 0.', 'Барои ададҳои манфӣ n % 2 метавонад −1 бошад — бо == 0 тафтиш кунед.']
day(2, 2, 'Ҷуфт, тоқ ва аломат', 'cond', H2)
C('w2d2-1', 'Ҷуфт ё тоқ', 'Адади n. Агар ҷуфт бошад EVEN, вагарна ODD чоп кунед.', ['n'], 'n % 2 == 0', 'n % 2 == 0', 'EVEN', 'ODD', 'Як адад n (|n| ≤ 10¹⁸).',
  ['4', '7', '0', '-3', '-8'], lambda r: str(R(r,-10**18,10**18)))
P('w2d2-2', 'Аломати адад', 'Адади n. Агар мусбат бошад POSITIVE, манфӣ — NEGATIVE, сифр — ZERO чоп кунед.', 'Як адад n (|n| ≤ 10⁹).', 'POSITIVE, NEGATIVE ё ZERO.',
  body(['n']) + 'if (n > 0) {\n    cout << "POSITIVE" << endl;\n} else if (n < 0) {\n    cout << "NEGATIVE" << endl;\n} else {\n    cout << "ZERO" << endl;\n}',
  lambda s: (lambda n: 'POSITIVE' if n > 0 else 'NEGATIVE' if n < 0 else 'ZERO')(nums(s)[0]), ['5', '-5', '0'], lambda r: str(R(r,-100,100)), why=lambda s: 'Се ҳолат: > 0, < 0, = 0.')
C('w2d2-3', 'Ба 3 тақсим мешавад?', 'Адади n. Агар ба 3 бебақия тақсим шавад YES, вагарна NO.', ['n'], 'n % 3 == 0', 'n % 3 == 0', 'YES', 'NO', 'Як адад n (|n| ≤ 10¹⁸).',
  ['9', '10', '0', '-6'], lambda r: str(R(r,-10**6,10**6)))
P('w2d2-4', 'Fizz Buzz', 'Адади n. Агар ба 3 ва 5 тақсим шавад FizzBuzz, танҳо ба 3 — Fizz, танҳо ба 5 — Buzz, вагарна худи n-ро чоп кунед.', 'Як адад n (1 ≤ n ≤ 10⁹).', 'Як сатр.',
  body(['n']) + 'if (n % 15 == 0) {\n    cout << "FizzBuzz" << endl;\n} else if (n % 3 == 0) {\n    cout << "Fizz" << endl;\n} else if (n % 5 == 0) {\n    cout << "Buzz" << endl;\n} else {\n    cout << n << endl;\n}',
  lambda s: (lambda n: 'FizzBuzz' if n % 15 == 0 else 'Fizz' if n % 3 == 0 else 'Buzz' if n % 5 == 0 else str(n))(nums(s)[0]), ['15', '9', '10', '7'], lambda r: str(R(r,1,100)),
  why=lambda s: 'Аввал тақсимшавӣ ба 15-ро тафтиш кунед.')
C('w2d2-5', 'Охираш сифр?', 'Адади n. Агар рақами охиринаш 0 бошад YES, вагарна NO.', ['n'], 'n % 10 == 0', 'n % 10 == 0', 'YES', 'NO', 'Як адад n (0 ≤ n ≤ 10¹⁸).',
  ['120', '125', '0'], lambda r: str(R(r,0,10**6)))
C('w2d2-6', 'Ҳамҷуфт', 'Ду адад. Агар ҳарду ҷуфт ё ҳарду тоқ бошанд YES, вагарна NO.', ['a', 'b'], '(a % 2 == 0) == (b % 2 == 0)', '(a % 2 == 0) == (b % 2 == 0)', 'YES', 'NO', 'Як сатр: a, b (|x| ≤ 10⁹).',
  ['2 4', '3 5', '2 3', '-1 1'], lambda r: f'{R(r,-50,50)} {R(r,-50,50)}')
C('w2d2-7', 'Тақсим мешавад?', 'Ду адад a ва b (b ≠ 0). Агар a ба b бебақия тақсим шавад YES, вагарна NO.', ['a', 'b'], 'a % b == 0', 'a % b == 0', 'YES', 'NO', 'Як сатр: a, b (0 ≤ a ≤ 10⁹, 1 ≤ b ≤ 10⁹).',
  ['12 4', '13 4', '0 5'], lambda r: f'{R(r,0,1000)} {R(r,1,20)}')
C('w2d2-8', 'Рақами охирин ҷуфт', 'Адади n. Агар рақами охирини он ҷуфт бошад YES, вагарна NO.', ['n'], 'n % 10 % 2 == 0', 'n % 10 % 2 == 0', 'YES', 'NO', 'Як адад n (0 ≤ n ≤ 10¹⁸).',
  ['124', '125', '0'], lambda r: str(R(r,0,10**9)))
C('w2d2-9', 'Ба 4 ва на ба 100', 'Адади n. Агар ба 4 тақсим шавад ва ба 100 тақсим нашавад YES, вагарна NO.', ['n'], 'n % 4 == 0 && n % 100 != 0', 'n % 4 == 0 and n % 100 != 0', 'YES', 'NO', 'Як адад n (1 ≤ n ≤ 10⁹).',
  ['2024', '1900', '2023', '2000'], lambda r: str(R(r,1,5000)))
P('w2d2-10', 'Чанд манфӣ', 'Се адад дода шудаанд. Чандто аз онҳо манфӣ аст?', 'Як сатр: a, b, c (|x| ≤ 10⁹).', 'Як адад (0–3).',
  body(['a', 'b', 'c']) + 'int cnt = 0;\nif (a < 0) cnt++;\nif (b < 0) cnt++;\nif (c < 0) cnt++;\ncout << cnt << endl;', lambda s: str(sum(1 for x in nums(s) if x < 0)),
  ['1 -2 -3', '0 0 0', '-1 -1 -1'], lambda r: ' '.join(str(R(r,-5,5)) for _ in range(3)), why=lambda s: 'Ҳар адади манфӣ ҳисобкунакро 1 зиёд мекунад.')

H3 = ['else if барои якчанд ҳолат: if … else if … else.', 'Ҳолатҳоро аз боло ба поён тафтиш кунед — аввалин дуруст иҷро мешавад.', 'Сарҳадҳоро (масалан, 86 ё 85) дастӣ тафтиш кунед.']
day(2, 3, 'else if', 'cond', H3)
P('w2d3-1', 'Баҳо аз рӯи хол', 'Хол s (0–100). 86–100 → 5, 71–85 → 4, 56–70 → 3, камтар → 2.', 'Як адад s.', 'Баҳо.',
  body(['s']) + 'if (s >= 86) cout << 5;\nelse if (s >= 71) cout << 4;\nelse if (s >= 56) cout << 3;\nelse cout << 2;\ncout << endl;',
  lambda s: (lambda x: '5' if x >= 86 else '4' if x >= 71 else '3' if x >= 56 else '2')(nums(s)[0]), ['90', '60', '86', '85', '71', '70', '56', '55', '0', '100'], why=lambda s: 'Аз сарҳади калон ба хурд тафтиш кунед.')
P('w2d3-2', 'Фасли сол', 'Рақами моҳ m (1–12). Зимистон (12, 1, 2) — WINTER, баҳор (3–5) — SPRING, тобистон (6–8) — SUMMER, тирамоҳ (9–11) — AUTUMN.', 'Як адад m.', 'Номи фасл.',
  body(['m']) + 'if (m == 12 || m <= 2) cout << "WINTER";\nelse if (m <= 5) cout << "SPRING";\nelse if (m <= 8) cout << "SUMMER";\nelse cout << "AUTUMN";\ncout << endl;',
  lambda s: (lambda m: 'WINTER' if m == 12 or m <= 2 else 'SPRING' if m <= 5 else 'SUMMER' if m <= 8 else 'AUTUMN')(nums(s)[0]), [str(i) for i in [1, 4, 7, 10, 12, 2, 3, 5, 6, 8, 9, 11]], n=12, why=lambda s: 'Моҳро бо сарҳадҳо муқоиса кунед.')
P('w2d3-3', 'Обу ҳаво', 'Ҳарорат t. Агар t < 0 — COLD, 0…15 — COOL, 16…25 — WARM, зиёда аз 25 — HOT.', 'Як адад t (−100 ≤ t ≤ 100).', 'Як калима.',
  body(['t']) + 'if (t < 0) cout << "COLD";\nelse if (t <= 15) cout << "COOL";\nelse if (t <= 25) cout << "WARM";\nelse cout << "HOT";\ncout << endl;',
  lambda s: (lambda t: 'COLD' if t < 0 else 'COOL' if t <= 15 else 'WARM' if t <= 25 else 'HOT')(nums(s)[0]), ['-5', '10', '20', '30', '0', '15', '16', '25', '26', '-1'], why=lambda s: 'Чор фосила.')
P('w2d3-4', 'Нархи чипта', 'Нархи пурраи чипта p (ҷуфт). Кӯдакони то 7 сола ройгон (0), то 18 сола ва 65+ сола — нисфи нарх, дигарон — пурра. Синни a.', 'Як сатр: a, p.', 'Як адад — нарх.',
  body(['a', 'p']) + 'if (a < 7) cout << 0;\nelse if (a < 18 || a >= 65) cout << p / 2;\nelse cout << p;\ncout << endl;',
  lambda s: (lambda a, p: '0' if a < 7 else str(p // 2) if a < 18 or a >= 65 else str(p))(*nums(s)), ['5 20', '10 20', '30 20', '70 20', '7 20', '18 20', '65 20', '64 20'],
  lambda r: f'{R(r,0,100)} {2*R(r,1,100)}', why=lambda s: 'Се гурӯҳи синну сол.')
P('w2d3-5', 'Рӯзи ҳафта', 'Рақами рӯз d (1 — Душанбе … 7 — Якшанбе). Номи рӯзро чоп кунед.', 'Як адад d (1 ≤ d ≤ 7).', 'Номи рӯз бо ҳарфи калон.',
  body(['d']) + 'if (d == 1) cout << "Душанбе";\nelse if (d == 2) cout << "Сешанбе";\nelse if (d == 3) cout << "Чоршанбе";\nelse if (d == 4) cout << "Панҷшанбе";\nelse if (d == 5) cout << "Ҷумъа";\nelse if (d == 6) cout << "Шанбе";\nelse cout << "Якшанбе";\ncout << endl;',
  lambda s: ['Душанбе', 'Сешанбе', 'Чоршанбе', 'Панҷшанбе', 'Ҷумъа', 'Шанбе', 'Якшанбе'][nums(s)[0] - 1], [str(i) for i in [1, 5, 2, 3, 4, 6, 7]], why=lambda s: 'Ҳар рақам — як рӯз.')
P('w2d3-6', 'Калкулятор', 'Ифода «a op b», ки op яке аз + - * / аст. Натиҷаро чоп кунед (тақсим бутун, b ≠ 0, ададҳо ғайриманфӣ).', 'Як сатр: a op b (0 ≤ a, b ≤ 10⁹).', 'Як адад.',
  'long long a, b;\nchar op;\ncin >> a >> op >> b;\nif (op == \'+\') cout << a + b;\nelse if (op == \'-\') cout << a - b;\nelse if (op == \'*\') cout << a * b;\nelse cout << a / b;\ncout << endl;',
  lambda s: (lambda a, op, b: str(a + b if op == '+' else a - b if op == '-' else a * b if op == '*' else a // b))(int(s.split()[0]), s.split()[1], int(s.split()[2])),
  ['3 + 4', '10 - 15', '6 * 7', '7 / 2', '0 / 5'], lambda r: f"{R(r,0,1000)} {r.choice('+-*/')} {R(r,1,1000)}", why=lambda s: 'Амалро аз рӯи аломат интихоб кунед.')
P('w2d3-7', 'Чоряки координатӣ', 'Нуқта (x, y), ки x ≠ 0 ва y ≠ 0. Рақами чорякро (1–4) чоп кунед.', 'Як сатр: x, y.', 'Як адад.',
  body(['x', 'y']) + 'if (x > 0 && y > 0) cout << 1;\nelse if (x < 0 && y > 0) cout << 2;\nelse if (x < 0 && y < 0) cout << 3;\nelse cout << 4;\ncout << endl;',
  lambda s: (lambda x, y: '1' if x > 0 and y > 0 else '2' if x < 0 and y > 0 else '3' if x < 0 and y < 0 else '4')(*nums(s)), ['3 4', '-3 4', '-3 -4', '3 -4'],
  lambda r: f'{r.choice([-1,1])*R(r,1,100)} {r.choice([-1,1])*R(r,1,100)}', why=lambda s: 'Аломати x ва y-ро бинед.')
P('w2d3-8', 'Нархи такси', 'То 3 км — 10 сомонӣ. Ҳар километри иловагӣ — 2 сомонӣ. Масофа d км. Нархро ёбед.', 'Як адад d (0 ≤ d ≤ 10⁶).', 'Як адад.',
  body(['d']) + 'if (d <= 3) cout << 10;\nelse cout << 10 + (d - 3) * 2;\ncout << endl;', lambda s: (lambda d: str(10 if d <= 3 else 10 + (d - 3) * 2))(nums(s)[0]), ['2', '3', '4', '10', '0'],
  lambda r: str(R(r,0,10**6)), why=lambda s: 'То 3 км нарх собит аст.')
P('w2d3-9', 'Баҳои ҳарфӣ', 'Хол s (0–100): 90+ → A, 80+ → B, 70+ → C, 60+ → D, вагарна F.', 'Як адад s.', 'Як ҳарф.',
  body(['s']) + 'if (s >= 90) cout << "A";\nelse if (s >= 80) cout << "B";\nelse if (s >= 70) cout << "C";\nelse if (s >= 60) cout << "D";\nelse cout << "F";\ncout << endl;',
  lambda s: (lambda x: 'A' if x >= 90 else 'B' if x >= 80 else 'C' if x >= 70 else 'D' if x >= 60 else 'F')(nums(s)[0]), ['95', '85', '75', '65', '50', '90', '89', '60', '59', '0'], why=lambda s: 'Аз калон ба хурд.')
P('w2d3-10', 'Тарифи телефон', 'Обунаи моҳона 50 сомонӣ, 100 дақиқа ройгон. Ҳар дақиқаи иловагӣ 1 сомонӣ. Барои m дақиқа чанд сомонӣ пардохт мешавад?', 'Як адад m (0 ≤ m ≤ 10⁶).', 'Як адад.',
  body(['m']) + 'if (m <= 100) cout << 50;\nelse cout << 50 + (m - 100);\ncout << endl;', lambda s: (lambda m: str(50 if m <= 100 else 50 + m - 100))(nums(s)[0]), ['80', '100', '150', '0'],
  lambda r: str(R(r,0,10**6)), why=lambda s: '100 дақиқа ройгон аст.')

H4 = ['&& — «ва»: ҳарду шарт дуруст бошанд.', '|| — «ё»: ақаллан яке дуруст бошад.', 'Шартҳои мураккабро бо қавсҳо ҷудо кунед.']
day(2, 4, '&& ва ||', 'cond', H4)
C('w2d4-1', 'Дар фосила?', 'Се адад x, a, b (a ≤ b). Агар a ≤ x ≤ b бошад YES, вагарна NO.', ['x', 'a', 'b'], 'x >= a && x <= b', 'a <= x <= b', 'YES', 'NO', 'Як сатр: x, a, b.',
  ['5 1 10', '0 1 10', '10 1 10', '1 1 10', '11 1 10'], lambda r: (lambda a: f'{R(r,-20,20)} {a} {a + R(r,0,20)}')(R(r,-20,20)))
C('w2d4-2', 'Соли кабиса', 'Соли y. Кабиса аст, агар ба 4 тақсим шавад ва ба 100 не, ё ба 400 тақсим шавад. YES ё NO.', ['y'], '(y % 4 == 0 && y % 100 != 0) || y % 400 == 0', '(y % 4 == 0 and y % 100 != 0) or y % 400 == 0', 'YES', 'NO',
  'Як адад y (1 ≤ y ≤ 10⁹).', ['2024', '2023', '1900', '2000', '2100', '2400'], lambda r: str(R(r,1,3000)))
C('w2d4-3', 'Рӯзи истироҳат', 'Рақами рӯзи ҳафта d (1–7). Шанбе (6) ва якшанбе (7) — WEEKEND, дигарон — WORKDAY.', ['d'], 'd == 6 || d == 7', 'd in (6, 7)', 'WEEKEND', 'WORKDAY', 'Як адад d.',
  [str(i) for i in [6, 1, 7, 2, 3, 4, 5]])
C('w2d4-4', 'Секунҷа ҳаст?', 'Се порча a, b, c. Агар аз онҳо секунҷа сохтан мумкин бошад (ҳар ду тараф якҷоя аз сеюм калонтар) YES, вагарна NO.', ['a', 'b', 'c'],
  'a + b > c && a + c > b && b + c > a', 'a + b > c and a + c > b and b + c > a', 'YES', 'NO', 'Як сатр: a, b, c (1 ≤ x ≤ 10⁹).',
  ['3 4 5', '1 2 3', '1 1 5', '5 5 5', '1000000000 1000000000 1000000000'], lambda r: ' '.join(str(R(r,1,10)) for _ in range(3)))
C('w2d4-5', 'Чиптаи ройгон', 'Синни a. Кӯдакони хурд аз 7 ва калонсолони 70+ ройгон (FREE), дигарон пардохт мекунанд (PAY).', ['a'], 'a < 7 || a >= 70', 'a < 7 or a >= 70', 'FREE', 'PAY', 'Як адад a (0 ≤ a ≤ 150).',
  ['5', '30', '70', '69', '7', '6'], lambda r: str(R(r,0,120)))
P('w2d4-6', 'Се адади баробар', 'Се адад. Агар ҳар се баробар бошанд ALL, агар маҳз ду баробар бошанд TWO, вагарна NONE.', 'Як сатр: a, b, c.', 'ALL, TWO ё NONE.',
  body(['a', 'b', 'c']) + 'if (a == b && b == c) cout << "ALL";\nelse if (a == b || b == c || a == c) cout << "TWO";\nelse cout << "NONE";\ncout << endl;',
  lambda s: (lambda a, b, c: 'ALL' if a == b == c else 'TWO' if a == b or b == c or a == c else 'NONE')(*nums(s)), ['5 5 5', '5 5 3', '1 2 3', '3 5 3', '2 7 7'], lambda r: ' '.join(str(R(r,1,3)) for _ in range(3)),
  why=lambda s: 'Аввал ҳолати «ҳар се» -ро тафтиш кунед.')
P('w2d4-7', 'Санаи дуруст', 'Рӯз d ва моҳ m (соли ғайрикабиса). Агар чунин сана вуҷуд дошта бошад YES, вагарна NO. Моҳҳои 4, 6, 9, 11 — 30 рӯз, феврал — 28, дигарон — 31.', 'Як сатр: d, m.', 'YES ё NO.',
  body(['d', 'm']) + 'long long mx = 31;\nif (m == 2) mx = 28;\nelse if (m == 4 || m == 6 || m == 9 || m == 11) mx = 30;\nif (m >= 1 && m <= 12 && d >= 1 && d <= mx) cout << "YES";\nelse cout << "NO";\ncout << endl;',
  lambda s: (lambda d, m: 'YES' if 1 <= m <= 12 and 1 <= d <= (28 if m == 2 else 30 if m in (4, 6, 9, 11) else 31) else 'NO')(*nums(s)),
  ['31 1', '30 2', '31 4', '28 2', '0 5', '15 13', '30 6', '31 12'], lambda r: f'{R(r,0,32)} {R(r,0,13)}', why=lambda s: 'Шумораи рӯзҳои моҳро муайян кунед.')
C('w2d4-8', 'Ранги хонаи шоҳмот', 'Хонаи тахтаи шоҳмот (x, y), 1 ≤ x, y ≤ 8. Хонаи (1,1) сиёҳ аст. Агар x + y ҷуфт бошад BLACK, вагарна WHITE.', ['x', 'y'], '(x + y) % 2 == 0', '(x + y) % 2 == 0', 'BLACK', 'WHITE', 'Як сатр: x, y.',
  ['1 1', '1 2', '8 8', '3 6'], lambda r: f'{R(r,1,8)} {R(r,1,8)}')
C('w2d4-9', 'Ҳаракати шоҳ', 'Шоҳ аз (x1, y1) ба (x2, y2) як қадам гузашта метавонад? (ҳар тараф ва диагонал, ба худи ҳамон ҷо не)', ['a', 'b', 'c', 'd'],
  '(a - c <= 1 && c - a <= 1) && (b - d <= 1 && d - b <= 1) && !(a == c && b == d)', 'abs(a - c) <= 1 and abs(b - d) <= 1 and not (a == c and b == d)', 'YES', 'NO',
  'Як сатр: x1 y1 x2 y2 (1–8).', ['4 4 5 5', '4 4 4 6', '1 1 1 1', '2 3 1 3'], lambda r: ' '.join(str(R(r,1,8)) for _ in range(4)))
C('w2d4-10', 'Ақаллан як ҷуфт', 'Ду адад. Агар ақаллан яке ҷуфт бошад YES, вагарна NO.', ['a', 'b'], 'a % 2 == 0 || b % 2 == 0', 'a % 2 == 0 or b % 2 == 0', 'YES', 'NO', 'Як сатр: a, b (|x| ≤ 10⁹).',
  ['3 5', '2 5', '4 6', '-3 -1', '0 7'], lambda r: f'{R(r,-50,50)} {R(r,-50,50)}')

H5 = ['Калонтаринро дар тағйирёбанда нигоҳ доред: mx = a; if (b > mx) mx = b; ...', 'Барои мураттаб кардан ҷойивазкунӣ (swap)-ро истифода баред.', 'Ҳар ҳолатро бо мисоли худ санҷед.']
day(2, 5, 'Масъалаҳои мураккаб', 'cond', H5)
P('w2d5-1', 'Калонтарини се адад', 'Се адад. Калонтаринро чоп кунед.', 'Як сатр: a, b, c (|x| ≤ 10⁹).', 'Як адад.',
  body(['a', 'b', 'c']) + 'long long mx = a;\nif (b > mx) mx = b;\nif (c > mx) mx = c;\ncout << mx << endl;', lambda s: str(max(nums(s))), ['1 5 3', '7 7 7', '-1 -5 -3', '3 1 2'],
  lambda r: ' '.join(str(R(r,-10**9,10**9)) for _ in range(3)), why=lambda s: f'Калонтарин — {max(nums(s))}.')
P('w2d5-2', 'Хурдтарини се адад', 'Се адад. Хурдтаринро чоп кунед.', 'Як сатр: a, b, c (|x| ≤ 10⁹).', 'Як адад.',
  body(['a', 'b', 'c']) + 'long long mn = a;\nif (b < mn) mn = b;\nif (c < mn) mn = c;\ncout << mn << endl;', lambda s: str(min(nums(s))), ['1 5 3', '7 7 7', '-1 -5 -3'],
  lambda r: ' '.join(str(R(r,-10**9,10**9)) for _ in range(3)), why=lambda s: f'Хурдтарин — {min(nums(s))}.')
P('w2d5-3', 'Се адад бо тартиб', 'Се адад. Онҳоро аз хурд ба калон чоп кунед.', 'Як сатр: a, b, c (|x| ≤ 10⁹).', 'Се адад.',
  body(['a', 'b', 'c']) + 'if (a > b) swap(a, b);\nif (b > c) swap(b, c);\nif (a > b) swap(a, b);\ncout << a << " " << b << " " << c << endl;', lambda s: ' '.join(map(str, sorted(nums(s)))),
  ['3 1 2', '1 2 3', '5 5 1', '-1 -3 -2'], lambda r: ' '.join(str(R(r,-100,100)) for _ in range(3)), why=lambda s: 'Се ҷойивазкунӣ кифоя аст.')
P('w2d5-4', 'Адади миёна', 'Се адади гуногун. Онеро, ки на калонтарин ва на хурдтарин аст, чоп кунед.', 'Як сатр: a, b, c.', 'Як адад.',
  body(['a', 'b', 'c']) + 'if ((a > b && a < c) || (a < b && a > c)) cout << a;\nelse if ((b > a && b < c) || (b < a && b > c)) cout << b;\nelse cout << c;\ncout << endl;',
  lambda s: str(sorted(nums(s))[1]), ['3 1 2', '1 2 3', '10 30 20', '-5 0 5'], lambda r: ' '.join(map(str, r.sample(range(-100, 100), 3))), why=lambda s: f'Миёна — {sorted(nums(s))[1]}.')
P('w2d5-5', 'Навъи секунҷа', 'Тарафҳои a, b, c. NO — секунҷа нест, EQUILATERAL — ҳар се баробар, ISOSCELES — ду баробар, SCALENE — ҳама гуногун.', 'Як сатр: a, b, c (1 ≤ x ≤ 10⁹).', 'Як калима.',
  body(['a', 'b', 'c']) + 'if (a + b <= c || a + c <= b || b + c <= a) cout << "NO";\nelse if (a == b && b == c) cout << "EQUILATERAL";\nelse if (a == b || b == c || a == c) cout << "ISOSCELES";\nelse cout << "SCALENE";\ncout << endl;',
  lambda s: (lambda a, b, c: 'NO' if a + b <= c or a + c <= b or b + c <= a else 'EQUILATERAL' if a == b == c else 'ISOSCELES' if a == b or b == c or a == c else 'SCALENE')(*nums(s)),
  ['3 4 5', '2 2 3', '1 2 3', '5 5 5', '1000000000 1000000000 1'], lambda r: ' '.join(str(R(r,1,8)) for _ in range(3)), why=lambda s: 'Аввал санҷед, ки секунҷа ҳаст.')
C('w2d5-6', 'Расм ба қуттӣ мегунҷад?', 'Расм a×b, қуттӣ c×d. Расмро гардондан мумкин. Агар расм дар қуттӣ ҷой шавад (a ≤ c ва b ≤ d ё a ≤ d ва b ≤ c) YES, вагарна NO.', ['a', 'b', 'c', 'd'],
  '(a <= c && b <= d) || (a <= d && b <= c)', '(a <= c and b <= d) or (a <= d and b <= c)', 'YES', 'NO', 'Як сатр: a b c d (1–10⁹).', ['3 5 5 3', '3 5 4 4', '1 1 1 1', '6 2 3 7'],
  lambda r: ' '.join(str(R(r,1,10)) for _ in range(4)))
P('w2d5-7', 'Тахфиф дар мағоза', 'Харид s сомонӣ. Агар s ≥ 1000 — тахфифи 10%, агар s ≥ 500 — 5%, вагарна тахфиф нест. Пардохтро (қисми бутун) чоп кунед.', 'Як адад s (0 ≤ s ≤ 10⁹).', 'Як адад.',
  body(['s']) + 'if (s >= 1000) cout << s * 90 / 100;\nelse if (s >= 500) cout << s * 95 / 100;\nelse cout << s;\ncout << endl;',
  lambda s: (lambda x: str(x * 90 // 100 if x >= 1000 else x * 95 // 100 if x >= 500 else x))(nums(s)[0]), ['1200', '600', '100', '1000', '500', '499', '999'], lambda r: str(R(r,0,5000)),
  why=lambda s: 'Сарҳадҳои 500 ва 1000.')
P('w2d5-8', 'Рӯзҳои сол', 'Соли y. Агар кабиса бошад 366, вагарна 365 чоп кунед.', 'Як адад y (1 ≤ y ≤ 10⁹).', 'Як адад.',
  body(['y']) + 'if ((y % 4 == 0 && y % 100 != 0) || y % 400 == 0) cout << 366;\nelse cout << 365;\ncout << endl;',
  lambda s: (lambda y: '366' if (y % 4 == 0 and y % 100 != 0) or y % 400 == 0 else '365')(nums(s)[0]), ['2024', '2023', '1900', '2000'], lambda r: str(R(r,1,3000)), why=lambda s: 'Қоидаи соли кабиса.')
P('w2d5-9', 'Рӯзҳои моҳ', 'Моҳ m ва соли y. Дар ин моҳ чанд рӯз ҳаст?', 'Як сатр: m, y.', 'Як адад.',
  body(['m', 'y']) + 'bool leap = (y % 4 == 0 && y % 100 != 0) || y % 400 == 0;\nif (m == 2) cout << (leap ? 29 : 28);\nelse if (m == 4 || m == 6 || m == 9 || m == 11) cout << 30;\nelse cout << 31;\ncout << endl;',
  lambda s: (lambda m, y: str((29 if (y % 4 == 0 and y % 100 != 0) or y % 400 == 0 else 28) if m == 2 else 30 if m in (4, 6, 9, 11) else 31))(*nums(s)),
  ['2 2024', '2 2023', '4 2025', '1 2025', '2 1900', '2 2000', '12 2025'], lambda r: f'{R(r,1,12)} {R(r,1,3000)}', why=lambda s: 'Феврал — алоҳида.')
P('w2d5-10', 'Калон ва хурд аз чор', 'Чор адад. Калонтарин ва хурдтаринро бо фосила чоп кунед.', 'Як сатр: чор адад (|x| ≤ 10⁹).', 'Ду адад.',
  body(['a', 'b', 'c', 'd']) + 'long long mx = a, mn = a;\nif (b > mx) mx = b;\nif (c > mx) mx = c;\nif (d > mx) mx = d;\nif (b < mn) mn = b;\nif (c < mn) mn = c;\nif (d < mn) mn = d;\ncout << mx << " " << mn << endl;',
  lambda s: f'{max(nums(s))} {min(nums(s))}', ['1 2 3 4', '5 5 5 5', '-1 7 -9 0'], lambda r: ' '.join(str(R(r,-10**9,10**9)) for _ in range(4)), why=lambda s: f'{max(nums(s))} ва {min(nums(s))}')

day(2, 6, 'Имтиҳони ҳафтаи 2', 'cond', H5, kind='exam')
P('w2e-1', 'Аломат ва ҷуфтӣ', 'Адади n (≠ 0). Аввал POSITIVE ё NEGATIVE, баъд бо фосила EVEN ё ODD чоп кунед.', 'Як адад n.', 'Ду калима.',
  body(['n']) + 'if (n > 0) cout << "POSITIVE ";\nelse cout << "NEGATIVE ";\nif (n % 2 == 0) cout << "EVEN";\nelse cout << "ODD";\ncout << endl;',
  lambda s: (lambda n: ('POSITIVE ' if n > 0 else 'NEGATIVE ') + ('EVEN' if n % 2 == 0 else 'ODD'))(nums(s)[0]), ['4', '-3', '7', '-8'], lambda r: str(r.choice([-1, 1]) * R(r,1,10**6)), why=lambda s: 'Ду шарти ҷудогона.')
P('w2e-2', 'Тарифи барқ', 'То 200 кВт·с — 1 сомонӣ барои ҳар кВт·с, аз 200 боло — 2 сомонӣ барои ҳар кВт·с-и иловагӣ. Истеъмол k. Пардохтро ёбед.', 'Як адад k (0 ≤ k ≤ 10⁹).', 'Як адад.',
  body(['k']) + 'if (k <= 200) cout << k;\nelse cout << 200 + (k - 200) * 2;\ncout << endl;', lambda s: (lambda k: str(k if k <= 200 else 200 + (k - 200) * 2))(nums(s)[0]), ['150', '200', '250', '0'],
  lambda r: str(R(r,0,10**6)), why=lambda s: 'Ду қисм.')
P('w2e-3', 'Фарқи калон ва хурд', 'Се адад. Фарқи калонтарин ва хурдтаринро чоп кунед.', 'Як сатр: a, b, c (|x| ≤ 10⁹).', 'Як адад.',
  body(['a', 'b', 'c']) + 'long long mx = a, mn = a;\nif (b > mx) mx = b;\nif (c > mx) mx = c;\nif (b < mn) mn = b;\nif (c < mn) mn = c;\ncout << mx - mn << endl;',
  lambda s: str(max(nums(s)) - min(nums(s))), ['1 5 3', '2 2 2', '-10 10 0'], lambda r: ' '.join(str(R(r,-10**9,10**9)) for _ in range(3)), why=lambda s: 'Калонтарин − хурдтарин.')
P('w2e-4', 'Санаи дуруст бо соли кабиса', 'Рӯз d, моҳ m, сол y. Агар сана дуруст бошад YES, вагарна NO.', 'Як сатр: d m y (1 ≤ y ≤ 10⁹).', 'YES ё NO.',
  body(['d', 'm', 'y']) + 'bool leap = (y % 4 == 0 && y % 100 != 0) || y % 400 == 0;\nlong long mx = 31;\nif (m == 2) mx = leap ? 29 : 28;\nelse if (m == 4 || m == 6 || m == 9 || m == 11) mx = 30;\nif (m >= 1 && m <= 12 && d >= 1 && d <= mx) cout << "YES";\nelse cout << "NO";\ncout << endl;',
  lambda s: (lambda d, m, y: 'YES' if 1 <= m <= 12 and 1 <= d <= ((29 if (y % 4 == 0 and y % 100 != 0) or y % 400 == 0 else 28) if m == 2 else 30 if m in (4, 6, 9, 11) else 31) else 'NO')(*nums(s)),
  ['29 2 2024', '29 2 2023', '31 4 2025', '31 12 2025', '29 2 1900', '29 2 2000'], lambda r: f'{R(r,0,32)} {R(r,0,13)} {R(r,1900,2100)}', why=lambda s: 'Моҳ, рӯз ва соли кабиса.')
P('w2e-5', 'Калкулятори бехатар', 'Ифода «a op b» (op: + - * /). Агар тақсим ба сифр бошад ERROR чоп кунед, вагарна натиҷаро (тақсим бутун, ададҳо ғайриманфӣ).', 'Як сатр: a op b.', 'Адад ё ERROR.',
  'long long a, b;\nchar op;\ncin >> a >> op >> b;\nif (op == \'+\') cout << a + b;\nelse if (op == \'-\') cout << a - b;\nelse if (op == \'*\') cout << a * b;\nelse if (b == 0) cout << "ERROR";\nelse cout << a / b;\ncout << endl;',
  lambda s: (lambda a, op, b: str(a + b) if op == '+' else str(a - b) if op == '-' else str(a * b) if op == '*' else 'ERROR' if b == 0 else str(a // b))(int(s.split()[0]), s.split()[1], int(s.split()[2])),
  ['8 / 0', '8 / 3', '2 * 3', '5 - 9'], lambda r: f"{R(r,0,100)} {r.choice('+-*/')} {R(r,0,5)}", why=lambda s: 'Тақсим ба сифрро алоҳида тафтиш кунед.')
