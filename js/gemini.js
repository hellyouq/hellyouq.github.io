/* ============================================================================
 *  gemini.js — клиент Gemini: стриминг ответа (чтобы показывать живой прогресс),
 *  перебор моделей при 429/5xx, разбор и починка JSON.
 * ==========================================================================*/
(function (global) {
  'use strict';
  const APP = (global.APP = global.APP || {});
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* --------------------------- разбор ответа ------------------------------- */

  function extractJSON(text) {
    if (typeof text !== 'string') return null;
    let s = text.trim();
    // Модель иногда оборачивает JSON в ```json ... ```
    s = s.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
    // Срезаем всё до первой { и после последней }
    const a = s.indexOf('{');
    const b = s.lastIndexOf('}');
    if (a === -1 || b === -1 || b <= a) return null;
    s = s.slice(a, b + 1);
    const attempts = [
      s,
      s.replace(/,\s*([}\]])/g, '$1'),                                  // висячие запятые
      s.replace(/[\u201c\u201d]/g, '"').replace(/[\u2018\u2019]/g, "'")  // «умные» кавычки
    ];
    for (const cand of attempts) {
      try { return JSON.parse(cand); } catch (e) { /* пробуем дальше */ }
    }
    return null;
  }

  /* --------------------------- оценка прогресса ---------------------------- */
  /* Лёгкие модели пишут более компактную спеку, тяжёлые — длинную: чтобы полоска
     прогресса не замирала на середине, оценка зависит от модели. */

  const EST_TOTAL = 6800;   // обычные модели
  const EST_LITE = 3400;    // *-lite

  function estFor(model) { return /lite/.test(String(model)) ? EST_LITE : EST_TOTAL; }

  const STAGE_STOPS = [0.038, 0.132, 0.279, 0.470, 0.690, 0.910];
  const STAGE_NAMES = [
    'Выбираю тему этого визита',
    'Подбираю палитру и стекло',
    'Придумываю название и тексты',
    'Расставляю разделы и игры',
    'Собираю мини-игры из каталога',
    'Пишу игру-сюрприз',
    'Полирую блики и размытие'
  ];

  function stageFor(chars, total) {
    const t = total || EST_TOTAL;
    let i = 0;
    while (i < STAGE_STOPS.length && chars >= STAGE_STOPS[i] * t) i++;
    return STAGE_NAMES[i];
  }

  /* ------------------------------- запрос ---------------------------------- */

  function endpoint(model, stream) {
    const C = APP.CONFIG;
    if (C.PROXY_URL) {
      // Через прокси модель едет в адресе: тело остаётся ровно тем же, что и у Google.
      return C.PROXY_URL.replace(/\/$/, '') + '/generate?model=' + encodeURIComponent(model);
    }
    const path = '/models/' + model + ':' + (stream ? 'streamGenerateContent?alt=sse' : 'generateContent');
    return C.API_BASE + path;
  }

  /* thinkingConfig зависит от семейства: 2.5 понимает thinkingBudget,
     3.x и новее — thinkingLevel. Оба ключа сразу API отклоняет (400), поэтому
     отправляем ровно один. */
  function thinkingConfig(model) {
    const C = APP.CONFIG;
    const cfg = {};
    if (/^gemini-2\.5/.test(model)) {
      if (typeof C.THINKING_BUDGET === 'number') cfg.thinkingBudget = C.THINKING_BUDGET;
      else if (C.THINKING_LEVEL) cfg.thinkingBudget = C.THINKING_LEVEL === 'low' ? 0 : -1;
    } else if (C.THINKING_LEVEL) {
      cfg.thinkingLevel = C.THINKING_LEVEL;
    }
    return Object.keys(cfg).length ? cfg : null;
  }

  function requestBody(system, user, model) {
    const C = APP.CONFIG;
    const body = {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: {
        temperature: C.TEMPERATURE,
        topP: C.TOP_P,
        maxOutputTokens: C.MAX_OUTPUT_TOKENS,
        responseMimeType: 'application/json'
      }
    };
    const tc = thinkingConfig(model);
    if (tc) body.generationConfig.thinkingConfig = tc;
    return body;
  }

  function headers() {
    const C = APP.CONFIG;
    const h = { 'content-type': 'application/json' };
    if (!C.PROXY_URL) h['x-goog-api-key'] = C.API_KEY;
    return h;
  }

  async function readError(res) {
    let detail = '';
    try {
      const j = await res.json();
      detail = (j && j.error && (j.error.message || j.error.status)) || JSON.stringify(j).slice(0, 200);
    } catch (e) { /* тело не JSON */ }
    return res.status + (detail ? ' · ' + String(detail).slice(0, 180) : '');
  }

  /**
   * Стриминговый запрос к одной модели.
   * @returns {Promise<{text:string}>}
   */
  async function streamModel(model, system, user, hooks, signal) {
    const ac = new AbortController();
    const onAbort = () => ac.abort();
    if (signal) signal.addEventListener('abort', onAbort, { once: true });
    const timer = setTimeout(() => ac.abort(), APP.CONFIG.TIMEOUT_MS);

    try {
      const res = await fetch(endpoint(model, true), {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(requestBody(system, user, model)),
        signal: ac.signal
      });
      if (!res.ok) throw new Error(await readError(res));
      if (!res.body || !res.body.getReader) {           // браузер без стримов
        const j = await res.json();
        const t = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts || [])
          .map((p) => p.text || '').join('');
        return { text: t };
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let text = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed[0] === ':') continue;
          if (trimmed.indexOf('data:') !== 0) continue;
          const payload = trimmed.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;
          try {
            const chunk = JSON.parse(payload);
            const cand = chunk.candidates && chunk.candidates[0];
            const parts = (cand && cand.content && cand.content.parts) || [];
            for (const p of parts) if (typeof p.text === 'string') text += p.text;
          } catch (e) { /* обрывок чанка — пропускаем */ }
        }
        if (hooks && hooks.onProgress) hooks.onProgress(text.length, text);
      }
      return { text };
    } finally {
      clearTimeout(timer);
      if (signal) signal.removeEventListener('abort', onAbort);
    }
  }

  /**
   * Главная функция: собрать сайт у Gemini.
   * @param {{vibe?:string, lang?:string, seed?:string, signal?:AbortSignal,
   *          onStage?:(s:string)=>void, onProgress?:(p:number, chars:number)=>void,
   *          onTitle?:(t:string)=>void, onAttempt?:(i:number, model:string)=>void}} o
   * @returns {Promise<{spec:Object, raw:Object, model:string, ms:number, chars:number}>}
   */
  async function generate(o) {
    o = o || {};
    const C = APP.CONFIG;
    const seed = o.seed || String(Date.now()) + Math.random().toString(36).slice(2, 7);
    const built = APP.PROMPT.build({ vibe: o.vibe, lang: o.lang || C.LANG, seed });
    const errors = [];
    const t0 = Date.now();

    for (let i = 0; i < C.MODELS.length; i++) {
      const model = C.MODELS[i];
      if (o.signal && o.signal.aborted) throw Object.assign(new Error('cancelled'), { cancelled: true });
      if (o.onAttempt) o.onAttempt(i, model);
      try {
        let lastChars = 0;
        const est = estFor(model);
        const { text } = await streamModel(model, built.system, built.user, {
          onProgress: (chars, partial) => {
            if (o.onProgress) o.onProgress(Math.min(0.94, chars / est), chars);
            if (chars !== lastChars) {
              lastChars = chars;
              if (o.onStage) o.onStage(stageFor(chars, est));
              if (o.onTitle && !o._sentTitle) {
                const m = /"title"\s*:\s*"([^"\\]{2,42})"/.exec(partial);
                if (m) { o._sentTitle = true; o.onTitle(m[1]); }
              }
            }
          }
        }, o.signal);

        const raw = extractJSON(text);
        if (!raw) throw new Error('ответ не похож на JSON (' + text.length + ' симв.)');
        const spec = APP.SPEC.normalize(raw, { model, seed, vibe: o.vibe || '' });
        if (o.onProgress) o.onProgress(1, text.length);
        return { spec, raw, model, ms: Date.now() - t0, chars: text.length };
      } catch (e) {
        if (e && (e.cancelled || (e.name === 'AbortError' && o.signal && o.signal.aborted))) {
          throw Object.assign(new Error('cancelled'), { cancelled: true });
        }
        errors.push(model + ' → ' + (e.message || e.name));
        if (o.onStage) o.onStage('Модель ' + model + ' не ответила, пробую следующую');
        await sleep(350 + i * 250);
      }
    }

    const err = new Error('Не получилось собрать сайт: ' + errors.join(' | '));
    err.tried = errors;
    throw err;
  }

  APP.GEMINI = { generate, extractJSON, streamModel, stageFor, estFor, requestBody, thinkingConfig };
})(typeof window !== 'undefined' ? window : globalThis);
