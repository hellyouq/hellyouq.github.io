/* ==========================================================================
   Сакура — petals, confetti, roulette, reveals
   ========================================================================== */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cs = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  /* ---------------------------------------------------------------- petals */
  const PETALS = [
    ["#ffd6e7", 9, 14, 17],
    ["#ffc2da", 7, 11, 14],
    ["#ffffff", 6, 9, 12],
    ["#ffe3ee", 11, 18, 21],
    ["#ffcfe3", 5, 8, 11],
  ];
  const field = $("#petalField");
  if (field) {
    const n = window.innerWidth < 700 ? 16 : 34;
    let html = "";
    for (let i = 0; i < n; i++) {
      const p = PETALS[Math.floor(Math.random() * PETALS.length)];
      html += `<i style="left:${(Math.random() * 100).toFixed(2)}%;
        --pc:${p[0]};--pw:${p[1]}px;--ph:${p[2]}px;--pd:${p[3] + Math.random() * 12}s;
        --pdl:${(Math.random() * -22).toFixed(1)}s;--px:${(Math.random() * 22 - 8).toFixed(1)}vw;
        --po:${(0.35 + Math.random() * 0.5).toFixed(2)}"></i>`;
    }
    field.innerHTML = html;
  }

  /* ------------------------------------------------------------ scroll-in */
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
    { threshold: 0.08, rootMargin: "0px 0px -40px" }
  );
  const observe = () => $$(".reveal-in:not(.in)").forEach((el) => io.observe(el));
  observe();

  /* ------------------------------------------------------------------ nav */
  const burger = $("#burger"), links = $("#navLinks");
  burger?.addEventListener("click", () => links.classList.toggle("open"));
  links?.addEventListener("click", (e) => { if (e.target.tagName === "A") links.classList.remove("open"); });

  /* ------------------------------------------------------------- theming */
  const root = document.documentElement;
  const themeBtn = $("#themeBtn");
  const paintTheme = (t) => {
    if (t) root.dataset.theme = t;
    else delete root.dataset.theme;
    themeBtn?.setAttribute("title", t === "dark" ? "Светлая тема" : "Тёмная тема");
  };
  themeBtn?.addEventListener("click", () => {
    const isDark = root.dataset.theme
      ? root.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    const next = isDark ? "light" : "dark";
    paintTheme(next);
    try { localStorage.setItem("sakura-theme", next); } catch (e) {}
    say(next === "dark" ? "Лунная сакура 🌙" : "Дневная сакура 🌸");
  });
  paintTheme(root.dataset.theme || "");

  /* --------------------------------------------------------------- notice */
  const notice = $("#notice");
  let noticeTimer;
  function say(text, bad = false) {
    if (!notice) return;
    notice.textContent = text;
    notice.classList.toggle("bad", bad);
    notice.classList.add("show");
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => notice.classList.remove("show"), 3600);
  }
  window.say = say;

  /* --------------------------------------------------------- image safety */
  // Every remote portrait degrades to a locally painted sakura SVG.
  document.addEventListener(
    "error",
    (e) => {
      const img = e.target;
      if (img.tagName !== "IMG" || !img.dataset.fallback) return;
      if (img.dataset.tried) return;
      img.dataset.tried = "1";
      img.src = img.dataset.fallback;
    },
    true
  );

  /* ---------------------------------------------------------------- purse */
  const purse = $("#purse"), purseVal = $("#purseVal");
  purse?.addEventListener("click", async () => {
    // on the static build static-mode.js owns the daily gift in localStorage
    if (window.SAKURA?.static) return;
    if (purse.dataset.ready !== "1") { say("Подарок уже получен. Загляни завтра 🌸"); return; }
    try {
      const r = await fetch(window.SAKURA.dailyUrl, {
        method: "POST",
        headers: { "X-CSRFToken": window.SAKURA.csrf, "X-Requested-With": "XMLHttpRequest" },
      });
      const d = await r.json();
      if (d.ok) {
        setPetals(d.petals, true);
        purse.dataset.ready = "0";
        say(`Ежедневный подарок: +${d.gain} 🌸`);
        burst(window.innerWidth / 2, 70, 34);
      } else {
        say("Подарок уже получен. Загляни завтра 🌸");
      }
    } catch { say("Что-то пошло не так", true); }
  });

  function setPetals(v, bump) {
    if (!purseVal) return;
    purseVal.textContent = v;
    if (bump) { purse.classList.remove("bump"); void purse.offsetWidth; purse.classList.add("bump"); }
  }

  /* ------------------------------------------------------------- confetti */
  const canvas = $("#confetti");
  const ctx = canvas.getContext("2d");
  let parts = [], raf = 0;
  const COLORS = ["#ff8fb8", "#ffd6e7", "#ffffff", "#ffc2da", "#c4b5fd", "#93c5fd", "#5ecdc0", "#ffd166"];

  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + "px"; canvas.style.height = innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  sizeCanvas();
  addEventListener("resize", sizeCanvas);

  function burst(x, y, count = 40) {
    if (!canvas || reduced) return;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 3 + Math.random() * 11;
      parts.push({
        x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 4,
        s: 5 + Math.random() * 9, r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.34,
        c: COLORS[(Math.random() * COLORS.length) | 0],
        life: 1, petal: Math.random() > 0.35,
      });
    }
    if (!raf) { canvas.style.display = "block"; raf = requestAnimationFrame(tick); }
  }

  function tick() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter((p) => p.life > 0 && p.y < innerHeight + 60);
    for (const p of parts) {
      p.vy += 0.22; p.vx *= 0.985; p.vy *= 0.985;
      p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= 0.0055;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.fillStyle = p.c;
      ctx.beginPath();
      if (p.petal) ctx.ellipse(0, 0, p.s, p.s * 0.62, 0, 0, Math.PI * 2);
      else ctx.arc(0, 0, p.s * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    if (parts.length) raf = requestAnimationFrame(tick);
    else { raf = 0; canvas.style.display = "none"; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }

  /* -------------------------------------------------------------- roulette */
  const shell = $("#openShell");
  const strip = $("#roulStrip");
  const roulBox = $("#roulBox");
  const revealBox = $("#revealBox");
  const grid10 = $("#grid10");
  const ITEM_W = () => $$(".roul-item", strip)[0]?.getBoundingClientRect().width || 180;
  const RAR_LABEL = { sakura: "🌸 Легенда сакуры", mythic: "💜 Мифическая", epic: "💠 Эпическая", rare: "💚 Редкая", common: "🍃 Обычная" };

  let busy = false;

  // static-mode.js installs SAKURA.pull to run the gacha entirely in the browser
  async function pullFromServer(slug, amount) {
    if (typeof window.SAKURA.pull === "function") return window.SAKURA.pull(slug, amount);
    const body = new URLSearchParams({ amount });
    const r = await fetch(`${window.SAKURA.openUrl.replace("/sakura/x/", `/${slug}/`)}`, {
      method: "POST",
      body,
      headers: { "X-CSRFToken": window.SAKURA.csrf, "X-Requested-With": "XMLHttpRequest" },
    });
    return r.json();
  }

  function closeShell() {
    shell?.classList.remove("show");
    document.body.style.overflow = "";
  }

  async function openCase(slug, amount, pool) {
    if (busy) return;
    busy = true;
    const price = Number(document.body.dataset.price || 0);

    shell.classList.add("show");
    document.body.style.overflow = "hidden";
    roulBox.style.display = "flex";
    revealBox.classList.remove("show");
    grid10.classList.remove("show");
    grid10.innerHTML = "";
    $("#roulTick").textContent = amount > 1 ? `открываем ×${amount}…` : "открываем…";

    let data;
    try {
      data = await pullFromServer(slug, amount);
    } catch {
      busy = false;
      closeShell();
      return say("Сеть не выдержала. Попробуй ещё раз.", true);
    }

    if (!data.ok) {
      busy = false;
      closeShell();
      return say(data.error + (data.need ? ` — не хватает ${data.need} 🌸` : ""), true);
    }

    setPetals(data.petals, true);
    if (data.legendary) burst(innerWidth / 2, innerHeight / 2, 90);
    document.dispatchEvent(new CustomEvent("sakura:opened", { detail: data }));

    if (amount > 1) showGrid(data.results);
    else await playRoulette(data.results[0], pool);

    busy = false;
  }

  function buildStrip(target, pool) {
    strip.innerHTML = "";
    const w = ITEM_W();
    const lead = 14;
    const cells = [];
    for (let i = 0; i < lead; i++) cells.push(pool[(i * 7 + 3) % pool.length]);
    cells.push(target);
    const tail = 14;
    for (let i = 0; i < tail; i++) cells.push(pool[(i * 11 + 5) % pool.length]);
    strip.innerHTML = cells.map(cel).join("");
    return { index: lead, w };
  }

  function cel(it) {
    const cls = `tier-${it.tier}`;
    return `<div class="roul-item ${cls}">
      <img src="${it.image}" data-fallback="${it.fallback}" alt="${it.name}" loading="eager">
      <b>${it.name}</b><span class="rar rar-${it.rarity}">${RAR_LABEL[it.rarity] || ""}</span>
    </div>`;
  }

  function playRoulette(res, pool) {
    return new Promise((resolve) => {
      if (!pool || !pool.length) { showReveal(res, resolve); return; }
      const { index } = buildStrip(res, pool);
      const w = ITEM_W();
      const dur = reduced ? 300 : 4200 + Math.random() * 900;
      const target = -index * w + w / 2 - strip.parentElement.clientWidth / 2 + w / 2;

      // 2 full revolutions plus jitter so the landing never looks pre-set
      const from = -index * w + w * (pool.length * 2);
      strip.style.transition = "none";
      strip.style.transform = `translateX(${from}px)`;
      void strip.offsetWidth;
      strip.style.transition = `transform ${dur}ms cubic-bezier(.12,.72,.09,1)`;
      strip.style.transform = `translateX(${target}px)`;

      setTimeout(() => showReveal(res, resolve), dur + 130);
    });
  }

  function showReveal(res, done) {
    roulBox.style.display = "none";
    const card = $("#revealCard");
    const img = $("#revealImg");
    card.className = `reveal-card tier-${res.tier}`;
    img.src = res.image;
    img.dataset.fallback = res.fallback;
    img.alt = res.name;
    delete img.dataset.tried;
    const rar = $("#revealRar");
    rar.className = `rar rar-${res.rarity}`;
    rar.textContent = RAR_LABEL[res.rarity] || res.rarity_label;
    $("#revealName").textContent = res.name;
    $("#revealTitle").textContent = res.is_new
      ? "Новая девочка в твоей коллекции!"
      : `В коллекции: ${res.count} шт.`;

    $("#revealActs").innerHTML = `
      <a class="btn" href="${res.url}">Открыть профиль</a>
      <a class="btn btn-ghost" href="/sakura/collection/">В коллекцию</a>
      <button class="btn btn-soft" type="button" data-close>Ещё раз</button>`;

    revealBox.classList.add("show");
    const cx = card.getBoundingClientRect().left + card.clientWidth / 2;
    const cy = card.getBoundingClientRect().top + card.clientHeight / 2;
    burst(cx, cy, res.tier === 0 ? 110 : res.tier === 1 ? 60 : 26);
    $$("[data-close]", $("#revealActs")).forEach((b) => b.addEventListener("click", closeShell));
    done && done();
  }

  function showGrid(results) {
    roulBox.style.display = "none";
    grid10.innerHTML = results
      .map(
        (r, i) => `<div class="mini tier-${r.tier}" style="animation-delay:${i * 55}ms">
          <span class="rar rar-${r.rarity}">${r.tier === 0 ? "🌸" : r.tier === 1 ? "💜" : r.tier === 2 ? "💠" : r.tier === 3 ? "💚" : "🍃"}</span>
          <img src="${r.image}" data-fallback="${r.fallback}" alt="${r.name}">
          <b>${r.name}${r.is_new ? " ✦" : ` ×${r.count}`}</b>
        </div>`
      )
      .join("");
    grid10.classList.add("show");
    const best = results.reduce((a, b) => (b.tier < a.tier ? b : a));
    burst(innerWidth / 2, innerHeight * 0.35, best.tier === 0 ? 110 : 34);

    const bar = document.createElement("div");
    bar.className = "reveal-acts";
    bar.style.marginTop = "18px";
    bar.innerHTML = `
      <a class="btn" href="${best.url}">Лучшая из десяти</a>
      <a class="btn btn-ghost" href="/sakura/collection/">В коллекцию</a>
      <button class="btn btn-soft" type="button" data-close>Закрыть</button>`;
    grid10.appendChild(bar);
    $$("[data-close]", bar).forEach((b) => b.addEventListener("click", closeShell));
  }

  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeShell(); });
  shell?.addEventListener("click", (e) => { if (e.target === shell) closeShell(); });

  /* ---------------------------------------------------------------- tilt */
  if (!reduced && matchMedia("(pointer:fine)").matches) {
    $$(".c-card, .g-card").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateY(${px * 7}deg) rotateX(${-py * 7}deg) translateY(-8px) scale(1.02)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  }

  window.SakuraOpen = { open: openCase, say, burst, close: closeShell };
})();
