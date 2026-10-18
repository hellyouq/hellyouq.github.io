/* Проверка, что все классы, которые использует JS и HTML, описаны в CSS:
   node tests/check-classes.mjs
   Ловит опечатки вида class: 'lg-game-foot' при .lg-game-footer в стилях.
   Динамические склейки ('b2048-tile v' + t.value) не считаются ошибкой. */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const css = fs.readFileSync(path.join(ROOT, 'css/app.css'), 'utf8');
const cssClasses = new Set([...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]));

const files = ['js/games.js', 'js/widgets.js', 'js/render.js', 'js/main.js', 'index.html', '404.html'];
const used = new Map();   // класс -> файл

function note(token, file) {
  if (!token || token.length < 2) return;
  if (new RegExp('^' + token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\w-]*$').test(token) === false) return;
  if (!used.has(token)) used.set(token, file);
}

for (const file of files) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  // class: '...' + ...   (склейка — последний фрагмент может быть динамическим)
  for (const m of src.matchAll(/class:\s*'([^']*)'\s*(\+)?/g)) {
    const tokens = m[1].split(/\s+/).filter(Boolean);
    tokens.forEach((c, i) => {
      const dynamicTail = !!m[2] && i === tokens.length - 1 && !cssClasses.has(c);
      if (!dynamicTail) note(c, file);
    });
  }
  for (const m of src.matchAll(/class:\s*"([^"]*)"/g)) m[1].split(/\s+/).filter(Boolean).forEach((c) => note(c, file));
  for (const m of src.matchAll(/class="([^"]*)"/g)) m[1].split(/\s+/).filter(Boolean).forEach((c) => note(c, file));
  // строки вида 'lg-game is-full' в classList.toggle/add
  for (const m of src.matchAll(/classList\.(?:toggle|add|remove)\(\s*'([^']*)'/g)) m[1].split(/\s+/).filter(Boolean).forEach((c) => note(c, file));
}

const missing = [...used.entries()].filter(([c]) => !cssClasses.has(c));
if (missing.length) {
  console.log('Классы без стилей:');
  missing.forEach(([c, f]) => console.log('  ' + c + '   (' + f + ')'));
  process.exit(1);
}
console.log('Все ' + used.size + ' классов из разметки описаны в CSS');
