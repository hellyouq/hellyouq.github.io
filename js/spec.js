/* ============================================================================
 *  spec.js — единый источник правды: каталог игр, типы секций, правила,
 *  нормализация ответа ИИ и процедурный фолбэк (когда ИИ недоступен).
 *  Модуль не зависит от DOM — тестируется в node (tests/test-spec.mjs).
 * ==========================================================================*/
(function (global) {
  'use strict';
  const APP = (global.APP = global.APP || {});

  /* ------------------------------ утилиты ---------------------------------- */

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashSeed(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < String(str).length; i++) {
      h ^= String(str).charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }
  const isNum = (v) => typeof v === 'number' && isFinite(v);
  function num(v, def, min, max) {
    const n = isNum(v) ? v : parseFloat(v);
    if (!isFinite(n)) return def;
    return Math.min(max, Math.max(min, n));
  }
  function int(v, def, min, max) { return Math.round(num(v, def, min, max)); }
  function str(v, def, max) {
    if (typeof v !== 'string') return def;
    let s = v.replace(/\s+/g, ' ').trim();
    if (!s) return def;
    if (max && s.length > max) s = s.slice(0, max).replace(/[\s,.;:—-]+$/, '');
    return s;
  }
  function oneOf(v, list, def) { return list.indexOf(v) !== -1 ? v : def; }
  function bool(v, def) { return typeof v === 'boolean' ? v : def; }
  function hex(v, def) { return /^#[0-9a-fA-F]{6}$/.test(String(v || '')) ? String(v).toLowerCase() : def; }
  function arr(v) { return Array.isArray(v) ? v : []; }
  const pick = (rnd, list) => list[Math.floor(rnd() * list.length) % list.length];

  /* --------------------------- каталог игр --------------------------------- */

  // params: { ключ: [тип, дефолт, мин, макс] }  |  тип 'enum' -> 4-й элемент массив
  const GAMES = [
    {
      id: 'snake', name: 'Стеклянная змейка', emoji: '🐍',
      blurb: 'Собирай блики и расти, не врезаясь в стены.',
      params: { speed: ['int', 6, 3, 9], wrap: ['bool', false], cols: ['int', 18, 14, 22] }
    },
    {
      id: 'n2048', name: '2048 · Мыло', emoji: '🧼',
      blurb: 'Сдвигай плитки и собери нужное число.',
      params: { size: ['enum', 4, [4, 5]], goal: ['enum', 2048, [512, 1024, 2048]] }
    },
    {
      id: 'memory', name: 'Пары', emoji: '🧠',
      blurb: 'Найди все пары за минимум ходов.',
      params: { pairs: ['enum', 8, [6, 8, 10]], deck: ['enum', 'emoji', ['emoji', 'space', 'food', 'animals']] }
    },
    {
      id: 'reaction', name: 'Реакция', emoji: '⚡',
      blurb: 'Нажми в тот момент, когда стекло станет прозрачным.',
      params: { rounds: ['int', 5, 3, 10], mode: ['enum', 'classic', ['classic', 'bubbles']] }
    },
    {
      id: 'breakout', name: 'Разбей витрину', emoji: '🧱',
      blurb: 'Отбивай мяч и очищай уровни из стекла.',
      params: { lives: ['int', 3, 2, 5], speed: ['num', 1, 0.8, 1.6], rows: ['int', 4, 3, 6] }
    },
    {
      id: 'flappy', name: 'Пузырь вверх', emoji: '🫧',
      blurb: 'Пролетай сквозь проёмы. Не лопни.',
      params: { gap: ['num', 2.4, 1.9, 3.0], speed: ['num', 1, 0.8, 1.5] }
    },
    {
      id: 'simon', name: 'Эхо', emoji: '🎵',
      blurb: 'Повтори мелодию на стеклянных падах.',
      params: { rounds: ['int', 8, 5, 15], tempo: ['int', 650, 400, 900] }
    },
    {
      id: 'tictactoe', name: 'Крестики-нолики', emoji: '❌',
      blurb: 'Три в ряд против стеклянного ИИ.',
      params: { difficulty: ['enum', 'normal', ['easy', 'normal', 'hard']] }
    },
    {
      id: 'mines', name: 'Минное поле', emoji: '💣',
      blurb: 'Открывай клетки и ставь флажки. Осторожно.',
      params: { w: ['int', 8, 6, 10], h: ['int', 8, 6, 10], mines: ['int', 10, 5, 16] }
    },
    {
      id: 'stack', name: 'Башня', emoji: '🏗️',
      blurb: 'Ставь блоки точно друг на друга.',
      params: { speed: ['num', 1, 0.7, 1.6] }
    },
    {
      id: 'aim', name: 'Тир', emoji: '🎯',
      blurb: 'Сбивай цели как можно быстрее.',
      params: { seconds: ['int', 25, 15, 40], size: ['int', 42, 28, 64] }
    },
    {
      id: 'stroop', name: 'Цветные слова', emoji: '🌈',
      blurb: 'Выбирай цвет чернил, а не само слово.',
      params: { seconds: ['int', 30, 20, 45] }
    },
    {
      id: 'typing', name: 'Скорость печати', emoji: '⌨️',
      blurb: 'Печатай быстрее и ошибайся меньше.',
      params: { layout: ['enum', 'ru', ['ru', 'en']] }
    },
    {
      id: 'lightsout', name: 'Огни', emoji: '💡',
      blurb: 'Погаси все огни: каждое нажатие переворачивает крест.',
      params: { size: ['enum', 4, [3, 4, 5]] }
    }
  ];
  const GAME_BY_ID = GAMES.reduce((m, g) => (m[g.id] = g, m), {});

  const SECTION_TYPES = [
    'games', 'canvas', 'quests', 'news', 'facts',
    'quotes', 'breath', 'pomodoro', 'wheel', 'piano', 'blob', 'stats'
  ];

  /* ------------------- нормализация значения одного параметра -------------- */
  function normParam(spec, value) {
    const t = spec[0];
    switch (t) {
      case 'int': return int(value, spec[1], spec[2], spec[3]);
      case 'num': return Math.round(num(value, spec[1], spec[2], spec[3]) * 100) / 100;
      case 'bool': return bool(value, spec[1]);
      case 'enum': return Array.isArray(spec[2]) ? oneOf(value, spec[2], spec[1]) : spec[1];
      default: return spec[1];
    }
  }
  function normGameParams(gameId, params) {
    const def = GAME_BY_ID[gameId];
    if (!def) return {};
    const out = {};
    Object.keys(def.params).forEach((k) => {
      out[k] = normParam(def.params[k], params && params[k]);
    });
    return out;
  }
  // Текстовое описание каталога — используется и в промте, и в UI-справке.
  function paramDoc(params) {
    return Object.keys(params).map((k) => {
      const s = params[k];
      if (s[0] === 'enum') return k + ': ' + (Array.isArray(s[2]) ? s[2].join('|') : s[1]);
      if (s[0] === 'bool') return k + ': true|false';
      if (s[0] === 'int') return k + ': целое ' + s[2] + '..' + s[3];
      return k + ': число ' + s[2] + '..' + s[3];
    }).join(', ');
  }
  function gameCatalogText() {
    return GAMES.map((g) => '- "' + g.id + '" — ' + g.name + ' (' + g.emoji + '). params: {' + paramDoc(g.params) + '}').join('\n');
  }

  /* ------------------------------ нормализация ---------------------------- */

  const PALETTES = [
    { accent: '#7c5cff', accent2: '#22d3ee', hue: 262, hue2: 190 },
    { accent: '#ff6b9d', accent2: '#ffd166', hue: 335, hue2: 45 },
    { accent: '#34d399', accent2: '#60a5fa', hue: 160, hue2: 215 },
    { accent: '#f97316', accent2: '#f43f5e', hue: 25, hue2: 350 },
    { accent: '#a78bfa', accent2: '#f0abfc', hue: 258, hue2: 292 },
    { accent: '#38bdf8', accent2: '#a3e635', hue: 200, hue2: 85 }
  ];

  function normTheme(t) {
    const d = PALETTES[0];
    t = t && typeof t === 'object' ? t : {};
    return {
      mode: oneOf(t.mode, ['dark', 'light', 'auto'], 'dark'),
      hue: int(t.hue, d.hue, 0, 360),
      hue2: int(t.hue2, d.hue2, 0, 360),
      accent: hex(t.accent, d.accent),
      accent2: hex(t.accent2, d.accent2),
      radius: int(t.radius, 26, 14, 40),
      font: oneOf(t.font, ['sf', 'rounded', 'mono', 'serif'], 'sf'),
      glow: Math.round(num(t.glow, 0.55, 0.15, 1) * 100) / 100
    };
  }

  function normSection(raw, rnd) {
    if (!raw || typeof raw !== 'object') return null;
    const type = oneOf(raw.type, SECTION_TYPES, null);
    if (!type) return null;
    const s = { type };
    s.title = str(raw.title, '', 60);
    s.subtitle = str(raw.subtitle, '', 140);

    switch (type) {
      case 'games': {
        const items = [];
        arr(raw.items).slice(0, 5).forEach((it) => {
          if (!it || !GAME_BY_ID[it.game]) return;
          const def = GAME_BY_ID[it.game];
          items.push({
            game: def.id,
            name: str(it.name, def.name, 34),
            blurb: str(it.blurb, def.blurb, 90),
            emoji: def.emoji,
            params: normGameParams(def.id, it.params)
          });
        });
        if (!items.length) return null;
        s.items = items;
        break;
      }
      case 'canvas': {
        const p = arr(raw.palette).map((c) => hex(c, null)).filter(Boolean).slice(0, 6);
        s.palette = p.length >= 3 ? p : ['#7c5cff', '#22d3ee', '#ffd166', '#ff6b9d', '#ffffff'];
        if (s.palette.length > 6) s.palette = s.palette.slice(0, 6);
        break;
      }
      case 'quests': {
        const items = arr(raw.items).slice(0, 6).map((it) => it && {
          title: str(it.title, '', 46),
          desc: str(it.desc, '', 110),
          reward: int(it.reward, 20, 10, 100),
          difficulty: oneOf(it.difficulty, ['легко', 'средне', 'сложно'], 'легко')
        }).filter((it) => it && it.title);
        if (items.length < 3) return null;
        s.items = items;
        break;
      }
      case 'news': {
        const items = arr(raw.items).slice(0, 5).map((it) => it && {
          tag: str(it.tag, 'новость', 22),
          title: str(it.title, '', 70),
          body: str(it.body, '', 240),
          time: str(it.time, '', 18)
        }).filter((it) => it && it.title && it.body);
        if (items.length < 2) return null;
        s.items = items;
        break;
      }
      case 'facts': {
        const items = arr(raw.items).slice(0, 5).map((it) => it && {
          title: str(it.title, '', 60),
          body: str(it.body, '', 240)
        }).filter((it) => it && it.title && it.body);
        if (items.length < 2) return null;
        s.items = items;
        break;
      }
      case 'quotes': {
        const items = arr(raw.items).slice(0, 6).map((it) => it && {
          text: str(it.text, '', 180),
          author: str(it.author, 'неизвестный', 40)
        }).filter((it) => it && it.text);
        if (items.length < 2) return null;
        s.items = items;
        break;
      }
      case 'breath': {
        s.inhale = int(raw.inhale, 4, 3, 5);
        s.hold = int(raw.hold, 4, 2, 6);
        s.exhale = int(raw.exhale, 6, 4, 8);
        s.cycles = int(raw.cycles, 5, 3, 8);
        break;
      }
      case 'pomodoro': {
        s.focus = int(raw.focus, 25, 15, 45);
        s.rest = int(raw.rest, 5, 3, 10);
        break;
      }
      case 'wheel': {
        const items = arr(raw.items).map((v) => str(v, '', 34)).filter(Boolean).slice(0, 8);
        if (items.length < 3) return null;
        s.items = items;
        break;
      }
      case 'piano': {
        s.mood = oneOf(raw.mood, ['calm', 'bright', 'dark'], 'calm');
        break;
      }
      case 'blob': {
        s.name = str(raw.name, 'Мыло', 20);
        break;
      }
      case 'stats': break;
    }
    return s;
  }

  function normCustomGame(cg) {
    if (!cg || typeof cg !== 'object') return null;
    let html = typeof cg.html === 'string' ? cg.html : '';
    if (html.length < 220 || html.length > 60000) return null;
    if (!/<[a-z!]/i.test(html)) return null;
    if (/<\/iframe|srcdoc\s*=|top\.location|parent\.document/i.test(html)) return null;
    // Немного чистим хвосты, которые иногда добавляют модели.
    html = html.replace(/^\s*```[a-z]*\s*/i, '').replace(/\s*```\s*$/, '');
    return {
      name: str(cg.name, 'Сюрприз', 34),
      emoji: str(cg.emoji, '✨', 4),
      blurb: str(cg.blurb, 'Игра, придуманная специально для этого визита.', 110),
      html
    };
  }

  /**
   * Приводит сырой ответ модели к безопасной, отрисованной структуре.
   * Никогда не бросает исключение.
   */
  function normalize(raw, meta) {
    raw = raw && typeof raw === 'object' ? raw : {};
    meta = meta || {};
    const seed = meta.seed || 'seed';
    const rnd = mulberry32(hashSeed(seed));

    const theme = normTheme(raw.theme);
    const out = {
      title: str(raw.title, 'Мыльный сайт', 40),
      emoji: str(raw.emoji, '🫧', 4),
      tagline: str(raw.tagline, 'Стекло, блики и мини-игры', 80),
      lang: str(raw.lang, 'ru', 5),
      theme,
      hero: {
        badge: str(raw.hero && raw.hero.badge, 'liquid glass', 28),
        headline: str(raw.hero && raw.hero.headline, 'Сайт, который собрался прямо сейчас', 90),
        sub: str(raw.hero && raw.hero.sub, 'Герметично закрытая капсула из стекла и пузырей.', 200),
        cta: str(raw.hero && raw.hero.cta, 'Погнали', 24)
      },
      nav: arr(raw.nav).map((n) => str(n, '', 18)).filter(Boolean).slice(0, 5),
      sections: [],
      customGame: normCustomGame(raw.customGame),
      footer: str(raw.footer, 'Собрано на глазах и на лету', 90),
      meta: {
        model: meta.model || 'fallback',
        seed,
        vibe: meta.vibe || '',
        createdAt: meta.createdAt || Date.now()
      }
    };

    arr(raw.sections).slice(0, 8).forEach((s) => {
      const n = normSection(s, rnd);
      if (n) out.sections.push(n);
    });

    // Гарантия: должен быть блок с играми и хотя бы 3 секции.
    const hasGames = out.sections.some((s) => s.type === 'games');
    if (!hasGames) {
      const gamesSection = normSection({
        type: 'games',
        title: 'Во что поиграть',
        subtitle: 'Пара игр, которые собрались вместе с сайтом.',
        items: pick(rnd, GAME_IDS_POOL).slice(0, 3).map((id) => ({ game: id }))
      });
      out.sections.unshift(gamesSection);
    }
    if (out.sections.length < 3) {
      const extra = fallbackSections(rnd, 3 - out.sections.length);
      out.sections = out.sections.concat(extra);
    }
    if (out.sections.length > 7) out.sections = out.sections.slice(0, 7);

    if (!out.nav.length) {
      out.nav = out.sections.slice(0, 4).map((s) => sectionNavName(s));
    }
    return out;
  }

  const GAME_IDS_POOL = [
    ['snake', 'memory', 'reaction'],
    ['n2048', 'breakout', 'simon'],
    ['flappy', 'tictactoe', 'aim'],
    ['mines', 'stack', 'stroop'],
    ['typing', 'lightsout', 'reaction'],
    ['snake', 'n2048', 'memory']
  ];

  function sectionNavName(s) {
    if (s.title) return s.title.length > 18 ? s.title.slice(0, 18).trim() : s.title;
    const map = {
      games: 'Игры', canvas: 'Рисование', quests: 'Задания', news: 'Новости',
      facts: 'Факты', quotes: 'Цитаты', breath: 'Дыхание', pomodoro: 'Помодоро',
      wheel: 'Рулетка', piano: 'Пианино', blob: 'Питомец', stats: 'Прогресс'
    };
    return map[s.type] || 'Раздел';
  }

  /* ----------------------------- фолбэк ----------------------------------- */

  function fallbackSections(rnd, count) {
    const pool = [
      () => ({ type: 'canvas', title: 'Нарисуй что-нибудь', subtitle: 'Мягкая кисть, блики и пузыри.', palette: pick(rnd, PALETTES) ? ['#ffd166', '#ff6b9d', '#7c5cff', '#22d3ee', '#ffffff'] : [] }),
      () => ({ type: 'breath', title: 'Подыши', subtitle: 'Медленный ритм для головы и стекла.', inhale: 4, hold: 4, exhale: 6, cycles: 5 }),
      () => ({ type: 'facts', title: 'Короткие факты', subtitle: 'Всякое интересное про пузыри и стекло.', items: pick(rnd, (APP.EXTRAS && APP.EXTRAS.facts) || [[{ title: 'Пузырь', body: 'Пузырь лопается, потому что плёнка становится слишком тонкой.' }]]) }),
      () => ({ type: 'quotes', title: 'Цитаты', subtitle: 'Мысли, которые приятно перечитывать.', items: (APP.EXTRAS && APP.EXTRAS.quotes ? pick(rnd, APP.EXTRAS.quotes) : [{ text: 'Простота — высшая форма сложности.', author: 'неизвестный' }]) }),
      () => ({ type: 'quests', title: 'Задания на сейчас', subtitle: 'Маленькие дела — большие пузыри.', items: (APP.EXTRAS && APP.EXTRAS.quests ? pick(rnd, APP.EXTRAS.quests) : [{ title: 'Сделать паузу', desc: 'Пять минут без экрана.', reward: 20, difficulty: 'легко' }]) }),
      () => ({ type: 'wheel', title: 'Колесо решений', subtitle: 'Пусть выберет стекло.', items: ['чай', 'кофе', 'прогулка', 'сон', 'игра'] }),
      () => ({ type: 'pomodoro', title: 'Фокус', subtitle: 'Классический таймер концентрации.', focus: 25, rest: 5 }),
      () => ({ type: 'blob', title: 'Стеклянный питомец', subtitle: 'Тяни его — он упругий.', name: 'Мыло' })
    ];
    const out = [];
    const used = {};
    let guard = 0;
    while (out.length < count && guard++ < 40) {
      const i = Math.floor(rnd() * pool.length) % pool.length;
      if (used[i]) continue;
      used[i] = true;
      out.push(pool[i]());
    }
    return out;
  }

  /** Полностью локальный «случайный сайт» — работает без сети и без ИИ. */
  function fallback(seed, opts) {
    opts = opts || {};
    const rnd = mulberry32(hashSeed(seed || Date.now()));
    const pal = pick(rnd, PALETTES);
    const gameIds = (APP.EXTRAS && APP.EXTRAS.gameSets ? pick(rnd, APP.EXTRAS.gameSets) : pick(rnd, GAME_IDS_POOL));
    const titles = ['Пузырь и стекло', 'Мыльная мастерская', 'Тихий блик', 'Лаборатория пузырей', 'Стеклянный сад', 'Мыло и свет', 'Аквариум идей'];
    const heroes = [
      { badge: 'без ИИ, честно', headline: 'Сайт собрался из ничего', sub: 'Пока Gemini молчит, стекло варит пузыри само.' },
      { badge: 'локальная сборка', headline: 'Мыло решило всё за нас', sub: 'Прозрачно, упруго и почти воздушно.' }
    ];
    const hero = pick(rnd, heroes);
    const sections = [];
    sections.push({
      type: 'games',
      title: 'Игровая витрина',
      subtitle: 'Несколько игр — и все из стекла.',
      items: arr(gameIds).slice(0, 4).map((id) => {
        const g = GAME_BY_ID[id] || GAMES[0];
        return { game: g.id, name: g.name, blurb: g.blurb, emoji: g.emoji, params: normGameParams(g.id, null) };
      })
    });
    fallbackSections(rnd, 3).forEach((s) => sections.push(s));

    const spec = normalize({
      title: pick(rnd, titles),
      emoji: '🫧',
      tagline: 'Стекло, блики и мини-игры',
      theme: { mode: pick(rnd, ['dark', 'light']), hue: pal.hue, hue2: pal.hue2, accent: pal.accent, accent2: pal.accent2, radius: 26, font: pick(rnd, ['sf', 'rounded']), glow: 0.6 },
      hero,
      sections,
      customGame: APP.EXTRAS && APP.EXTRAS.miniGames ? pick(rnd, APP.EXTRAS.miniGames) : null,
      footer: 'Собрано локально, без интернета'
    }, { seed: seed, model: 'fallback', vibe: opts.vibe || '' });
    return spec;
  }

  /* --------------------------- ссылка-поделиться --------------------------- */

  function b64urlEncode(bytes) {
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64urlDecode(str) {
    const s = atob(String(str).replace(/-/g, '+').replace(/_/g, '/'));
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }

  async function encodeShare(spec) {
    const json = JSON.stringify(spec);
    try {
      if (typeof CompressionStream === 'undefined') throw new Error('no-compression');
      const cs = new CompressionStream('gzip');
      const stream = new Blob([new TextEncoder().encode(json)]).stream().pipeThrough(cs);
      const buf = await new Response(stream).arrayBuffer();
      return 'g' + b64urlEncode(new Uint8Array(buf));
    } catch (e) {
      if (json.length > 12000) throw new Error('too-big');
      return 'r' + b64urlEncode(new TextEncoder().encode(json));
    }
  }
  async function decodeShare(str) {
    if (!str) return null;
    const mode = str[0];
    const body = str.slice(1);
    try {
      const bytes = b64urlDecode(body);
      let json;
      if (mode === 'g') {
        if (typeof DecompressionStream === 'undefined') return null;
        const ds = new DecompressionStream('gzip');
        const stream = new Blob([bytes]).stream().pipeThrough(ds);
        json = new TextDecoder().decode(await new Response(stream).arrayBuffer());
      } else {
        json = new TextDecoder().decode(bytes);
      }
      return normalize(JSON.parse(json), { model: 'share', seed: 'share' });
    } catch (e) { return null; }
  }

  APP.SPEC = {
    GAMES, GAME_BY_ID, SECTION_TYPES, PALETTES,
    normalize, fallback, fallbackSections, normGameParams, normParam,
    gameCatalogText, paramDoc, sectionNavName,
    encodeShare, decodeShare,
    utils: { mulberry32, hashSeed, num, int, str, oneOf, bool, hex, pick, arr }
  };
})(typeof window !== 'undefined' ? window : globalThis);
