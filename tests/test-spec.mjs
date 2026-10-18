/* Тесты чистой логики (без DOM): node tests/test-spec.mjs
   Проверяем, что любой ответ модели — даже кривой — превращается
   в безопасную структуру, а локальный фолбэк всегда собирает сайт. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
for (const f of ['js/extras.js', 'js/spec.js']) {
  (0, eval)(fs.readFileSync(path.join(ROOT, f), 'utf8'));
}
const { SPEC, EXTRAS } = globalThis.APP;
let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { console.error('  FAIL ' + name + '\n      ' + e.message); process.exitCode = 1; }
}

console.log('SPEC');

test('каталог и подсказки непустые', () => {
  assert.ok(SPEC.GAMES.length >= 10);
  assert.ok(SPEC.gameCatalogText().includes('snake'));
  assert.ok(SPEC.paramDoc(SPEC.GAMES[0].params).includes('speed'));
});

test('мусорный ответ превращается в рабочий сайт', () => {
  const spec = SPEC.normalize({
    title: 42,
    theme: { mode: 'зелёный', hue: '3333333', accent: 'красный', radius: 999, glow: -5 },
    sections: [{ type: 'нет такой' }, null, { type: 'games', items: [{ game: 'unknown' }] }],
    customGame: { name: 'x', html: 'no html here at all' }
  }, { seed: 's1' });
  assert.equal(spec.theme.hue, 360);
  assert.equal(spec.theme.radius, 40);
  assert.equal(spec.theme.accent, '#7c5cff');
  assert.ok(spec.sections.some((s) => s.type === 'games'));
  assert.ok(spec.sections.length >= 3);
  assert.equal(spec.customGame, null);
});

test('параметры игр зажимаются в допустимые диапазоны', () => {
  const spec = SPEC.normalize({
    sections: [{
      type: 'games',
      items: [
        { game: 'snake', params: { speed: 999, wrap: 'да', cols: -5 } },
        { game: 'mines', params: { w: 30, h: 2, mines: 99 } },
        { game: 'aim', params: { seconds: 500, size: 1 } }
      ]
    }]
  }, { seed: 's2' });
  const items = spec.sections.find((s) => s.type === 'games').items;
  assert.deepEqual(items[0].params, { speed: 9, wrap: false, cols: 14 });
  assert.deepEqual(items[1].params, { w: 10, h: 6, mines: 16 });
  assert.deepEqual(items[2].params, { seconds: 40, size: 28 });
});

test('опасный или пустой HTML сюрприза отбрасывается', () => {
  const bad = [
    { html: 'x'.repeat(400) },
    { html: '<div>ok</div>'.repeat(30) + '<iframe srcdoc="x">' },
    { html: '<script>top.location=1</script>' + 'y'.repeat(300) }
  ];
  bad.forEach((cg) => assert.equal(SPEC.normalize({ customGame: cg }, { seed: 'x' }).customGame, null));
  const good = SPEC.normalize({ customGame: { name: 'Игра', emoji: '🎈', blurb: 'ок', html: '<!doctype html><html><body>' + '<div>стекло</div>'.repeat(30) + '</body></html>' } }, { seed: 'x' });
  assert.ok(good.customGame && good.customGame.html.length > 200);
});

test('слишком мало разделов — добираем автоматически', () => {
  const spec = SPEC.normalize({ sections: [] }, { seed: 's3' });
  assert.ok(spec.sections.length >= 3);
  assert.ok(spec.sections.some((s) => s.type === 'games'));
  assert.ok(spec.nav.length >= 2);
});

test('секции чинятся: пустые строки, лишние поля', () => {
  const spec = SPEC.normalize({
    sections: [
      { type: 'quests', items: [{ title: '' }, { title: 'A', reward: 900 }, { title: 'B' }, { title: 'C' }, { title: 'D' }] },
      { type: 'wheel', items: ['a', '', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] },
      { type: 'news', items: [{ title: 'T', body: 'B' }] }
    ]
  }, { seed: 's4' });
  const quests = spec.sections.find((s) => s.type === 'quests');
  assert.equal(quests.items.length, 4);
  assert.equal(quests.items[0].reward, 100);
  assert.equal(spec.sections.find((s) => s.type === 'wheel').items.length, 8);
  assert.equal(spec.sections.some((s) => s.type === 'news'), false, 'новость без пары карточек не проходит');
});

test('фолбэк работает без ИИ и зависит от зерна', () => {
  const a = SPEC.fallback('seed-a');
  const b = SPEC.fallback('seed-b');
  assert.ok(a.sections.length >= 3);
  assert.ok(a.sections.some((s) => s.type === 'games'));
  assert.equal(a.meta.model, 'fallback');
  assert.ok(a.customGame, 'локальная игра-сюрприз подставляется');
  assert.ok(EXTRAS.miniGames.length >= 3);
  const sig = (s) => JSON.stringify(s.sections.map((x) => x.type)) + s.title + JSON.stringify(s.theme);
  assert.notEqual(sig(a), sig(b));
});

test('ссылка-поделиться переживает сжатие и распаковку', async () => {
  const spec = SPEC.fallback('share-seed');
  const hash = await SPEC.encodeShare(spec);
  assert.ok(hash.length > 20);
  const back = await SPEC.decodeShare(hash);
  assert.equal(back.title, spec.title);
  assert.equal(back.sections.length, spec.sections.length);
  assert.equal(await SPEC.decodeShare('gабв'), null);
});

test('все движки игр из каталога объявлены в games.js', () => {
  const src = fs.readFileSync(path.join(ROOT, 'js/games.js'), 'utf8');
  SPEC.GAMES.forEach((g) => {
    assert.ok(new RegExp('\\b' + g.id + ':').test(src), 'нет реализации для ' + g.id);
  });
});

console.log('\n' + passed + ' проверок пройдено' + (process.exitCode ? ' (есть ошибки)' : ''));
