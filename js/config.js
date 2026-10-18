/* ============================================================================
 *  config.js — настройки приложения, модели, ключи и лимиты
 * ==========================================================================*/
(function (global) {
  'use strict';
  const APP = (global.APP = global.APP || {});
  const secret = APP.SECRET || {};

  let storedKey = '';
  try {
    if (typeof localStorage !== 'undefined') {
      storedKey = localStorage.getItem('liquidglass.key') || '';
    }
  } catch (e) {}

  APP.CONFIG = {
    // Gemini API ключ (из localStorage, secret.js или дефолтный)
    API_KEY: storedKey || secret.API_KEY || 'DEMO_KEY',

    // Прокси (если запросы идут через Cloudflare Worker / свой сервер)
    PROXY_URL: secret.PROXY_URL || '',

    // Базовый URL API Gemini
    API_BASE: 'https://generativelanguage.googleapis.com/v1beta',

    // Список моделей (перебираются по очереди при 429 / 5xx / 404 / таймаутах)
    MODELS: [
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash',
      'gemini-3.5-flash',
      'gemini-flash-latest'
    ],

    // Параметры генерации
    TEMPERATURE: 1.2,
    TOP_P: 0.95,
    MAX_OUTPUT_TOKENS: 20000,
    THINKING_LEVEL: 'low',
    THINKING_BUDGET: null,
    TIMEOUT_MS: 90000,

    // Язык генерации
    LANG: 'ru',

    // Ключи хранилища localStorage
    PREFS_KEY: 'liquidglass.prefs',
    STORE_KEY: 'liquidglass.history',
    HI_KEY: 'liquidglass.records',

    // Лимиты
    HISTORY_LIMIT: 5,
    SHARE_LIMIT: 2000
  };
})(typeof window !== 'undefined' ? window : globalThis);
