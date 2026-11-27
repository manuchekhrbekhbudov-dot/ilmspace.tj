// Шарҳи кӯтоҳи тоҷикӣ барои хатоҳои шинохташудаи g++. Паёми аслӣ ҳамеша нигоҳ дошта мешавад;
// рақами сатр танҳо аз паёми воқеии компилятор гирифта мешавад.
const RULES = [
  [/expected (?:['‘],['’] or )?['‘]?;['’]? before/, () => 'Нуқтавергул (;) намерасад. Охири сатри пешинаро тафтиш кун.'],
  [/expected initializer before/, () => 'Эълони тағйирёбанда дар сатри пешина тамом нашудааст — эҳтимол нуқтавергул (;) намерасад.'],
  [/expected ['‘]?;['’]? at end of/, () => 'Нуқтавергул (;) дар охири эълон намерасад.'],
  [/expected ['‘]?\}['’]? at end of input/, () => 'Қавси пӯшандаи } намерасад. Ҳар { бояд ҷуфти худро дошта бошад.'],
  [/expected ['‘]?\)['’]?/, () => 'Қавси пӯшандаи ) намерасад.'],
  [/expected primary-expression before/, () => 'Дар ин ҷо ифода интизор буд. Шояд аломат ё тағйирёбанда фаромӯш шудааст.'],
  [/['‘](cout|cin|endl|string|vector)['’] was not declared/, m => `«${m[1]}» эълон нашудааст. #include-и лозимӣ ва «using namespace std;»-ро тафтиш кун.`],
  [/['‘]([^'’]+)['’] was not declared in this scope/, m => `Ном «${m[1]}» эълон нашудааст. Шояд хато навишта шудааст ё тағйирёбанда пеш аз истифода эълон нагардидааст.`],
  [/missing terminating " character/, () => 'Нохунаки (") пӯшанда намерасад — матн дар қавсҳои дутоӣ пӯшида нашудааст.'],
  [/missing terminating ' character/, () => "Нохунаки якто (') пӯшида нашудааст. Барои матн нохунаки дутоӣ (\") истифода бар."],
  [/no match for ['‘]operator(>>|<<)['’]/, m => `Амали «${m[1]}» барои ин навъ кор намекунад. Ба самти тир (cin >>, cout <<) ва навъи тағйирёбанда нигоҳ кун.`],
  [/invalid conversion from|cannot convert/, () => 'Навъҳо мувофиқ нестанд: як навъро ба навъи дигар бевосита гузоштан мумкин нест.'],
  [/['‘]([^'’]+)['’] does not name a type/, m => `«${m[1]}» ҳамчун навъ шинохта нашуд. Навиштан ё #include-ро тафтиш кун.`],
  [/redeclaration of|conflicting declaration/, () => 'Ин ном ду бор эълон шудааст. Номи дигар интихоб кун ё эълони дуюмро хориҷ кун.'],
  [/lvalue required as left operand of assignment/, () => 'Ба чапи «=» танҳо тағйирёбанда навишта мешавад. Барои муқоиса «==» лозим аст.'],
  [/else['’]? without a previous ['‘]?if/, () => '«else» бе «if»-и мувофиқ аст. Шояд пас аз if() нуқтавергули зиёдатӣ ё қавс намерасад.'],
  [/stray ['‘]\\?\d*['’]? in program|stray ['‘].['’] in program/, () => 'Дар код аломати бегона ҳаст (шояд нохунаки «“» ё ҳарфи кириллӣ берун аз матн).'],
  [/too few arguments to function|too many arguments to function/, () => 'Шумораи аргументҳо ба эълони функсия мувофиқ нест.'],
  [/no return statement|control reaches end of non-void function/, () => 'Функсия бояд қимат баргардонад (return).'],
  [/'main' must return 'int'|‘::main’ must return ‘int’/, () => 'main бояд навъи int дошта бошад: int main() { … }'],
];

export function explainCompile(msg) {
  const out = [];
  if (!msg) return out;
  const re = /^(?:.*?main\.cpp):(\d+):(\d+):\s+(error|fatal error):\s+(.*)$/gm;
  let m;
  while ((m = re.exec(msg)) && out.length < 6) {
    const text = m[4];
    let tj = null;
    for (const [rx, f] of RULES) { const mm = text.match(rx); if (mm) { tj = f(mm); break; } }
    out.push({ line: Number(m[1]), col: Number(m[2]), original: text, tj });
  }
  return out;
}

export function explainRuntime(r) {
  if (!r) return null;
  if (r.status === 'TLE') return 'Барнома аз маҳдудияти вақт гузашт. Шояд давр беохир аст ё алгоритм хеле суст.';
  if (r.status === 'MLE') return 'Барнома аз маҳдудияти хотира гузашт.';
  if (r.status === 'OLE') return 'Барнома аз ҳад зиёд матн чоп кард (зиёда аз 64 КБ).';
  if (r.status === 'RE') {
    if (r.signal === 'SIGSEGV' || r.exitCode === 139) return 'Хатои вақти иҷро: муроҷиат ба хотираи нодуруст (масалан, берун аз ҳудуди массив).';
    if (r.signal === 'SIGFPE' || r.exitCode === 136) return 'Хатои вақти иҷро: тақсим ба сифр.';
    if (r.signal === 'SIGABRT' || r.exitCode === 134) return 'Хатои вақти иҷро: барнома худаш қатъ шуд (abort).';
    return `Хатои вақти иҷро: барнома бо рамзи ${r.exitCode ?? r.signal} анҷом ёфт (бояд 0 бошад).`;
  }
  return null;
}
