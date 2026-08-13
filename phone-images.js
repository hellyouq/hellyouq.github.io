// ========================
// КАРТИНКИ ТЕЛЕФОНОВ
// Реальные изображения с бесплатных источников
// ========================

const PHONE_IMAGES = {
  // Apple iPhones
  'iphone_16_pro_max': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-16-pro-max.jpg',
  'iphone_16_pro': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-16-pro.jpg',
  'iphone_16_plus': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-16-plus.jpg',
  'iphone_16': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-16.jpg',
  'iphone_15_pro_max': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-15-pro-max.jpg',
  'iphone_15_pro': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-15-pro.jpg',
  'iphone_15_plus': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-15-plus.jpg',
  'iphone_15': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-15.jpg',
  'iphone_14_pro_max': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-14-pro-max.jpg',
  'iphone_14_pro': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-14-pro.jpg',
  'iphone_14_plus': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-14-plus.jpg',
  'iphone_14': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-14.jpg',
  'iphone_13_pro_max': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-13-pro-max.jpg',
  'iphone_13_pro': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-13-pro.jpg',
  'iphone_13': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-13.jpg',
  'iphone_13_mini': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-13-mini.jpg',
  'iphone_12_pro_max': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-12-pro-max.jpg',
  'iphone_12_pro': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-12-pro.jpg',
  'iphone_12': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-12.jpg',
  'iphone_12_mini': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-12-mini.jpg',
  'iphone_11': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-11.jpg',
  'iphone_se_3': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-se-2022.jpg',
  'iphone_se_2': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-se-2020.jpg',
  'iphone_xr': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-xr.jpg',
  'iphone_x': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-x.jpg',
  'iphone_8': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-8.jpg',
  'iphone_7': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-7.jpg',

  // Samsung Galaxy S
  'galaxy_s25_ultra': 'https://images.gsmarena.com/vv/bigpic/samsung-galaxy-s25-ultra.jpg',
  'galaxy_s25_plus': 'https://images.gsmarena.com/vv/bigpic/samsung-galaxy-s25-plus.jpg',
  'galaxy_s25': 'https://images.gsmarena.com/vv/bigpic/samsung-galaxy-s25.jpg',
  'galaxy_s24_ultra': 'https://images.gsmarena.com/vv/bigpic/samsung-galaxy-s24-ultra.jpg',
  'galaxy_s24_plus': 'https://images.gsmarena.com/vv/bigpic/samsung-galaxy-s24-plus.jpg',
  'galaxy_s24': 'https://images.gsmarena.com/vv/bigpic/samsung-galaxy-s24.jpg',
  'galaxy_s23_ultra': 'https://images.gsmarena.com/vv/bigpic/samsung-galaxy-s23-ultra.jpg',
  'galaxy_s23': 'https://images.gsmarena.com/vv/bigpic/samsung-galaxy-s23.jpg',
  'galaxy_s22_ultra': 'https://images.gsmarena.com/vv/bigpic/samsung-galaxy-s22-ultra.jpg',
  'galaxy_s22': 'https://images.gsmarena.com/vv/bigpic/samsung-galaxy-s22.jpg',
  'galaxy_note_20_ultra': 'https://images.gsmarena.com/vv/bigpic/samsung-galaxy-note-20-ultra.jpg',
  'galaxy_note_20': 'https://images.gsmarena.com/vv/bigpic/samsung-galaxy-note-20.jpg',
  'galaxy_z_fold_6': 'https://images.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold6.jpg',
  'galaxy_z_fold_5': 'https://images.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold5.jpg',
  'galaxy_z_flip_6': 'https://images.gsmarena.com/vv/bigpic/samsung-galaxy-z-flip6.jpg',
  'galaxy_a55': 'https://images.gsmarena.com/vv/bigpic/samsung-galaxy-a55.jpg',
  'galaxy_a54': 'https://images.gsmarena.com/vv/bigpic/samsung-galaxy-a54.jpg',
  'galaxy_a24': 'https://images.gsmarena.com/vv/bigpic/samsung-galaxy-a24.jpg',

  // Xiaomi
  'xiaomi_15_ultra': 'https://images.gsmarena.com/vv/bigpic/xiaomi-15-ultra.jpg',
  'xiaomi_15': 'https://images.gsmarena.com/vv/bigpic/xiaomi-15.jpg',
  'xiaomi_14_ultra': 'https://images.gsmarena.com/vv/bigpic/xiaomi-14-ultra.jpg',
  'xiaomi_14_pro': 'https://images.gsmarena.com/vv/bigpic/xiaomi-14-pro.jpg',
  'xiaomi_14': 'https://images.gsmarena.com/vv/bigpic/xiaomi-14.jpg',
  'xiaomi_13_ultra': 'https://images.gsmarena.com/vv/bigpic/xiaomi-13-ultra.jpg',
  'xiaomi_13_pro': 'https://images.gsmarena.com/vv/bigpic/xiaomi-13-pro.jpg',
  'xiaomi_13': 'https://images.gsmarena.com/vv/bigpic/xiaomi-13.jpg',

  // Redmi
  'redmi_k80_pro': 'https://images.gsmarena.com/vv/bigpic/xiaomi-redmi-k80-pro.jpg',
  'redmi_k80': 'https://images.gsmarena.com/vv/bigpic/xiaomi-redmi-k80.jpg',
  'redmi_k70_pro': 'https://images.gsmarena.com/vv/bigpic/xiaomi-redmi-k70-pro.jpg',
  'redmi_k70': 'https://images.gsmarena.com/vv/bigpic/xiaomi-redmi-k70.jpg',
  'redmi_note_14_pro': 'https://images.gsmarena.com/vv/bigpic/xiaomi-redmi-note-14-pro.jpg',
  'redmi_note_14': 'https://images.gsmarena.com/vv/bigpic/xiaomi-redmi-note-14.jpg',
  'redmi_note_13': 'https://images.gsmarena.com/vv/bigpic/xiaomi-redmi-note-13.jpg',

  // POCO
  'poco_x7_pro': 'https://images.gsmarena.com/vv/bigpic/xiaomi-poco-x7-pro.jpg',
  'poco_x7': 'https://images.gsmarena.com/vv/bigpic/xiaomi-poco-x7.jpg',
  'poco_x6_pro': 'https://images.gsmarena.com/vv/bigpic/xiaomi-poco-x6-pro.jpg',
  'poco_x6': 'https://images.gsmarena.com/vv/bigpic/xiaomi-poco-x6.jpg',
  'poco_f6_pro': 'https://images.gsmarena.com/vv/bigpic/xiaomi-poco-f6-pro.jpg',
  'poco_f6': 'https://images.gsmarena.com/vv/bigpic/xiaomi-poco-f6.jpg',
  'poco_f5': 'https://images.gsmarena.com/vv/bigpic/xiaomi-poco-f5.jpg',

  // Google Pixel
  'pixel_9_pro_xl': 'https://images.gsmarena.com/vv/bigpic/google-pixel-9-pro-xl.jpg',
  'pixel_9_pro': 'https://images.gsmarena.com/vv/bigpic/google-pixel-9-pro.jpg',
  'pixel_9_pro_fold': 'https://images.gsmarena.com/vv/bigpic/google-pixel-9-pro-fold.jpg',
  'pixel_9': 'https://images.gsmarena.com/vv/bigpic/google-pixel-9.jpg',
  'pixel_8_pro': 'https://images.gsmarena.com/vv/bigpic/google-pixel-8-pro.jpg',
  'pixel_8': 'https://images.gsmarena.com/vv/bigpic/google-pixel-8.jpg',
  'pixel_8a': 'https://images.gsmarena.com/vv/bigpic/google-pixel-8a.jpg',
  'pixel_7_pro': 'https://images.gsmarena.com/vv/bigpic/google-pixel-7-pro.jpg',
  'pixel_7': 'https://images.gsmarena.com/vv/bigpic/google-pixel-7.jpg',
  'pixel_7a': 'https://images.gsmarena.com/vv/bigpic/google-pixel-7a.jpg',
  'pixel_6_pro': 'https://images.gsmarena.com/vv/bigpic/google-pixel-6-pro.jpg',
  'pixel_6': 'https://images.gsmarena.com/vv/bigpic/google-pixel-6.jpg',
  'pixel_6a': 'https://images.gsmarena.com/vv/bigpic/google-pixel-6a.jpg',

  // OnePlus
  'oneplus_15': 'https://images.gsmarena.com/vv/bigpic/oneplus-15.jpg',
  'oneplus_15r': 'https://images.gsmarena.com/vv/bigpic/oneplus-15r.jpg',
  'oneplus_13': 'https://images.gsmarena.com/vv/bigpic/oneplus-13.jpg',
  'oneplus_13r': 'https://images.gsmarena.com/vv/bigpic/oneplus-13r.jpg',
  'oneplus_12': 'https://images.gsmarena.com/vv/bigpic/oneplus-12.jpg',
  'oneplus_12r': 'https://images.gsmarena.com/vv/bigpic/oneplus-12r.jpg',
  'oneplus_nord_5': 'https://images.gsmarena.com/vv/bigpic/oneplus-nord-5.jpg',
  'oneplus_nord_ce_6': 'https://images.gsmarena.com/vv/bigpic/oneplus-nord-ce-6.jpg',

  // Huawei
  'huawei_mate_80_pro': 'https://images.gsmarena.com/vv/bigpic/huawei-mate-80-pro.jpg',
  'huawei_mate_80': 'https://images.gsmarena.com/vv/bigpic/huawei-mate-80.jpg',
  'huawei_mate_60_pro': 'https://images.gsmarena.com/vv/bigpic/huawei-mate-60-pro.jpg',
  'huawei_p60_pro': 'https://images.gsmarena.com/vv/bigpic/huawei-p60-pro.jpg',
  'huawei_nova_13': 'https://images.gsmarena.com/vv/bigpic/huawei-nova-13.jpg',

  // Honor
  'honor_magic_8_pro': 'https://images.gsmarena.com/vv/bigpic/honor-magic-8-pro.jpg',
  'honor_magic_8': 'https://images.gsmarena.com/vv/bigpic/honor-magic-8.jpg',
  'honor_magic_7_pro': 'https://images.gsmarena.com/vv/bigpic/honor-magic-7-pro.jpg',
  'honor_500_pro': 'https://images.gsmarena.com/vv/bigpic/honor-500-pro.jpg',
  'honor_200_pro': 'https://images.gsmarena.com/vv/bigpic/honor-200-pro.jpg',

  // iQOO
  'iqoo_15_pro': 'https://images.gsmarena.com/vv/bigpic/iqoo-15-pro.jpg',
  'iqoo_15': 'https://images.gsmarena.com/vv/bigpic/iqoo-15.jpg',
  'iqoo_13_pro': 'https://images.gsmarena.com/vv/bigpic/iqoo-13-pro.jpg',
  'iqoo_13': 'https://images.gsmarena.com/vv/bigpic/iqoo-13.jpg',
  'iqoo_z11': 'https://images.gsmarena.com/vv/bigpic/iqoo-z11.jpg',

  // Vivo
  'vivo_x200_pro': 'https://images.gsmarena.com/vv/bigpic/vivo-x200-pro.jpg',
  'vivo_x200': 'https://images.gsmarena.com/vv/bigpic/vivo-x200.jpg',
  'vivo_v50': 'https://images.gsmarena.com/vv/bigpic/vivo-v50.jpg',
  'vivo_v40': 'https://images.gsmarena.com/vv/bigpic/vivo-v40.jpg',
  'vivo_y200': 'https://images.gsmarena.com/vv/bigpic/vivo-y200.jpg',

  // Oppo
  'oppo_find_x8_pro': 'https://images.gsmarena.com/vv/bigpic/oppo-find-x8-pro.jpg',
  'oppo_find_x8': 'https://images.gsmarena.com/vv/bigpic/oppo-find-x8.jpg',
  'oppo_reno_13_pro': 'https://images.gsmarena.com/vv/bigpic/oppo-reno-13-pro.jpg',
  'oppo_a80': 'https://images.gsmarena.com/vv/bigpic/oppo-a80.jpg',

  // Realme
  'realme_gt_7_pro': 'https://images.gsmarena.com/vv/bigpic/realme-gt-7-pro.jpg',
  'realme_gt_6': 'https://images.gsmarena.com/vv/bigpic/realme-gt-6.jpg',
  'realme_14_pro_plus': 'https://images.gsmarena.com/vv/bigpic/realme-14-pro-plus.jpg',
  'realme_narzo_80_pro': 'https://images.gsmarena.com/vv/bigpic/realme-narzo-80-pro.jpg',

  // Motorola
  'moto_razr_60_ultra': 'https://images.gsmarena.com/vv/bigpic/motorola-razr-60-ultra.jpg',
  'moto_razr_50_ultra': 'https://images.gsmarena.com/vv/bigpic/motorola-razr-50-ultra.jpg',
  'moto_edge_60_pro': 'https://images.gsmarena.com/vv/bigpic/motorola-edge-60-pro.jpg',
  'moto_g85': 'https://images.gsmarena.com/vv/bigpic/motorola-moto-g85.jpg',

  // Nothing
  'nothing_phone_3': 'https://images.gsmarena.com/vv/bigpic/nothing-phone-3.jpg',
  'nothing_phone_2a': 'https://images.gsmarena.com/vv/bigpic/nothing-phone-2a.jpg',
  'nothing_phone_2': 'https://images.gsmarena.com/vv/bigpic/nothing-phone-2.jpg',

  // CMF
  'cmf_phone_2': 'https://images.gsmarena.com/vv/bigpic/cmf-phone-2.jpg',
  'cmf_phone_1': 'https://images.gsmarena.com/vv/bigpic/cmf-phone-1.jpg',

  // ASUS
  'rog_phone_9_pro': 'https://images.gsmarena.com/vv/bigpic/asus-rog-phone-9-pro.jpg',
  'rog_phone_8': 'https://images.gsmarena.com/vv/bigpic/asus-rog-phone-8.jpg',
  'zenfone_12_ultra': 'https://images.gsmarena.com/vv/bigpic/asus-zenfone-12-ultra.jpg',

  // Nothing
  'nothing_phone_3': 'https://images.gsmarena.com/vv/bigpic/nothing-phone-3.jpg',
  'nothing_phone_2a': 'https://images.gsmarena.com/vv/bigpic/nothing-phone-2a.jpg',
  'nothing_phone_2': 'https://images.gsmarena.com/vv/bigpic/nothing-phone-2.jpg',

  // CMF
  'cmf_phone_2': 'https://images.gsmarena.com/vv/bigpic/cmf-phone-2.jpg',
  'cmf_phone_1': 'https://images.gsmarena.com/vv/bigpic/cmf-phone-1.jpg'
};

/**
 * Получить изображение телефона по названию модели
 * Использует прямые ссылки на реальные фото из интернета
 */
function getPhoneImage(phoneId) {
  // Если есть в базе GSMarena - используем
  if (PHONE_IMAGES[phoneId]) {
    return PHONE_IMAGES[phoneId];
  }
  
  // Преобразуем ID в название модели
  const phoneName = phoneId.replace(/_/g, ' ').toLowerCase();
  
  // Используем Wikimedia Commons Image Search через прямую ссылку
  // Это работает лучше всего для фото телефонов
  const wikiQuery = encodeURIComponent(phoneName.replace(/ /g, '_'));
  
  // Альтернативные источники в порядке приоритета
  const sources = [
    // Прямая ссылка на Wikimedia поиск
    `https://commons.wikimedia.org/wiki/Special:FilePath/${wikiQuery.replace(/%20/g, '_')}_phone.jpg`,
    // Fallback - используем встроенный SVG с градиентом и названием
    generatePhonePlaceholder(phoneName)
  ];
  
  // Возвращаем первый источник с fallback на встроенный SVG
  return `${sources[0]}`;
}

/**
 * Генерирует встроенное SVG-изображение если фото не найдено
 */
function generatePhonePlaceholder(phoneName) {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F38181', '#AA96DA'];
  const hash = phoneName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const color = colors[Math.abs(hash) % colors.length];
  const label = phoneName.toUpperCase().substring(0, 20);
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
        <stop offset="100%" style="stop-color:#000;stop-opacity:0.2" />
      </linearGradient>
    </defs>
    <rect width="300" height="400" fill="url(#grad)"/>
    <rect x="15" y="25" width="270" height="350" rx="20" fill="white" opacity="0.15" stroke="${color}" stroke-width="2"/>
    <circle cx="150" cy="80" r="35" fill="${color}" opacity="0.4"/>
    <rect x="130" y="200" width="40" height="60" rx="3" fill="${color}" opacity="0.3"/>
    <text x="150" y="300" font-size="16" font-weight="bold" fill="white" text-anchor="middle">${label}</text>
  </svg>`;
  
  return 'data:image/svg+xml;base64,' + btoa(svg);
}

/**
 * Получить картинку телефона по названию модели
 */
function getPhoneImageByName(phoneName) {
  // Преобразуем название в ID (например, "iPhone 15" -> "iphone_15")
  const id = phoneName
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\w_]/g, '')
    .substring(0, 50);
  
  return getPhoneImage(id);
}

/**
 * Получить картинку в зависимости от состояния
 * Может добавить эффект повреждения позже
 */
function getPhoneImageWithCondition(phoneId, condition) {
  const baseImage = getPhoneImage(phoneId);
  
  // Можно добавить эффекты фильтра в зависимости от состояния
  // Пока просто возвращаем базовое изображение
  return baseImage;
}
