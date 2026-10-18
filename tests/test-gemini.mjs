/* Тесты слоя Gemini без сети: node tests/test-gemini.mjs
   Подменяем fetch и проверяем разбор SSE, перебор моделей и починку JSON. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
for (const f of ['js/config.js', 'js/extras.js', 'js/spec.js', 'js/prompt.js', 'js/gemini.js']) {
  (0, eval)(fs.readFileSync(path.join(ROOT, f), 'utf8'));
}
const APP = globalThis.APP;

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

const enc = new TextEncoder();
function sse(chunks) {
  return {
    ok: true, status: 200,
    body: new ReadableStream({ start(c) { chunks.forEach((ch) => c.enqueue(enc.encode(ch))); c.close(); } }),
    json: async () => ({}),
    headers: { get: () => null }
  };
}
function errRes(status, message) {
  return { ok: false, status, json: async () => ({ error: { message } }), headers: { get: () => null }, body: null };
}
function sseChunk(text) {
  return 'data: ' + JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }) + '\n\n';
}

const CONFIG_MODELS = APP.CONFIG.MODELS.slice();   // снимок до тестов: они меняют список

const SPEC_JSON = JSON.stringify({
  title: 'Тестовое стекло', emoji: '🫧', tagline: 'проверка связи', lang: 'ru',
  theme: { mode: 'dark', hue: 250, hue2: 190, accent: '#7c5cff', accent2: '#22d3ee', radius: 26, font: 'sf', glow: .6 },
  hero: { badge: 'тест', headline: 'Заголовок', sub: 'Подзаголовок', cta: 'Дальше' },
  nav: ['Игры'],
  sections: [{ type: 'games', title: 'Игры', subtitle: 's', items: [{ game: 'snake', name: 'Змейка', blurb: 'b', params: { speed: 6 } }] }],
  customGame: null,
  footer: 'конец'
});

console.log('GEMINI');

test('JSON вынимается из обёрток и мусора', () => {
  assert.deepEqual(APP.GEMINI.extractJSON('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(APP.GEMINI.extractJSON('вот ответ:\n{"a":[1,2,]}\nспасибо'), { a: [1, 2] });
  assert.equal(APP.GEMINI.extractJSON('совсем не json'), null);
  assert.deepEqual(APP.GEMINI.extractJSON('{"t":"«умные» кавычки"}'), { t: '«умные» кавычки' });
});

test('SSE-поток, разорванный посередине, собирается целиком', async () => {
  const whole = sseChunk(SPEC_JSON);
  const chunks = [whole.slice(0, 40), whole.slice(40, 120), whole.slice(120, 121), whole.slice(121)];
  globalThis.fetch = async () => sse(chunks);
  const { text } = await APP.GEMINI.streamModel('m1', 'sys', 'user', { onProgress: () => { } }, undefined);
  assert.equal(text, SPEC_JSON);
  assert.equal(JSON.parse(text).title, 'Тестовое стекло');
});

test('429 на первой модели — берём следующую', async () => {
  const calls = [];
  APP.CONFIG.MODELS = ['мусорная', 'рабочая'];
  globalThis.fetch = async (url) => {
    calls.push(url);
    if (url.includes('мусорная')) return errRes(429, 'quota exceeded');
    return sse([sseChunk(SPEC_JSON)]);
  };
  const stages = [];
  const res = await APP.GEMINI.generate({ seed: 'seed-1', onStage: (s) => stages.push(s), onProgress: () => { } });
  assert.equal(res.model, 'рабочая');
  assert.equal(res.spec.title, 'Тестовое стекло');
  assert.ok(res.spec.sections.some((s) => s.type === 'games'));
  assert.ok(calls.some((u) => u.includes('streamGenerateContent?alt=sse')), 'используем стриминг');
  assert.ok(stages.some((s) => s.includes('не ответила')), 'показываем смену модели');
  assert.equal(res.spec.meta.vibe, '');
});

test('ключ уходит в заголовке x-goog-api-key, а не в адресе', async () => {
  let seen = null, url = '';
  APP.CONFIG.MODELS = ['одна'];
  globalThis.fetch = async (u, opt) => { url = u; seen = opt.headers; return sse([sseChunk(SPEC_JSON)]); };
  await APP.GEMINI.generate({ seed: 'seed-2' });
  assert.ok(seen['x-goog-api-key'], 'заголовок с ключом есть');
  assert.ok(!url.includes(APP.CONFIG.API_KEY), 'в URL ключа нет');
  assert.equal(seen['content-type'], 'application/json');
});

test('прогресс растёт во время стриминга', async () => {
  APP.CONFIG.MODELS = ['одна'];
  const half = Math.floor(SPEC_JSON.length / 2);
  globalThis.fetch = async () => sse([sseChunk(SPEC_JSON.slice(0, half)), sseChunk(SPEC_JSON.slice(half))]);
  const points = [];
  await APP.GEMINI.generate({ seed: 'seed-p', onProgress: (p) => points.push(p) });
  assert.ok(points.length >= 2, 'прогресс приходит несколько раз');
  assert.equal(points[points.length - 1], 1, 'в конце — единица');
  assert.ok(points[0] < points[points.length - 1]);
});

test('битый JSON на всех моделях — понятная ошибка', async () => {
  APP.CONFIG.MODELS = ['плохая'];
  globalThis.fetch = async () => sse(['data: ' + JSON.stringify({ candidates: [{ content: { parts: [{ text: 'ничего не json' }] } }] }) + '\n\n']);
  await assert.rejects(() => APP.GEMINI.generate({ seed: 'seed-3' }), /не получилось/i);
});

test('подсказки этапов идут по возрастанию', () => {
  const seq = [0, 300, 1000, 2000, 3500, 5000, 6500].map((c) => APP.GEMINI.stageFor(c));
  assert.equal(new Set(seq).size, seq.length);
  // лёгкая модель пишет короче — этапы должны пройти по той же шкале
  const lite = [0, 150, 500, 1000, 1750, 2500, 3300].map((c) => APP.GEMINI.stageFor(c, 3400));
  assert.equal(new Set(lite).size, lite.length, 'этапы lite тоже различимы: ' + lite.join(' | '));
  assert.equal(APP.GEMINI.estFor('gemini-3.1-flash-lite'), 3400);
  assert.equal(APP.GEMINI.estFor('gemini-3.8-flash'), 6800);
});

test('thinkingConfig: ровно один ключ, по семейству модели', () => {
  // API отвечает 400, если прислать thinkingLevel и thinkingBudget сразу
  for (const model of ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.5-flash-lite', 'gemini-2.5-flash']) {
    const cfg = APP.GEMINI.requestBody('sys', 'user', model).generationConfig.thinkingConfig;
    assert.ok(cfg, 'thinkingConfig есть для ' + model);
    const keys = Object.keys(cfg);
    assert.equal(keys.length, 1, 'ровно один ключ для ' + model + ', а не ' + keys.join('+'));
    if (/^gemini-2\.5/.test(model)) assert.equal(keys[0], 'thinkingBudget');
    else assert.equal(keys[0], 'thinkingLevel');
  }
  // можно вовсе отключить размышления
  const saved = APP.CONFIG.THINKING_LEVEL;
  APP.CONFIG.THINKING_LEVEL = '';
  APP.CONFIG.THINKING_BUDGET = null;
  assert.equal(APP.GEMINI.requestBody('sys', 'user', 'gemini-3.8-flash').generationConfig.thinkingConfig, undefined);
  APP.CONFIG.THINKING_LEVEL = saved;
});

test('модели в конфиге — без известных мёртвых и без повторов', () => {
  const list = CONFIG_MODELS;
  assert.ok(list.length >= 2, 'нужен запас моделей');
  assert.ok(!list.includes('gemini-2.5-flash'), 'gemini-2.5-flash отдаёт 404 новым ключам');
  assert.equal(new Set(list).size, list.length, 'без повторов');
  assert.ok(list.every((m) => /^gemini-/.test(m)), 'только gemini-модели');
});

test('через прокси модель едет в адресе, а ключ не уходит', async () => {
  const savedUrl = APP.CONFIG.PROXY_URL, savedKey = APP.CONFIG.API_KEY;
  APP.CONFIG.PROXY_URL = 'https://proxy.test';
  APP.CONFIG.API_KEY = 'секретный-ключ';
  APP.CONFIG.MODELS = ['gemini-3.8-flash'];
  let url = '', headers = null;
  globalThis.fetch = async (u, opt) => { url = u; headers = opt.headers; return sse([sseChunk(SPEC_JSON)]); };
  await APP.GEMINI.generate({ seed: 'seed-proxy' });
  assert.equal(url, 'https://proxy.test/generate?model=gemini-3.8-flash');
  assert.ok(!headers['x-goog-api-key'], 'ключ остаётся на сервере');
  assert.equal(headers['content-type'], 'application/json');
  APP.CONFIG.PROXY_URL = savedUrl;
  APP.CONFIG.API_KEY = savedKey;
});

/* ---- последовательный прогон, чтобы тесты не мешали друг другу ---- */
let passed = 0, failed = 0;
for (const t of tests) {
  try {
    await t.fn();
    passed++;
    console.log('  ok  ' + t.name);
  } catch (e) {
    failed++;
    console.error('  FAIL ' + t.name + '\n      ' + (e && e.message ? e.message : e));
  }
}
console.log('\n' + passed + ' проверок пройдено' + (failed ? ', ошибок: ' + failed : ''));
process.exitCode = failed ? 1 : 0;
