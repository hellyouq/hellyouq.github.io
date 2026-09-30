/* Client-side engine for the GitHub Pages build.
 *
 * Pages cannot run Django, so this file owns the whole game loop: the catalogue comes
 * from /data.json and progress lives in localStorage. It plugs into sakura.js by
 * setting SAKURA.pull, so the roulette/reveal animation stays shared with the Django
 * version.
 */
(() => {
  "use strict";

  const KEY = "sakura.save.v1";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nf = new Intl.NumberFormat("ru-RU");

  let D = null; // catalogue
  let save = null; // player state

  // ------------------------------------------------------------------ state
  const blank = () => ({
    v: 1,
    name: "",
    petals: 3000,
    total_opens: 0,
    legendaries: 0,
    pity: 0,
    lastDaily: 0,
    owned: {}, // girlId -> {c: copies, s: shards, t: lastAt}
    logs: [], // {g, c, n, t}
    lots: [], // {id, g, price, status, at}
    trades: 0,
  });

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      save = raw ? { ...blank(), ...JSON.parse(raw) } : blank();
    } catch {
      save = blank();
    }
    if (!save.owned) save.owned = {};
    if (!Array.isArray(save.logs)) save.logs = [];
    if (!Array.isArray(save.lots)) save.lots = [];
    if (!save.name) save.name = "Сакурист";
    if (!save.lastDaily) save.lastDaily = 0;
  }

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(save));
    } catch {
      /* private mode: play on, just don't save */
    }
  }

  const byId = new Map();
  const girl = (id) => byId.get(Number(id));
  const caseBy = (slug) => D.cases.find((c) => c.slug === slug);

  // ------------------------------------------------------------------- gacha
  function roll(c) {
    const total = c.drops.reduce((s, d) => s + d.w, 0);
    let r = Math.random() * total;
    for (const d of c.drops) {
      r -= d.w;
      if (r <= 0) return d.girl;
    }
    return c.drops[c.drops.length - 1].girl;
  }

  /** Mirrors sakura.views.open_case: same pity rule, same copy bookkeeping. */
  window.SAKURA.pull = async function (slug, amount) {
    const c = caseBy(slug);
    if (!c) return { ok: false, error: "Кейс не найден" };
    const cost = c.price * amount;
    if (save.petals < cost)
      return { ok: false, error: "Не хватает лепестков", need: cost - save.petals, petals: save.petals };

    const results = [];
    let legendary = false;
    for (let i = 0; i < amount; i++) {
      let id;
      // a case that contains sakura guarantees one within PITY_LIMIT pulls
      const atCap = c.hasLegendary && save.pity >= D.pityLimit - 1;
      if (atCap) {
        id = (c.drops.find((d) => girl(d.girl)?.rarity === "sakura") || c.drops[0]).girl;
      } else {
        id = roll(c);
      }
      const g = girl(id);
      const wasNew = !save.owned[id];
      const row = wasNew ? { c: 0, s: 0, t: Date.now() } : save.owned[id];
      row.c += 1;
      row.s += 1;
      row.t = Date.now();
      save.owned[id] = row;

      if (g.rarity === "sakura") {
        save.pity = 0;
        legendary = true;
      } else if (save.pity < D.pityLimit) {
        save.pity += 1;
      }
      save.logs.unshift({ g: id, c: c.id, n: wasNew, t: Date.now() });
      results.push({
        id: g.id,
        name: g.name,
        slug: g.slug,
        rarity: g.rarity,
        tier: g.tier,
        color: g.color,
        image: g.image,
        fallback: g.fallback,
        count: row.c,
        is_new: wasNew,
        owned: true,
        url: g.url,
      });
    }
    save.logs = save.logs.slice(0, 200);
    save.petals -= cost;
    save.total_opens += amount;
    if (legendary) save.legendaries += 1;
    persist();
    renderPurse();
    return { ok: true, results, petals: save.petals, pity: save.pity, pity_max: D.pityLimit, legendary };
  };

  // --------------------------------------------------------------- chrome
  function renderPurse() {
    const el = $("#purseVal");
    if (el) el.textContent = nf.format(save.petals);
    $$("[data-purse-static]").forEach((n) => (n.textContent = nf.format(save.petals)));
    const btn = $("#dailyBtn");
    if (btn) {
      const ready = dailyReady();
      btn.disabled = !ready;
      btn.textContent = ready ? "Забрать подарок" : "Уже получено";
    }
  }

  const DAILY_MS = 20 * 3600 * 1000;
  const dailyReady = () => Date.now() - (save.lastDaily || 0) >= DAILY_MS;

  function claimDaily() {
    if (!dailyReady()) return false;
    save.lastDaily = Date.now();
    save.petals += D.dailyAmount;
    persist();
    renderPurse();
    return true;
  }

  function flash(text, bad) {
    const n = $("#notice");
    if (!n) return;
    n.textContent = text;
    n.classList.toggle("bad", !!bad);
    n.classList.add("show");
    clearTimeout(flash._t);
    flash._t = setTimeout(() => n.classList.remove("show"), 2600);
  }

  // -------------------------------------------------------------- page: girl
  function paintGirl() {
    const host = document.querySelector("[data-girl]");
    if (!host) return;
    const g = girl(host.dataset.girl);
    if (!g) return;
    const row = save.owned[g.id];
    $$("[data-static='own']").forEach((n) => {
      n.textContent = row ? `×${row.c}` : "не найдена";
      n.className = row ? "chip on" : "chip";
    });
    const ownCount = $$("[data-static='owners']").map((n) => n);
    if (ownCount.length) {
      // no global player table on Pages, so show the local count honestly
      ownCount[0].textContent = row ? `только у тебя — ${row.c}` : "ещё никто не открыл";
    }
  }

  // --------------------------------------------------------- page: collection
  function paintCollection() {
    const grid = $("#collGrid");
    if (!grid) return;
    const q = new URLSearchParams(location.search);
    const rarity = q.get("rarity") || "";
    const el = q.get("element") || "";
    const ownedF = q.get("owned") || "";
    const sort = q.get("sort") || "rarity";
    const text = (q.get("q") || "").trim().toLowerCase();

    let list = D.girls.slice();
    if (rarity) list = list.filter((g) => g.rarity === rarity);
    if (el) list = list.filter((g) => g.element === el);
    if (text)
      list = list.filter(
        (g) =>
          g.name.toLowerCase().includes(text) ||
          g.title.toLowerCase().includes(text) ||
          g.series.toLowerCase().includes(text),
      );
    if (ownedF === "have") list = list.filter((g) => save.owned[g.id]);
    if (ownedF === "missing") list = list.filter((g) => !save.owned[g.id]);

    const cmp = {
      rarity: (a, b) => a.tier - b.tier || a.name.localeCompare(b.name, "ru"),
      name: (a, b) => a.name.localeCompare(b.name, "ru"),
      power: (a, b) => b.power - a.power,
      new: (a, b) => b.id - a.id,
    }[sort];
    list.sort(cmp);

    const have = Object.keys(save.owned).length;
    const total = D.girls.length;
    $("#collCount").textContent = `${have} из ${total} девочек`;
    $("#collBar").style.width = (total ? (have / total) * 100 : 0) + "%";
    $("#collRank").textContent = `${Math.round(total ? (have / total) * 100 : 0)}% сада расцвело · ранг: ${rankTitle(have, total)}`;

    // per-rarity KPI + chips reflect local progress
    const stats = D.rarities.map((r) => {
      const all = D.girls.filter((g) => g.rarity === r.key);
      const got = all.filter((g) => save.owned[g.id]).length;
      return { ...r, have: got, pct: all.length ? Math.round((got / all.length) * 100) : 0 };
    });
    $("#collKpis").innerHTML = stats
      .map(
        (r) => `<a class="kpi tier-${r.key}" href="/sakura/collection/?rarity=${r.key}"
            style="text-decoration:none;border-top:4px solid ${r.color}">
          <span class="rar rar-${r.key}" style="align-self:flex-start">${esc(r.label)}</span>
          <b style="color:${r.color}">${r.have}<span class="dim" style="font-size:.9rem">/${r.total}</span></b>
          <div class="pill-progress tier-${r.key}"><i style="width:${r.pct}%"></i></div>
        </a>`,
      )
      .join("");

    $("#collChips").innerHTML =
      `<a class="chip ${rarity ? "" : "on"}" href="/sakura/collection/">Все редкости</a>` +
      stats
        .map((r) => {
          const on = rarity === r.key;
          return `<a class="chip ${on ? "on" : ""}" href="/sakura/collection/?rarity=${r.key}"
            style="${on ? `background:linear-gradient(120deg,${r.color},${r.color}cc)` : `border-color:${r.color}44`}">
            ${esc(r.label)} · ${r.have}/${r.total}</a>`;
        })
        .join("");

    if (!list.length) {
      grid.outerHTML = `<div class="empty card"><div class="empty-ico">🌸</div>
        <h3>Никого не нашлось</h3><p class="muted mt-s">Попробуй ослабить фильтры.</p>
        <a class="btn mt-m" href="/sakura/cases/">Открыть кейс</a></div>`;
      return;
    }
    grid.innerHTML = list.map(card).join("");
  }

  function card(g) {
    const row = save.owned[g.id];
    return `<a href="${g.url}" class="g-card tier-${g.tier} reveal-in in${row ? "" : " missing"}">
      <div class="g-face">
        <img src="${g.image}" data-fallback="${g.fallback}" alt="${esc(g.name)}"
             width="320" height="320" loading="lazy" decoding="async">
        <span class="rar g-rar rar-${g.rarity}">${esc(g.rarityLabel)}</span>
        ${row ? `<span class="g-count">×${row.c}</span>` : ""}
      </div>
      <div class="g-info">
        <div class="g-name">${esc(g.name)}</div>
        <div class="g-title">${esc(g.title)}</div>
        <div class="g-meta">
          <span class="g-elem"><i style="background:${g.accent}"></i>${esc(g.elementLabel)}</span>
          ${row ? `<span class="g-shards">◈ ${row.s}</span>` : `<span class="locked-note">не найдена</span>`}
        </div>
      </div>
    </a>`;
  }

  function rankTitle(have, total) {
    const p = total ? have / total : 0;
    if (p >= 1) return "Полный сад";
    if (p >= 0.8) return "Цветение";
    if (p >= 0.5) return "Бутоны";
    if (p >= 0.25) return "Рост";
    if (p > 0) return "Сад посажен";
    return "Первый лепесток";
  }

  // ------------------------------------------------------------- page: profile
  function paintProfile() {
    if (!$("#profKpis")) return;
    const total = D.girls.length;
    const have = Object.keys(save.owned).length;
    const luck = save.total_opens ? Math.round((countHits("sakura") / save.total_opens) * 1000) : 0;
    $("#kpiOpens").textContent = nf.format(save.total_opens);
    $("#kpiHave").innerHTML = `${have}<span class="dim" style="font-size:.9rem">/${total}</span>`;
    $("#kpiLegs").textContent = save.legendaries;
    $("#kpiLuck").textContent = luck + "%";

    const left = Math.max(0, D.pityLimit - save.pity);
    $("#pityVal").textContent = `${save.pity} / ${D.pityLimit}`;
    $("#pityLeft").textContent = `ещё ${left} открытий до гарантированной легенды`;
    const bar = $("#pityBar");
    bar.classList.toggle("tier-0", save.pity > 44);
    bar.firstElementChild.style.width = Math.round((save.pity / D.pityLimit) * 100) + "%";

    $("#hitRows").innerHTML = D.rarities
      .map((r) => {
        const n = countHits(r.key);
        const pct = save.total_opens ? Math.round((n / save.total_opens) * 100) : 0;
        return `<div class="odds-row">
          <span class="rar rar-${r.key}">${esc(r.label)}</span>
          <span class="grow" style="max-width:220px">
            <span class="pill-progress tier-${r.tier}"><i style="width:${pct}%;background:${r.color}"></i></span>
          </span>
          <span class="odds-val" style="color:${r.color}">${n} · ${pct}%</span>
        </div>`;
      })
      .join("");

    const logs = save.logs.slice(0, 30);
    $("#logBox").innerHTML = logs.length
      ? `<table class="table mt-s"><thead><tr><th>Девочка</th><th>Кейс</th><th>Новая?</th><th>Когда</th></tr></thead><tbody>` +
        logs
          .map((l) => {
            const g = girl(l.g);
            const c = D.cases.find((x) => x.id === l.c);
            return `<tr>
              <td><a href="${g.url}" class="row gap-s">
                <span class="rar rar-${g.rarity}" style="width:8px;height:8px;padding:0;border-radius:50%"></span>
                <b>${esc(g.name)}</b></a></td>
              <td class="dim">${esc(c ? c.name : "—")}</td>
              <td>${l.n ? '<span class="rar rar-sakura" style="font-size:.6rem">NEW</span>' : '<span class="dim">—</span>'}</td>
              <td class="dim tiny">${ago(l.t)} назад</td>
            </tr>`;
          })
          .join("") +
        "</tbody></table>"
      : `<div class="empty" style="padding:40px 10px"><div class="empty-ico">🍃</div>
         <p class="muted">Ты пока ничего не открывал.</p>
         <a class="btn mt-m" href="/sakura/cases/">Выбрать кейс</a></div>`;

    const top = Object.entries(save.owned)
      .map(([id, r]) => ({ g: girl(id), r }))
      .filter((x) => x.g)
      .sort((a, b) => b.r.c - a.r.c)
      .slice(0, 8);
    $("#topBox").innerHTML = top.length
      ? top
          .map(
            ({ g, r }) => `<a href="${g.url}" class="row gap-s"
            style="padding:9px 12px;border-radius:14px;background:var(--s50);border:1px solid var(--line)">
            <img src="${g.image}" data-fallback="${g.fallback}" alt="" width="38" height="38" loading="lazy"
                 style="width:38px;height:38px;border-radius:12px;object-fit:cover">
            <span class="grow" style="font-size:.86rem;font-weight:600">${esc(g.name)}</span>
            <span class="rar rar-${g.rarity}">×${r.c}</span></a>`,
          )
          .join("")
      : `<p class="muted tiny mt-s">Пока пусто. Открой кейс!</p>`;
  }

  function countHits(rarity) {
    return save.logs.filter((l) => girl(l.g)?.rarity === rarity).length;
  }

  function ago(t) {
    const s = Math.max(0, (Date.now() - t) / 1000);
    if (s < 60) return `${Math.floor(s)} сек`;
    if (s < 3600) return `${Math.floor(s / 60)} мин`;
    if (s < 86400) return `${Math.floor(s / 3600)} ч`;
    return `${Math.floor(s / 86400)} дн`;
  }

  // ------------------------------------------------------------ page: case
  function paintCase() {
    if (!$("#cdPity")) return;
    const v = $("#cdPity"), bar = $("#cdPityBar");
    v.textContent = `${save.pity} / ${D.pityLimit}`;
    bar.classList.toggle("tier-0", save.pity > 44);
    bar.firstElementChild.style.width = Math.round((save.pity / D.pityLimit) * 100) + "%";
  }

  // ------------------------------------------------------------- page: market
  function sellHint(g) {
    const live = save.lots.filter((l) => l.g === g.id && l.status === "active").map((l) => l.price);
    return live.length ? live.sort((a, b) => a - b)[live.length >> 1] : g.baseValue;
  }

  function paintMarket() {
    if (!$("#sellBox")) return;
    const q = new URLSearchParams(location.search);
    const rarity = q.get("rarity") || "";
    const sort = q.get("sort") || "new";
    renderPurse();

    const active = save.lots.filter((l) => l.status === "active" && girl(l.g));
    let list = active.map((l) => ({ ...l, g: girl(l.g) }));
    if (rarity) list = list.filter((l) => l.g.rarity === rarity);

    const cmp = {
      new: (a, b) => b.at - a.at,
      cheap: (a, b) => a.price - b.price,
      rich: (a, b) => b.price - a.price,
      rarity: (a, b) => a.g.tier - b.g.tier || b.price - a.price,
    }[sort];
    list.sort(cmp);

    $("#lotList").innerHTML = list.length
      ? list
          .map(
            (l) => `<div class="card card-tight row wrapf gap-m" style="align-items:center">
          <a href="${l.g.url}" style="flex-shrink:0">
            <img src="${l.g.image}" data-fallback="${l.g.fallback}" alt="${esc(l.g.name)}" width="72" height="72" loading="lazy"
                 style="width:72px;height:72px;border-radius:18px;object-fit:cover;border:2.5px solid #fff;box-shadow:var(--shadow-m)"></a>
          <div style="flex:1;min-width:150px">
            <span class="rar rar-${l.g.rarity}" style="font-size:.6rem">${esc(l.g.rarityLabel)}</span>
            <a href="${l.g.url}"><b style="font-family:var(--font-d);font-size:1.02rem">${esc(l.g.name)}</b></a>
            <p class="dim tiny" style="margin-top:2px">${esc(l.g.elementLabel)} · продавец <b>${esc(save.name)}</b></p>
            <p class="dim tiny">средняя цена в рынке: <b>${sellHint(l.g)} 🌸</b></p>
          </div>
          <div style="text-align:right">
            <div class="c-price" style="font-size:1.2rem">🌸 ${nf.format(l.price)}</div>
            <button class="btn btn-sm" style="margin-top:8px" data-buy="${l.id}" ${save.petals < l.price ? "disabled" : ""}>
              ${save.petals < l.price ? "Не хватает" : "Купить"}</button>
          </div></div>`,
          )
          .join("")
      : `<div class="empty card"><div class="empty-ico">🪙</div><h3>Лотов пока нет</h3>
         <p class="muted mt-s">Открой кейсы, собери дубли и выставляй их сюда.</p>
         <a class="btn mt-m" href="/sakura/cases/">В кейсы</a></div>`;

    const mine = Object.entries(save.owned)
      .map(([id, r]) => ({ g: girl(id), r }))
      .filter(({ g, r }) => g && r.c >= 2)
      .sort((a, b) => b.r.c - a.r.c);
    $("#sellCount").textContent = mine.length;
    $("#sellBox").innerHTML = mine.length
      ? mine
          .map(
            ({ g, r }) => `<form class="row gap-s" style="align-items:center" data-sell="${g.id}">
            <img src="${g.image}" data-fallback="${g.fallback}" alt="" width="40" height="40" loading="lazy"
                 style="width:40px;height:40px;border-radius:12px;object-fit:cover">
            <div class="grow" style="min-width:0">
              <b style="font-size:.84rem;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(g.name)}</b>
              <span class="dim tiny">×${r.c} · ориентир ${sellHint(g)} 🌸</span></div>
            <input class="input" type="number" name="price" min="${D.minPrice}" step="50" value="${sellHint(g)}"
                   style="width:104px;padding:8px 10px;font-size:.82rem" required>
            <button class="btn btn-xs" type="submit">Продать</button></form>`,
          )
          .join("")
      : `<div class="empty" style="padding:34px 10px"><div class="empty-ico">🌱</div>
         <p class="muted tiny">Нужна вторая копия девочки, чтобы её продать. Меняй кейсы!</p></div>`;

    const mineLots = save.lots.slice().sort((a, b) => b.at - a.at).slice(0, 24);
    $("#myLots").innerHTML = mineLots.length
      ? mineLots
          .map((l) => {
            const g = girl(l.g);
            if (!g) return "";
            return `<div class="row gap-s" style="padding:9px 12px;border-radius:14px;background:var(--s50);border:1px solid var(--line)">
            <b class="grow tiny" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(g.name)}</b>
            <span class="tiny">🌸 ${nf.format(l.price)}</span>` +
              (l.status === "active"
                ? `<button class="btn btn-xs btn-ghost" data-cancel="${l.id}">Снять</button>`
                : l.status === "sold"
                  ? `<span class="rar rar-rare" style="font-size:.55rem">Продано</span>`
                  : `<span class="rar rar-common" style="font-size:.55rem">Снято</span>`) +
              `</div>`;
          })
          .join("")
      : `<p class="muted tiny">Ты ничего не выставлял.</p>`;
    $("#tradeCount").textContent = save.trades;
  }

  function wireMarket() {
    document.addEventListener("submit", (e) => {
      const form = e.target.closest("[data-sell]");
      if (!form) return;
      e.preventDefault();
      const id = Number(form.dataset.sell);
      const price = Math.round(Number(form.querySelector("input").value) || 0);
      const row = save.owned[id];
      if (price < D.minPrice) return flash(`Минимум — ${D.minPrice} 🌸`, true);
      if (!row || row.c < 2) return flash("Нужна вторая копия девочки", true);
      if (save.lots.filter((l) => l.g === id && l.status === "active").length >= D.maxLots)
        return flash(`Не больше ${D.maxLots} активных лотов на девочку`, true);
      row.c -= 1; // reserve the copy, same as the server
      save.lots.unshift({ id: Date.now() + Math.random(), g: id, price, status: "active", at: Date.now() });
      persist();
      paintMarket();
      flash("Лот выставлен 🌸");
    });

    document.addEventListener("click", (e) => {
      const buy = e.target.closest("[data-buy]");
      if (buy) {
        const lot = save.lots.find((l) => String(l.id) === buy.dataset.buy);
        if (!lot || lot.status !== "active") return;
        if (save.petals < lot.price) return flash("Не хватает лепестков", true);
        const g = girl(lot.g);
        const wasNew = !save.owned[g.id];
        const row = wasNew ? { c: 0, s: 0, t: Date.now() } : save.owned[g.id];
        row.c += 1;
        row.s += 1;
        row.t = Date.now();
        save.owned[g.id] = row;
        save.petals = save.petals - lot.price + Math.round(lot.price * (100 - D.feePercent) / 100);
        lot.status = "sold";
        save.trades += 1;
        persist();
        paintMarket();
        return flash(wasNew ? `${g.name} уже в твоей коллекции!` : `Куплено: ${g.name}`);
      }
      const cancel = e.target.closest("[data-cancel]");
      if (cancel) {
        const lot = save.lots.find((l) => String(l.id) === cancel.dataset.cancel);
        if (!lot || lot.status !== "active") return;
        lot.status = "cancelled";
        const row = save.owned[lot.g];
        if (row) row.c += 1; // reserved copy goes back
        persist();
        paintMarket();
        flash("Лот снят, копия вернулась");
      }
    });
  }

  // ----------------------------------------------------------------- rename
  function wireRename() {
    const btn = $("#renameBtn");
    btn?.addEventListener("click", () => {
      const n = prompt("Как тебя зовут?", save.name);
      if (n && n.trim()) {
        save.name = n.trim().slice(0, 24);
        persist();
        flash(`Приятно познакомиться, ${save.name} 🌸`);
        if ($("#profKpis")) document.title = save.name + " — Сакура";
      }
    });
  }

  // ------------------------------------------------------------------- boot
  async function boot() {
    if (!window.SAKURA?.static) return;
    try {
      const r = await fetch("/sakura/data.json", { cache: "no-cache" });
      D = await r.json();
    } catch {
      flash("Не удалось загрузить каталог. Обнови страницу.", true);
      return;
    }
    D.girls.forEach((g) => byId.set(g.id, g));
    load();

    renderPurse();
    // the shared purse button posts to the server; here it just tops up
    $("#purse")?.addEventListener("click", (e) => {
      if (!dailyReady()) return flash("Подарок уже получен, загляни позже 🌸", true);
      claimDaily();
      flash(`+${D.dailyAmount} лепестков 🌸`);
    }, true);

    wireMarket();
    wireRename();
    paintGirl();
    paintCollection();
    paintProfile();
    paintMarket();
    paintCase();

    // remote art can fail on Pages too, so keep the SVG fallback wired up
    document.addEventListener(
      "error",
      (e) => {
        const img = e.target;
        if (img?.dataset?.fallback && img.src !== new URL(img.dataset.fallback, location.href).href) {
          img.src = img.dataset.fallback;
        }
      },
      true,
    );
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
