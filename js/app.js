/**
 * Генератор номеров РФ / Беларуси
 * Система баланса, коллекции, магазина — всё на localStorage (cookies-like)
 * Добавлена раздельная прокрутка букв и цифр за отдельную плату.
 */

(function () {
  'use strict';

  // ===== SOUNDS =====
  // Звуки генерируются программно через WebAudio, поэтому отдельные файлы не нужны.
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function playTone(freq, duration, type = 'sine', volume = 0.06, slideTo = null) {
    if (!state.sound) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) { /* audio не критичен */ }
  }

  const sounds = {
    click: () => playTone(660, 0.05, 'sine', 0.04),
    spinStart: () => playTone(180, 0.18, 'sawtooth', 0.03, 420),
    spinStop: () => playTone(520, 0.09, 'triangle', 0.05, 320),
    buy: () => { playTone(523, 0.1, 'sine', 0.05); setTimeout(() => playTone(784, 0.14, 'sine', 0.05), 90); },
    rare: () => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.2, 'triangle', 0.05), i * 110)); },
    scrollTick: () => playTone(1200, 0.02, 'square', 0.015)
  };

  const playSound = (fn) => { if (typeof fn === 'function') fn(); };

  // ===== CONSTANTS =====
  const SPIN_COST = 50;
  const SPIN_LETTERS_COST = 25;
  const SPIN_DIGITS_COST = 25;
  // Буквы, разрешённые ГОСТ 5229 (совпадают с латинскими): А В Е К М Н О Р С Т У Х
  const RU_LETTERS = ['А', 'В', 'Е', 'К', 'М', 'Н', 'О', 'Р', 'С', 'Т', 'У', 'Х'];
  const BY_LETTERS = ['A', 'B', 'E', 'K', 'M', 'H', 'O', 'P', 'C', 'T', 'X'];
  const BY_REGIONS = ['1', '2', '3', '4', '5', '6', '7'];
  const KZ_REGIONS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];
  const AM_REGIONS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'];
  const KG_REGIONS = ['01', '02', '03', '04', '05', '06', '07', '08', '09'];

// Типы бонусов рамок:
  //   luck    — шанс дублировать символ (удача на одинаковые)
  //   speed   — ускорение прокрутки (− индекс в SPEEDS)
  //   value   — множитель итоговой цены номера
  //   xp      — прирост к заработку с продаж
  //   bonus   — скидка на стоимость прокрутки
  //   streak  — шанс на джекпот-комбинацию
  // Все рамки светлые: фон номера всегда светлый, чтобы чёрные символы оставались читаемыми.
// Цвет градиента — только декоративная окантовка и акцент.
  const SHOP_ITEMS = [
    {
      id: 'frame_default', name: 'Стандарт', desc: 'Базовый белый номер без бонусов',
      price: 0, color: '#cbd5e1', bonus: {}
    },
    {
      id: 'frame_carbon', name: 'Карбон', desc: 'Светло-серый карбоновый отлив',
      price: 750000, color: '#94a3b8',
      gradient: 'linear-gradient(135deg, #f1f5f9, #cbd5e1, #f8fafc)',
      bonus: { luck: 0.05, value: 1.05 }
    },
    {
      id: 'frame_military', name: 'Военный', desc: 'Светлый оливковый камуфляж',
      price: 2500000, color: '#84a948',
      gradient: 'linear-gradient(135deg, #f7fae8, #dce8b0, #eef3d4)',
      bonus: { speed: 1, luck: 0.08 }
    },
    {
      id: 'frame_neon', name: 'Неон Синий', desc: 'Голубой свечение по краям',
      price: 8000000, color: '#38bdf8', glow: true,
      gradient: 'linear-gradient(135deg, #f0f9ff, #dbeefe, #f7fcff)',
      bonus: { speed: 1, value: 1.25, luck: 0.10 }
    },
    {
      id: 'frame_gta', name: 'GTA Vibe', desc: 'Светлый персиково-оранжевый Los Santos',
      price: 20000000, color: '#fb923c',
      gradient: 'linear-gradient(135deg, #fff7ed, #fed7aa, #fff1e0)',
      bonus: { value: 1.5, speed: 1, xp: 0.15 }
    },
    {
      id: 'frame_anime', name: 'Аниме Sakura', desc: 'Розово-сиреневый градиент',
      price: 60000000, color: '#f472b6',
      gradient: 'linear-gradient(135deg, #fdf2f8, #fbcfe8, #fae8ff)',
      bonus: { luck: 0.22, value: 1.35, speed: 1, streak: 0.08 }
    },
    {
      id: 'frame_russia', name: 'Триколор', desc: 'Бело-красно-синяя окантовка',
      price: 120000000, color: '#2563eb',
      gradient: 'linear-gradient(90deg, #ffffff 0%, #ffffff 45%, #dbeafe 45%, #dbeafe 70%, #fee2e2 70%)',
      bonus: { value: 2.0, xp: 0.25, bonus: 0.2, streak: 0.1 }
    },
    {
      id: 'frame_cyber', name: 'Cyberpunk', desc: 'Мятное свечение, светлый фон',
      price: 500000000, color: '#10b981', glow: true,
      gradient: 'linear-gradient(135deg, #ecfdf5, #c7f9e4, #f2fffb)',
      bonus: { luck: 0.35, value: 2.2, speed: 2, streak: 0.15, bonus: 0.25 }
    },
    {
      id: 'frame_chrome', name: 'Хром', desc: 'Зеркальный серебристый блеск',
      price: 1500000000, color: '#94a3b8',
      gradient: 'linear-gradient(135deg, #ffffff, #e2e8f0, #f8fafc, #eef2f7)',
      bonus: { luck: 0.45, value: 2.8, speed: 2, xp: 0.4, streak: 0.2, bonus: 0.35 }
    },
    {
      id: 'frame_legend', name: 'Легенда', desc: 'Радужный титан — абсолютная редкость',
      price: 10000000000, color: '#e879f9', glow: true,
      gradient: 'linear-gradient(115deg, #fdf4ff, #ffe4f0, #e0f2fe, #ede9fe, #fffbeb)',
      bonus: { luck: 0.60, value: 4.0, speed: 2, xp: 0.6, streak: 0.3, bonus: 0.5 }
    }
  ];

  // ===== STATE =====
  const SPEEDS = [
    { label: 'Плавно', tick: 110, stagger: 220 },
    { label: 'Обычно', tick: 70, stagger: 150 },
    { label: 'Быстро', tick: 40, stagger: 80 }
  ];

  let state = {
    balance: 1000,
    spins: 0,
    rareCount: 0,
    earned: 0,
    country: 'ru',
    type: 'car',
    region: '77',
    currentPlate: null,
    inventory: [],
    ownedFrames: ['frame_default'],
    activeFrame: 'frame_default',
    history: [],
    sound: true,
    speed: 1,
    theme: 'dark',
    lastDaily: null
  };

  // ===== DOM =====
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ===== PERSISTENCE (localStorage as cookie-like) =====
  function saveState() {
    try {
      localStorage.setItem('plateGen_v1', JSON.stringify(state));
    } catch (e) {
      console.warn('Save failed', e);
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem('plateGen_v1');
      if (raw) {
        const saved = JSON.parse(raw);
        state = { ...state, ...saved };
      }
    } catch (e) {
      console.warn('Load failed', e);
    }
  }

// ===== VALUE SYSTEM =====
  // Ориентиры по рынку РФ (серый рынок + стартовые цены аукционов, 2025–2026):
  //   обычная комбинация ............ 5 000 ₽
  //   пара одинаковых букв ......... ~200 000 ₽
  //   «лесенка» .................... до 100 000 ₽
  //   зеркальные цифры ............. 100 000 – 200 000 ₽
  //   одинаковые цифры (777) ....... от 150 000 ₽
  //   одинаковые буквы + 00X ....... 300 000 – 450 000 ₽
  //   ААА 777 ...................... от 600 000 ₽
  //   топ серого рынка ............. до 2,1 млрд ₽
  //   московские регионы ........... множитель ×2 – ×8

  const MOSCOW_REGIONS = ['77', '97', '99', '177', '197', '199', '777'];

  function countRepeats(str) {
    const counts = {};
    let maxRun = 1;
    let cur = 1;
    for (let i = 0; i < str.length; i++) {
      counts[str[i]] = (counts[str[i]] || 0) + 1;
      if (i > 0 && str[i] === str[i - 1]) {
        cur++;
        maxRun = Math.max(maxRun, cur);
      } else {
        cur = 1;
      }
    }
    const values = Object.values(counts);
    return { unique: values.length, maxCount: Math.max(...values, 0), maxRun };
  }

  // Уровень «красивости» цифр: 0 — обычные, 4 — максимум
  function digitTier(digits) {
    if (!digits) return 0;
    const { maxRun, maxCount } = countRepeats(digits);

    // Полностью одинаковые: 000, 777, 666
    if (new Set(digits).size === 1 || maxRun >= 3) return 4;

    // Х00 и 001–009 — модельные, дороже обычной лесенки
    if (/^[1-9]00$/.test(digits) || /^0*([1-9])$/.test(digits)) return 3;

    // Зеркальные: 353, 767
    if (digits.length >= 3 && digits[0] === digits[digits.length - 1]) return 3;

    // Лесенки: 123, 234 ... и обратные 321, 432 ...
    const d = digits.split('').map(Number);
    const isSeq = d.length >= 3 && d.every((v, i) => i === 0 || v - d[i - 1] === 1);
    const isDesc = d.length >= 3 && d.every((v, i) => i === 0 || d[i - 1] - v === 1);
    if (isSeq || isDesc) return 2;

    // Пара одинаковых подряд: 11, 22
    if (maxRun >= 2 || maxCount >= 2) return 1;

    return 0;
  }

  // Уровень «красивости» букв: 0 — обычные, 3 — все три одинаковые
  function letterTier(letters) {
    if (!letters) return 0;
    const { maxRun, maxCount } = countRepeats(letters);
    if (maxCount >= 3 || new Set(letters).size === 1) return 3;
    if (maxCount >= 2 || maxRun >= 2) return 2;
    return 1;
  }

  function evaluatePlate(plate) {
    const digits = plate.digits || '';
    const letters = plate.letters || '';

    const dTier = digitTier(digits);
    const lTier = letterTier(letters);

    // Практическая таблица цен (до региональной надбавки).
    // Строки — класс цифр, столбцы — класс букв:
    //   1 — все буквы разные, 2 — две совпадают, 3 — все три одинаковые
    const PRICE_TABLE = [
      //  lvl1      lvl2      lvl3
      [   5000,    40000,   200000],  // обычные цифры
      [  30000,    90000,   300000],  // пара одинаковых
      [  80000,   180000,   400000],  // лесенка
      [ 110000,   300000,   450000],  // зеркало / X00 / 001-009
      [ 150000,   400000,   600000],  // все цифры одинаковые
    ];

    let value = PRICE_TABLE[dTier][lTier - 1];

    // Разброс внутри класса, чтобы цены не были одинаковыми
    const jitter = 0.88 + Math.random() * 0.24;
    value = Math.round(value * jitter);

    // Региональная надбавка: чем дороже комбинация, тем сильнее прибавка региона
    if (MOSCOW_REGIONS.includes(String(plate.region))) {
      const codeMult = { '77': 3, '97': 4, '99': 4, '177': 5, '197': 5, '199': 5, '777': 5 }[String(plate.region)] || 3;
      const m = codeMult + dTier * 0.9;
      value = Math.round(value * m);
    }

    // Неразрешённые буквы не выпадают, но подстрахуемся
    if (plate.country !== 'ru') value = Math.round(value * 0.7);

    // Множитель цены от активной рамки
    const valueMult = getValueBonus();
    if (valueMult > 1) value = Math.round(value * valueMult);

    // Джекпот: у топовых комбинаций разброс до десятков миллионов
    if (dTier === 4 && lTier === 3) {
      value = Math.round(value * (2 + Math.random() * 12));
    }

    // Шанс «усиленного» номера: рамка может подтолкнуть комбинацию на ступень выше
    const streak = getStreakBonus();
    if (streak > 0 && Math.random() < streak) {
      value = Math.round(value * (1.8 + Math.random() * 1.6));
    }

    // Потолок: выше 2,1 млрд рынка не существует
    value = Math.min(value, 2100000000);
    value = Math.max(1000, value);

    // Редкость — по итоговой цене
    let rarity, rarityLabel;
    if (value >= 3000000)      { rarity = 'legendary'; rarityLabel = 'Легендарный'; }
    else if (value >= 1000000) { rarity = 'epic';      rarityLabel = 'Эпический'; }
    else if (value >= 450000)  { rarity = 'rare';      rarityLabel = 'Редкий'; }
    else if (value >= 80000)   { rarity = 'uncommon';  rarityLabel = 'Необычный'; }
    else                       { rarity = 'common';    rarityLabel = 'Обычный'; }

    return { value, rarity, rarityLabel };
  }

  // ===== GENERATORS =====
  function activeItem() {
    return SHOP_ITEMS.find(i => i.id === state.activeFrame) || SHOP_ITEMS[0];
  }

  function getBonus(key) {
    const b = activeItem().bonus;
    return b && typeof b[key] === 'number' ? b[key] : 0;
  }

  function getLuckBonus() {
    return getBonus('luck');
  }

  function getSpeedBonus() {
    return getBonus('speed');
  }

  function getValueBonus() {
    return getBonus('value');
  }

  function getXpBonus() {
    return getBonus('xp');
  }

  function getDiscount() {
    return getBonus('bonus');
  }

  function getStreakBonus() {
    return getBonus('streak');
  }

  // Стоимость прокрутки с учётом скидки от рамки
  function spinCost(mode) {
    const base = mode === 'full' ? SPIN_COST
               : mode === 'letters' ? SPIN_LETTERS_COST
               : SPIN_DIGITS_COST;
    return Math.max(1, Math.round(base * (1 - getDiscount())));
  }

  // Рабочий набор символов текущей крутки.
  // Повторы внутри номера запрещены: каждый символ выбирается из ещё не использованных.
  // Удаче рамки остаётся отдельный путь — намеренный «счастливый» бросок красивого паттерна.
  let spinPool = { usedDigits: [], usedLetters: [] };

  // Готовые красивые блоки цифр для счастливого броска
  const LUCKY_DIGIT_SETS = ['000', '111', '222', '333', '444', '555', '666', '777', '888', '999'];
  const LUCKY_DIGIT_MODELS = ['001', '002', '003', '007', '100', '200', '300', '500', '700', '900'];
  const LUCKY_DIGIT_SEQS = ['123', '234', '345', '456', '567', '678', '789'];
  const LUCKY_LETTER_SETS = ['ААА', 'ВВВ', 'ЕЕЕ', 'ККК', 'МММ', 'ННН', 'ООО', 'РРР', 'ССС', 'ТТТ', 'УУУ', 'ХХХ'];

  function resetSpinPool(plate) {
    // При частичной прокрутки стартовый набор — символы текущего номера
    spinPool = {
      usedDigits: plate && plate.digits ? plate.digits.split('') : [],
      usedLetters: plate && plate.letters ? plate.letters.split('') : []
    };
    // Оставляем только уникальные: дубли из старого номера не должны блокировать бросок
    spinPool.usedDigits = Array.from(new Set(spinPool.usedDigits));
    spinPool.usedLetters = Array.from(new Set(spinPool.usedLetters));
  }

  // Выбирает символ из тех, что ещё не выпали. Если свободных нет — любой.
  function pickUnused(pool, used) {
    const free = pool.filter(c => !used.includes(c));
    const list = free.length ? free : pool;
    return list[Math.floor(Math.random() * list.length)];
  }

  function randLetter(pool) {
    const c = pickUnused(pool, spinPool.usedLetters);
    spinPool.usedLetters.push(c);
    return c;
  }

  function randDigit() {
    const c = pickUnused('0123456789'.split(''), spinPool.usedDigits);
    spinPool.usedDigits.push(c);
    return c;
  }

  // Счастливый бросок: возвращает готовый красивый блок или null.
  // Срабатывает с шансом удачи активной рамки — так дорогие рамки реально дают 777 и ААА.
  // Шансы намеренно небольшие: повторы должны быть редкостью, а не основой генерации.
  function tryLuckyDigits(count) {
    const luck = getLuckBonus() * 0.20;
    if (luck <= 0 || Math.random() >= luck) return null;

    const dice = Math.random();
    let base;
    if (dice < 0.5) {
      base = LUCKY_DIGIT_SETS[Math.floor(Math.random() * LUCKY_DIGIT_SETS.length)];
    } else if (dice < 0.85) {
      base = LUCKY_DIGIT_MODELS[Math.floor(Math.random() * LUCKY_DIGIT_MODELS.length)];
    } else {
      base = LUCKY_DIGIT_SEQS[Math.floor(Math.random() * LUCKY_DIGIT_SEQS.length)];
    }

    // Добиваем до нужной длины уникальными символами (для 4-значных номеров)
    let set = base.split('');
    let guard = 0;
    while (set.length < count && guard++ < 50) {
      const extra = pickUnused('0123456789'.split(''), set);
      set.push(extra);
    }
    set = set.slice(0, count);
    spinPool.usedDigits = Array.from(new Set(set));
    return set;
  }

  // Счастливый бросок букв (ААА, ВВВ, …)
  function tryLuckyLetters(count) {
    const luck = getLuckBonus() * 0.14;
    if (luck <= 0 || Math.random() >= luck) return null;

    const set = [];
    if (count === 1) {
      set.push(pickUnused(RU_LETTERS, []));
    } else if (count === 2) {
      const L = LUCKY_LETTER_SETS[Math.floor(Math.random() * LUCKY_LETTER_SETS.length)];
      set.push(L[0], L[0]);
      // вторая буква — другая, чтобы не было двух одинаковых пар подряд
      const second = pickUnused(RU_LETTERS, [L[0]]);
      set[1] = second;
    } else {
      const L = LUCKY_LETTER_SETS[Math.floor(Math.random() * LUCKY_LETTER_SETS.length)];
      set.push(L[0], L[0], L[0]);
    }
    spinPool.usedLetters = Array.from(new Set(set));
    return set;
  }

  function generateRuCar(region) {
    // Сначала буквы, затем цифры — так красивые блоки не конфликтуют друг с другом
    const luckyLetters = tryLuckyLetters(3);
    const L = luckyLetters || [randLetter(RU_LETTERS), randLetter(RU_LETTERS), randLetter(RU_LETTERS)];
    const L1 = L[0], L2 = L[1], L3 = L[2];

    const luckyDigits = tryLuckyDigits(3);
    const D = luckyDigits || [randDigit(), randDigit(), randDigit()];
    const D1 = D[0], D2 = D[1], D3 = D[2];

    const digits = D1 + D2 + D3;
    const letters = L1 + L2 + L3;
    const display = `${L1} ${digits} ${L2}${L3} ${region}`;
    const plate = {
      country: 'ru',
      type: 'car',
      region,
      chars: [L1, D1, D2, D3, L2, L3],
      digits,
      letters,
      display,
      id: `ru-car-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    };
    const eval_ = evaluatePlate(plate);
    return { ...plate, ...eval_ };
  }

  function generateRuMoto(region) {
    const luckyDigits = tryLuckyDigits(4);
    const D = luckyDigits || [randDigit(), randDigit(), randDigit(), randDigit()];
    const D1 = D[0], D2 = D[1], D3 = D[2], D4 = D[3];

    const luckyLetters = tryLuckyLetters(2);
    const L = luckyLetters || [randLetter(RU_LETTERS), randLetter(RU_LETTERS)];
    const L1 = L[0], L2 = L[1];

    const digits = D1 + D2 + D3 + D4;
    const letters = L1 + L2;
    const display = `${digits} ${L1}${L2} ${region}`;
    const plate = {
      country: 'ru',
      type: 'moto',
      region,
      chars: [D1, D2, D3, D4, L1, L2],
      digits,
      letters,
      display,
      id: `ru-moto-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    };
    const eval_ = evaluatePlate(plate);
    return { ...plate, ...eval_ };
  }

  function generateBy(regionDigit, type) {
    const luckyDigits = tryLuckyDigits(4);
    const D = luckyDigits || [randDigit(), randDigit(), randDigit(), randDigit()];
    const D1 = D[0], D2 = D[1], D3 = D[2], D4 = D[3];

    const L = [randLetter(BY_LETTERS), randLetter(BY_LETTERS)];
    const L1 = L[0], L2 = L[1];

    const R = regionDigit || BY_REGIONS[Math.floor(Math.random() * BY_REGIONS.length)];
    const digits = D1 + D2 + D3 + D4;
    const letters = L1 + L2;
    const display = `${digits} ${L1}${L2}-${R}`;
    const plate = {
      country: 'by',
      type: type || 'car',
      region: R,
      chars: [D1, D2, D3, D4, L1, L2, R],
      digits,
      letters,
      display,
      id: `by-${type || 'car'}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    };
    const eval_ = evaluatePlate(plate);
    return { ...plate, ...eval_ };
  }

  // ===== RENDER PLATE =====
  // Номера свёрстаны в фиксированном размере (520×112 и т.д.), поэтому на узких
  // экранах номер уменьшается целиком: пропорции и читаемость сохраняются,
  // в отличие от перевёрстки символов по клеткам.
  const PLATE_MIN_SCALE = 0.3;

  function fitPlate() {
    const frame = $('#plateFrame');
    if (!frame) return;
    const plate = frame.querySelector('.plate:not(.hidden)');
    if (!plate) return;
    const stage = frame.parentElement;
    if (!stage) return;

    const naturalW = plate.offsetWidth;
    const naturalH = plate.offsetHeight;
    if (!naturalW || !naturalH) return;

    // Небольшой запас, чтобы номер не упирался в края экрана.
    // clientWidth включает padding сцены (он есть в светлой теме) — вычитаем его.
    const cs = getComputedStyle(stage);
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const available = stage.clientWidth - padX - 2;
    if (available <= 0) return;

    const scale = Math.max(PLATE_MIN_SCALE, Math.min(1, available / naturalW));

    // Рамка всегда натурального размера, а место в потоке сокращаем
    // отрицательными отступами — тогда уменьшенный номер занимает ровно
    // свою видимую область и остаётся по центру сцены.
    const mx = Math.round(naturalW * (1 - scale) / 2);
    const my = Math.round(naturalH * (1 - scale) / 2);

    frame.style.width = naturalW + 'px';
    frame.style.height = naturalH + 'px';
    frame.style.marginLeft = -mx + 'px';
    frame.style.marginRight = -mx + 'px';
    frame.style.marginTop = -my + 'px';
    frame.style.marginBottom = -my + 'px';
    frame.style.transformOrigin = (naturalW / 2) + 'px ' + (naturalH / 2) + 'px';
    frame.style.transform = scale < 1 ? 'scale(' + scale + ')' : 'none';
  }

  let plateObserver = null;
  function watchPlateLayout() {
    if (plateObserver) return;
    const stage = $('.plate-stage');
    if (stage && typeof ResizeObserver !== 'undefined') {
      plateObserver = new ResizeObserver(() => fitPlate());
      plateObserver.observe(stage);
    }
    window.addEventListener('resize', fitPlate);
    window.addEventListener('orientationchange', () => {
      setTimeout(fitPlate, 250);
    });
  }

  function showPlateType() {
    const isRu = state.country === 'ru';
    const isCar = state.type === 'car';

    $('#plateRuCar').classList.toggle('hidden', !(isRu && isCar));
    $('#plateRuMoto').classList.toggle('hidden', !(isRu && !isCar));
    $('#plateByCar').classList.toggle('hidden', !(!isRu && isCar));
    $('#plateByMoto').classList.toggle('hidden', !(!isRu && !isCar));

    // region select visibility
    const regionSelect = $('#regionSelect');
    if (isRu) {
      regionSelect.style.display = '';
    } else {
      regionSelect.style.display = 'none';
    }

    fitPlate();
  }

  function setChars(plateEl, chars) {
    const slots = plateEl.querySelectorAll('.char-slot');
    slots.forEach((slot, i) => {
      const span = slot.querySelector('.char');
      if (span && chars[i] !== undefined) {
        span.textContent = chars[i];
      }
    });
  }

  function updateRegionDisplay(region) {
    const el = $('#regionCode');
    const elM = $('#regionCodeMoto');
    if (el) el.textContent = region;
    if (elM) elM.textContent = region;
  }

  function renderCurrentPlate(plate, animate = false, opts = {}) {
    if (!plate) return;

    const animateIndexes = opts.animateIndexes; // null => все слоты

    const isRu = plate.country === 'ru';
    const isCar = plate.type === 'car';
    let plateEl;

    if (isRu && isCar) plateEl = $('#plateRuCar');
    else if (isRu && !isCar) plateEl = $('#plateRuMoto');
    else if (!isRu && isCar) plateEl = $('#plateByCar');
    else plateEl = $('#plateByMoto');

    if (isRu) updateRegionDisplay(plate.region);

    if (animate) {
      const slots = plateEl.querySelectorAll('.char-slot');
      const finalChars = plate.chars;

      // Если animateIndexes === null — анимируем все слоты, иначе только выбранные
      const indexesToAnimate = (animateIndexes === null || animateIndexes === undefined)
        ? finalChars.map((_, i) => i)
        : animateIndexes;

    // запускаем спин только для нужных слотов
      playSound(sounds.spinStart);
      indexesToAnimate.forEach(i => {
        const slot = slots[i];
        if (slot) slot.classList.add('spinning');
      });

      // прогрессивная остановка
      // Скорость: настройка пользователя минус бонус рамки (быстрее = меньше индекс)
      const speedIndex = Math.max(0, (state.speed || 1) - getSpeedBonus());
      const speed = SPEEDS[speedIndex] || SPEEDS[1];

      // Тикрейт: щелчок при прокрутке каждые N мс
      indexesToAnimate.forEach((i) => {
        const slot = slots[i];
        if (!slot) return;
        const span = slot.querySelector('.char');
        if (!span) return;
        let counter = 0;
        const interval = setInterval(() => {
          if (!slot.classList.contains('spinning')) {
            clearInterval(interval);
            return;
          }
          counter += 1;
          if (counter % 4 === 0) playSound(sounds.scrollTick);
        }, speed.tick);
      });

      const stopDelays = indexesToAnimate.map((_, order) =>
        400 + order * speed.stagger + Math.random() * (speed.stagger * 0.8)
      );

      stopDelays.forEach((delay, order) => {
        const i = indexesToAnimate[order];
        setTimeout(() => {
          playSound(sounds.spinStop);
          const slot = slots[i];
          if (!slot) return;
          slot.classList.remove('spinning');
          const span = slot.querySelector('.char');
          if (span) {
            span.textContent = finalChars[i];
          }
        }, delay);
      });

      const totalTime = Math.max(...stopDelays, 0) + 400;
      setTimeout(() => {
        setChars(plateEl, finalChars);
        updateValueBadge(plate);
        updateMetaChips();
        pushHistory(plate);
        const badge = $('#valueBadge');
        badge.classList.remove('animate-evaluate');
        void badge.offsetWidth; // trigger reflow
        badge.classList.add('animate-evaluate');
        if (['rare', 'epic', 'legendary'].includes(plate.rarity)) playSound(sounds.rare);
        setActionButtonsDisabled(false);
      }, totalTime);
    } else {
      setChars(plateEl, plate.chars);
      updateValueBadge(plate);
    }
  }

  function updateValueBadge(plate) {
    const badge = $('#valueBadge');
    const amount = $('#plateValue');
    const rarity = $('#plateRarity');
    if (!plate) {
      amount.textContent = '0 ₽';
      rarity.textContent = '—';
      rarity.className = 'value-rarity';
      return;
    }
    amount.textContent = formatMoney(plate.value);
    rarity.textContent = plate.rarityLabel;
    rarity.className = 'value-rarity ' + plate.rarity;
  }

  function formatMoney(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + ' млн ₽';
    if (n >= 1000) return Math.round(n / 1000) + ' тыс ₽';
    return n + ' ₽';
  }

  // ===== HISTORY =====
  function pushHistory(plate) {
    if (!plate) return;
    state.history.unshift({
      display: plate.display,
      value: plate.value,
      rarity: plate.rarity,
      rarityLabel: plate.rarityLabel
    });
    if (state.history.length > 40) state.history.length = 40;
    renderHistory();
    saveState();
  }

  function renderHistory() {
    const list = $('#historyList');
    if (!list) return;
    if (!state.history.length) {
      list.innerHTML = '<div class="history-empty">Здесь появятся последние выпавшие номера</div>';
      return;
    }
    list.innerHTML = state.history.map(h => `
      <div class="history-item">
        <span class="value-rarity ${h.rarity}" style="font-size:0.65rem;padding:2px 8px">${h.rarityLabel}</span>
        <span class="hi-plate">${escapeHtml(h.display)}</span>
        <span class="hi-value">${formatMoney(h.value)}</span>
      </div>
    `).join('');
  }

  // Обновляет цену на кнопках крутки с учётом скидки рамки
  function updateSpinCosts() {
    const map = [
      ['#costFull', 'full'],
      ['#costLetters', 'letters'],
      ['#costDigits', 'digits']
    ];
    map.forEach(([sel, mode]) => {
      const el = $(sel);
      if (!el) return;
      const cost = spinCost(mode);
      const base = mode === 'full' ? SPIN_COST : mode === 'letters' ? SPIN_LETTERS_COST : SPIN_DIGITS_COST;
      el.textContent = cost < base ? `−${cost} ₽` : `−${cost} ₽`;
    });
  }

  // ===== META CHIPS =====
  function updateMetaChips() {
    const luckChip = $('#chipLuck');
    const frameChip = $('#chipFrame');
    const item = activeItem();
    if (luckChip) luckChip.querySelector('b').textContent = '+' + Math.round(getLuckBonus() * 100) + '%';
    if (frameChip) frameChip.querySelector('b').textContent = item ? item.name : '—';

    // Панель активных бонусов под номером
    const panel = $('#activeBonuses');
    if (panel) {
      const b = item.bonus || {};
      const keys = Object.keys(b).filter(k => b[k]);
      if (!keys.length) {
        panel.innerHTML = '';
      } else {
        panel.innerHTML = keys.map(k => {
          const fn = BONUS_LABELS[k];
          return fn ? `<span class="bonus-badge b-${k}">${fn(b[k])}</span>` : '';
        }).join('');
      }
    }
  }

  // ===== APPLY ACTIVE SKIN TO PLATE FRAME =====
  function applySkinToFrame() {
    const frameEl = $('#plateFrame');
    if (!frameEl) return;
    $$('.plate', frameEl).forEach(p => {
      p.style.background = '';
      p.style.borderColor = '';
      p.style.boxShadow = '';
    });
    frameEl.classList.remove('skin-applied');

    const item = SHOP_ITEMS.find(i => i.id === state.activeFrame);
    if (!item || item.id === 'frame_default') return;

    frameEl.classList.add('skin-applied');
    $$('.plate', frameEl).forEach(p => {
      p.style.borderColor = item.color;
      p.style.boxShadow = item.glow
        ? `0 0 18px ${item.color}, inset 0 0 0 1px ${item.color}`
        : `inset 0 0 0 1px ${item.color}, 0 0 0 2px ${item.color}`;
      if (item.gradient) {
        p.style.background = item.gradient;
      }
    });
    updateMetaChips();
  }

  // ===== SLOT TYPES =====
  // Возвращает массив индексов слотов, которые являются буквами/цифрами
  // для текущей конфигурации (country + type).
  function getLetterSlotIndexes(plate) {
    const isRu = plate.country === 'ru';
    const isCar = plate.type === 'car';

    if (isRu && isCar)  return [0, 4, 5];  // А 0 0 0 А А
    if (isRu && !isCar) return [4, 5];     // 0 0 0 0 А А
    // BY: 4 цифры + 2 буквы + регион
    return [4, 5];
  }

  function getDigitSlotIndexes(plate) {
    const isRu = plate.country === 'ru';
    const isCar = plate.type === 'car';

    if (isRu && isCar)  return [1, 2, 3];
    if (isRu && !isCar) return [0, 1, 2, 3];
    // BY: 4 цифры + 2 буквы + регион
    return [0, 1, 2, 3];
  }

  // ===== SPIN (full / letters / digits) =====

  function setActionButtonsDisabled(disabled) {
    $('#spinBtn').disabled = disabled;
    $('#spinLettersBtn').disabled = disabled;
    $('#spinDigitsBtn').disabled = disabled;
    $('#sellBtn').disabled = disabled;
    $('#keepBtn').disabled = disabled;
  }

  /**
   * Основная функция прокрутки.
   * mode: 'full' | 'letters' | 'digits'
   */
  function doSpin(mode = 'full') {
    // Цена учитывает скидку активной рамки
    const cost = spinCost(mode);

    if (state.balance < cost) {
      toast('Недостаточно средств! Продайте номера из коллекции.', 'error');
      return;
    }

    // Для частичной прокрутки нужен уже существующий номер
    if (mode !== 'full' && !state.currentPlate) {
      toast('Сначала прокрутите номер полностью!', 'error');
      return;
    }

    state.balance -= cost;
    state.spins += 1;
    updateUI();
    saveState();

    setActionButtonsDisabled(true);

    let plate;
    let lettersToUpdate = null;
    let digitsToUpdate = null;

    if (mode === 'full') {
      resetSpinPool(null);
      if (state.country === 'ru') {
        plate = state.type === 'car'
          ? generateRuCar(state.region)
          : generateRuMoto(state.region);
      } else {
        plate = generateBy(null, state.type);
      }
      state.currentPlate = plate;
      if (plate.rarity === 'rare' || plate.rarity === 'epic' || plate.rarity === 'legendary') {
        state.rareCount += 1;
      }
    } else {
      // Частичная прокрутка: берём текущий номер и меняем только нужные слоты
      plate = { ...state.currentPlate, chars: [...state.currentPlate.chars] };
      // Удача работает и здесь: пул наполняем текущими символами
      resetSpinPool(plate);

      const letterIdx = getLetterSlotIndexes(plate);
      const digitIdx = getDigitSlotIndexes(plate);

      if (mode === 'letters') {
        lettersToUpdate = letterIdx;
        // В пуле остаются только сохраняемые цифры, старые буквы освобождаем
        spinPool = {
          usedDigits: Array.from(new Set(digitIdx.map(i => plate.chars[i]))),
          usedLetters: []
        };
        letterIdx.forEach(i => {
          plate.chars[i] = randLetter(plate.country === 'ru' ? RU_LETTERS : BY_LETTERS);
        });
      } else {
        digitsToUpdate = digitIdx;
        // Сохраняемые буквы остаются занятыми, старые цифры освобождаем
        spinPool = {
          usedDigits: [],
          usedLetters: Array.from(new Set(letterIdx.map(i => plate.chars[i])))
        };
        digitIdx.forEach(i => {
          plate.chars[i] = randDigit();
        });
      }

      // Пересобираем digits/letters/display
      const ruCar   = plate.country === 'ru' && plate.type === 'car';
      const ruMoto  = plate.country === 'ru' && plate.type !== 'car';

      if (ruCar) {
        plate.letters = plate.chars[0] + plate.chars[4] + plate.chars[5];
        plate.digits  = plate.chars[1] + plate.chars[2] + plate.chars[3];
        plate.display = `${plate.chars[0]} ${plate.digits} ${plate.chars[4]}${plate.chars[5]} ${plate.region}`;
      } else if (ruMoto) {
        plate.digits  = plate.chars[0] + plate.chars[1] + plate.chars[2] + plate.chars[3];
        plate.letters = plate.chars[4] + plate.chars[5];
        plate.display = `${plate.digits} ${plate.letters} ${plate.region}`;
      } else {
        plate.digits  = plate.chars[0] + plate.chars[1] + plate.chars[2] + plate.chars[3];
        plate.letters = plate.chars[4] + plate.chars[5];
        plate.display = `${plate.digits} ${plate.letters}-${plate.region}`;
      }

      // Пересчитываем ценность
      const evaluated = evaluatePlate(plate);
      plate.value = evaluated.value;
      plate.rarity = evaluated.rarity;
      plate.rarityLabel = evaluated.rarityLabel;

      state.currentPlate = plate;

      if (plate.rarity === 'rare' || plate.rarity === 'epic' || plate.rarity === 'legendary') {
        state.rareCount += 1;
      }
    }

    // Рендер с анимацией. Для частичной прокрутки анимируем только изменённые слоты.
    renderCurrentPlate(plate, true, {
      animateIndexes: mode === 'full' ? null : (mode === 'letters' ? lettersToUpdate : digitsToUpdate)
    });

    saveState();
  }

  function sellCurrent() {
    if (!state.currentPlate) return;
    // Бонус рамки на доход с продаж
    const xp = 1 + getXpBonus();
    const val = Math.round(state.currentPlate.value * xp);
    state.balance += val;
    state.earned += val;
    toast(`Продано за ${formatMoney(val)}!${xp > 1 ? ` (+${Math.round((xp - 1) * 100)}% бонус)` : ''}`, 'success');
    state.currentPlate = null;
    $('#sellBtn').disabled = true;
    $('#keepBtn').disabled = true;
    updateValueBadge(null);
    updateUI();
    saveState();
  }

  function keepCurrent() {
    if (!state.currentPlate) return;
    state.inventory.unshift(state.currentPlate);
    toast('Номер добавлен в коллекцию!', 'info');
    state.currentPlate = null;
    $('#sellBtn').disabled = true;
    $('#keepBtn').disabled = true;
    updateValueBadge(null);
    renderInventory();
    saveState();
  }

  // ===== INVENTORY =====
  function renderInventory(filter = 'all') {
    const grid = $('#inventoryGrid');
    let items = state.inventory;

    if (filter === 'ru') items = items.filter(p => p.country === 'ru');
    if (filter === 'by') items = items.filter(p => p.country === 'by');
    if (filter === 'rare') items = items.filter(p => ['rare', 'epic', 'legendary'].includes(p.rarity));

    if (items.length === 0) {
      grid.innerHTML = '<div class="empty-state">Коллекция пуста. Крутите номера!</div>';
      return;
    }

    grid.innerHTML = items.map(p => `
      <div class="inv-card" data-id="${p.id}">
        <div class="inv-plate-preview">
          <div class="mini-plate">${escapeHtml(p.display)}</div>
        </div>
        <div class="inv-info">
          <span class="inv-number">${escapeHtml(p.display)}</span>
          <span class="inv-value">${formatMoney(p.value)}</span>
        </div>
        <div class="inv-info">
          <span class="value-rarity ${p.rarity}" style="font-size:0.75rem">${p.rarityLabel}</span>
          <span style="font-size:0.75rem;color:var(--text-muted)">${p.country === 'ru' ? '🇷🇺' : '🇧🇾'} ${p.type === 'car' ? 'Авто' : 'Мото'}</span>
        </div>
        <div class="inv-actions">
          <button class="btn btn-sell" style="padding:8px;font-size:0.85rem" onclick="window._sellInv('${p.id}')">Продать</button>
          <button class="btn btn-keep" style="padding:8px;font-size:0.85rem;background:#334155" onclick="window._removeInv('${p.id}')">Удалить</button>
        </div>
      </div>
    `).join('');
  }

  window._sellInv = function (id) {
    const idx = state.inventory.findIndex(p => p.id === id);
    if (idx === -1) return;
    const p = state.inventory[idx];
    state.balance += p.value;
    state.earned += p.value;
    state.inventory.splice(idx, 1);
    toast(`Продано ${p.display} за ${formatMoney(p.value)}`, 'success');
    renderInventory(getActiveFilter());
    updateUI();
    saveState();
  };

  window._removeInv = function (id) {
    const idx = state.inventory.findIndex(p => p.id === id);
    if (idx === -1) return;
    state.inventory.splice(idx, 1);
    toast('Номер удалён', 'info');
    renderInventory(getActiveFilter());
    saveState();
  };

  function getActiveFilter() {
    const active = document.querySelector('.filter-btn[data-filter].active');
    return active ? active.dataset.filter : 'all';
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ===== SHOP =====
  // Подписи бонусов рамок
  const BONUS_LABELS = {
    luck:    v => `Удача +${Math.round(v * 100)}%`,
    speed:   v => `Скорость +${v}`,
    value:   v => `Цена номера ×${v.toFixed(2).replace(/\.?0+$/, '')}`,
    xp:      v => `Доход с продаж +${Math.round(v * 100)}%`,
    bonus:   v => `Скидка на крутку ${Math.round(v * 100)}%`,
    streak:  v => `Шанс джекпота +${Math.round(v * 100)}%`
  };

  function bonusBadges(item) {
    const b = item.bonus || {};
    const keys = Object.keys(b).filter(k => b[k]);
    if (!keys.length) return '<div class="bonus-badges"><span class="bonus-badge none">Без бонусов</span></div>';
    return '<div class="bonus-badges">' + keys.map(k => {
      const fn = BONUS_LABELS[k];
      return fn ? `<span class="bonus-badge b-${k}">${fn(b[k])}</span>` : '';
    }).join('') + '</div>';
  }

  function renderShop(filter = 'all') {
    const grid = $('#shopGrid');
    let items = SHOP_ITEMS;
    if (filter === 'owned') items = items.filter(i => state.ownedFrames.includes(i.id));
    if (filter === 'available') items = items.filter(i => !state.ownedFrames.includes(i.id));

    grid.innerHTML = items.map(item => {
      const owned = state.ownedFrames.includes(item.id);
      const canBuy = state.balance >= item.price && !owned;
      const isActive = state.activeFrame === item.id;
      const style = item.gradient
        ? `background:${item.gradient};border-color:${item.color}`
        : `border-color:${item.color}`;
      const glow = item.glow ? `box-shadow:0 0 14px ${item.color}` : '';
      const spinHere = Math.round(spinCost('full'));

      return `
        <div class="shop-card${isActive ? ' active' : ''}">
          <div class="shop-preview">
            <div class="frame-demo" style="${style};${glow}">A 123 BC</div>
            ${isActive ? '<span class="equipped-badge">Активна</span>' : ''}
          </div>
          <div class="shop-body">
            <div class="shop-name">${item.name}</div>
            <div class="shop-desc">${item.desc}</div>
            ${bonusBadges(item)}
            <div class="shop-spin-cost">Крутка: <b>${spinHere} ₽</b>${spinHere < SPIN_COST ? ` <s>${SPIN_COST} ₽</s>` : ''}</div>
            <div class="shop-footer">
              ${owned
                ? (isActive
                    ? '<span class="shop-owned active">Выбрана</span>'
                    : `<button class="shop-buy" onclick="window._buyFrame('${item.id}')">Примерить</button>`)
                : `<span class="shop-price">${formatMoney(item.price)}</span>
                   <button class="shop-buy" ${canBuy ? '' : 'disabled'} onclick="window._buyFrame('${item.id}')">Купить</button>`
              }
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  window._buyFrame = function (id) {
    const item = SHOP_ITEMS.find(i => i.id === id);
    if (!item) return;
    if (state.ownedFrames.includes(id)) {
      state.activeFrame = id;
      applySkinToFrame();
      playSound(sounds.click);
      toast(`Рамка «${item.name}» выбрана`, 'info');
      renderShop(); // Refresh to show selected
      saveState();
      return;
    }
    if (state.balance < item.price) {
      toast('Недостаточно средств!', 'error');
      return;
    }
    state.balance -= item.price;
    state.ownedFrames.push(id);
    state.activeFrame = id;
    applySkinToFrame();
    playSound(sounds.buy);
    toast(`Куплена рамка «${item.name}»!`, 'success');
    updateUI();
    renderShop();
    saveState();
  };

  // ===== HARD RESET =====
  // Полное обнуление: localStorage, sessionStorage, cookies, кеш Service Worker
  function hardReset() {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) { /* ignore */ }

    // Удаляем все cookie этого домена
    document.cookie.split(';').forEach(c => {
      const name = c.split('=')[0].trim();
      if (!name) return;
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=' + location.pathname;
    });

    // Сбрасываем состояние к начальным значениям
    state = {
      balance: 1000,
      spins: 0,
      rareCount: 0,
      earned: 0,
      country: 'ru',
      type: 'car',
      region: '77',
      currentPlate: null,
      inventory: [],
      ownedFrames: ['frame_default'],
      activeFrame: 'frame_default',
      history: [],
      sound: true,
      speed: 1,
      theme: 'dark',
      lastDaily: null
    };

    // Перерисовываем интерфейс
    renderInventory();
    renderHistory();
    applySkinToFrame();
    applyTheme();
    updateValueBadge(null);
    updateUI();
    syncSettingsUI();
    updateMetaChips();
    updateRegionDisplay(state.region);
    $('#regionSelect').value = state.region;

    // Сбрасываем кэш браузера для этого сайта, если доступен Cache API
    if ('caches' in window) {
      caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).catch(() => {});
    }
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())).catch(() => {});
    }

    toast('Все данные полностью удалены', 'success');
  }

  // ===== THEME / SETTINGS UI =====
  function applyTheme() {
    document.body.classList.toggle('light-theme', state.theme === 'light');
  }

  function syncSettingsUI() {
    const soundToggle = $('#soundToggle');
    if (soundToggle) soundToggle.classList.toggle('on', !!state.sound);

    const themeToggle = $('#themeToggle');
    if (themeToggle) themeToggle.classList.toggle('on', state.theme === 'light');

    const persistToggle = $('#persistToggle');
    if (persistToggle) persistToggle.classList.toggle('on', !!state.persistPlate);

    const speedRange = $('#speedRange');
    if (speedRange) speedRange.value = String(state.speed);

    const dailyHint = $('#dailyHint');
    const dailyBtn = $('#dailyRewardBtn');
    if (dailyHint && dailyBtn) {
      const available = isDailyAvailable();
      dailyHint.textContent = available ? 'Награда за сегодня доступна' : 'Уже получено сегодня';
      dailyBtn.disabled = !available;
      dailyBtn.style.opacity = available ? '1' : '0.45';
    }
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function isDailyAvailable() {
    return state.lastDaily !== todayKey();
  }

  function claimDailyReward() {
    if (!isDailyAvailable()) {
      toast('Бонус уже получен сегодня', 'info');
      return;
    }
    const reward = 500 + state.spins * 25;
    state.balance += reward;
    state.lastDaily = todayKey();
    state.earned += reward;
    playSound(sounds.buy);
    toast(`Ежедневный бонус: +${formatMoney(reward)}`, 'success');
    updateUI();
    syncSettingsUI();
    saveState();
  }

  // ===== UI UPDATE =====
  function updateUI() {
    $('#balance').textContent = state.balance.toLocaleString('ru-RU');
    $('#statSpins').textContent = state.spins;
    $('#statRare').textContent = state.rareCount;
    $('#statEarned').textContent = formatMoney(state.earned);
    updateSpinCosts();
  }

  // ===== TOAST =====
  function toast(msg, type = 'info') {
    const container = $('#toastContainer');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.3s';
      setTimeout(() => el.remove(), 300);
    }, 2800);
  }

  // ===== TABS =====
  function switchTab(tabId) {
    $$('.tab').forEach(t => t.classList.remove('active'));
    $$('.nav-btn').forEach(b => b.classList.remove('active'));
    $(`#tab-${tabId}`).classList.add('active');
    $(`.nav-btn[data-tab="${tabId}"]`).classList.add('active');

    if (tabId === 'inventory') renderInventory();
    if (tabId === 'shop') renderShop();
    if (tabId === 'settings') syncSettingsUI();

    // Вкладка только что показалась — ширину сцены надо перемерить
    if (tabId === 'generator') fitPlate();
  }

  // ===== INIT =====
  function init() {
    loadState();
    updateUI();
    showPlateType();
    updateRegionDisplay(state.region);
    watchPlateLayout();
    fitPlate();

    // initial empty-looking plate
    if (state.country === 'ru' && state.type === 'car') {
      setChars($('#plateRuCar'), ['А', '0', '0', '0', 'А', 'А']);
    }

    // events
    $$('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    $$('.toggle-btn[data-country]').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.toggle-btn[data-country]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.country = btn.dataset.country;
        showPlateType();
        state.currentPlate = null;
        setActionButtonsDisabled(true);
        $('#spinBtn').disabled = false;
        $('#spinLettersBtn').disabled = false;
        $('#spinDigitsBtn').disabled = false;
        updateValueBadge(null);
        saveState();
      });
    });

    $$('.toggle-btn[data-type]').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.toggle-btn[data-type]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.type = btn.dataset.type;
        showPlateType();
        state.currentPlate = null;
        setActionButtonsDisabled(true);
        $('#spinBtn').disabled = false;
        $('#spinLettersBtn').disabled = false;
        $('#spinDigitsBtn').disabled = false;
        updateValueBadge(null);
        saveState();
      });
    });

    $('#regionSelect').addEventListener('change', (e) => {
      state.region = e.target.value;
      updateRegionDisplay(state.region);
      saveState();
    });

    // set region select value
    $('#regionSelect').value = state.region;

    $('#spinBtn').addEventListener('click', () => doSpin('full'));
    $('#spinLettersBtn').addEventListener('click', () => doSpin('letters'));
    $('#spinDigitsBtn').addEventListener('click', () => doSpin('digits'));
    $('#sellBtn').addEventListener('click', sellCurrent);
    $('#keepBtn').addEventListener('click', keepCurrent);

    // Copy current plate number
    const copyBtn = $('#copyBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        if (!state.currentPlate) {
          toast('Сначала выкрутите номер!', 'error');
          return;
        }
        const text = state.currentPlate.display;
        try {
          await navigator.clipboard.writeText(text);
          toast(`Скопировано: ${text}`, 'success');
        } catch (err) {
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); toast(`Скопировано: ${text}`, 'success'); }
          catch (e2) { toast('Не удалось скопировать', 'error'); }
          ta.remove();
        }
      });
    }

    // ===== SETTINGS =====
    const soundToggle = $('#soundToggle');
    if (soundToggle) {
      soundToggle.addEventListener('click', () => {
        state.sound = !state.sound;
        syncSettingsUI();
        saveState();
        if (state.sound) playSound(sounds.click);
      });
    }

    const themeToggle = $('#themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        applyTheme();
        syncSettingsUI();
        saveState();
        playSound(sounds.click);
      });
    }

    const persistToggle = $('#persistToggle');
    if (persistToggle) {
      persistToggle.addEventListener('click', () => {
        state.persistPlate = !state.persistPlate;
        syncSettingsUI();
        saveState();
        playSound(sounds.click);
      });
    }

    const speedRange = $('#speedRange');
    if (speedRange) {
      speedRange.addEventListener('input', (e) => {
        state.speed = parseInt(e.target.value, 10);
        syncSettingsUI();
        saveState();
      });
      speedRange.addEventListener('change', () => playSound(sounds.click));
    }

    const dailyBtn = $('#dailyRewardBtn');
    if (dailyBtn) dailyBtn.addEventListener('click', claimDailyReward);

    const resetBtn = $('#resetDataBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (!confirm('Полностью удалить все данные сайта? Баланс, коллекция, рамки, история и настройки будут сброшены.')) return;
        hardReset();
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.code === 'Space') { e.preventDefault(); doSpin('full'); }
      else if (e.key === 's' || e.key === 'S' || e.key === 'ы') doSpin('letters');
      else if (e.key === 'd' || e.key === 'D' || e.key === 'в') doSpin('digits');
    });

    $$('.filter-btn[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.filter-btn[data-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderInventory(btn.dataset.filter);
      });
    });

    // Фильтры магазина
    $$('.filter-btn[data-shop-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.filter-btn[data-shop-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderShop(btn.dataset.shopFilter);
      });
    });

    // restore country/type toggles
    $$(`.toggle-btn[data-country="${state.country}"]`).forEach(b => {
      $$('.toggle-btn[data-country]').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
    });
    $$(`.toggle-btn[data-type="${state.type}"]`).forEach(b => {
      $$('.toggle-btn[data-type]').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
    });
    showPlateType();
    applySkinToFrame();
    renderHistory();
    updateMetaChips();
    applyTheme();
    syncSettingsUI();
  }

  document.addEventListener('DOMContentLoaded', init);
})();