// ========================
// КАРТИНКИ ТЕЛЕФОНОВ
// Реальные изображения с бесплатных источников
// ========================

const PHONE_IMAGES = {
  // Apple iPhones
  'iphone_16_pro_max': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-16-pro-max.jpg',
  'iphone_16_pro': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-16-pro.jpg',
  'iphone_16': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-16.jpg',
  'iphone_15_pro_max': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-15-pro-max.jpg',
  'iphone_15_pro': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-15-pro.jpg',
  'iphone_15': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-15.jpg',
  'iphone_14_pro': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-14-pro.jpg',
  'iphone_14': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-14.jpg',
  'iphone_13': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-13.jpg',
  'iphone_12': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-12.jpg',
  'iphone_11': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-11.jpg',
  'iphone_xr': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-xr.jpg',
  'iphone_x': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-x.jpg',
  'iphone_8': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-8.jpg',
  'iphone_7': 'https://images.gsmarena.com/vv/bigpic/apple-iphone-7.jpg',

  // Samsung Galaxy S
  'galaxy_s25_ultra': 'https://images.gsmarena.com/vv/bigpic/samsung-galaxy-s25-ultra.jpg',
  'galaxy_s25': 'https://images.gsmarena.com/vv/bigpic/samsung-galaxy-s25.jpg',
  'galaxy_s24_ultra': 'https://images.gsmarena.com/vv/bigpic/samsung-galaxy-s24-ultra.jpg',
  'galaxy_s24': 'https://images.gsmarena.com/vv/bigpic/samsung-galaxy-s24.jpg',
  'galaxy_s23_ultra': 'https://images.gsmarena.com/vv/bigpic/samsung-galaxy-s23-ultra.jpg',
  'galaxy_s23': 'https://images.gsmarena.com/vv/bigpic/samsung-galaxy-s23.jpg',

  // Samsung Galaxy A
  'galaxy_a55': 'https://images.gsmarena.com/vv/bigpic/samsung-galaxy-a55.jpg',
  'galaxy_a54': 'https://images.gsmarena.com/vv/bigpic/samsung-galaxy-a54.jpg',
  'galaxy_a24': 'https://images.gsmarena.com/vv/bigpic/samsung-galaxy-a24.jpg',

  // Samsung Galaxy Z
  'galaxy_z_fold_6': 'https://images.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold6.jpg',
  'galaxy_z_fold_5': 'https://images.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold5.jpg',
  'galaxy_z_flip_6': 'https://images.gsmarena.com/vv/bigpic/samsung-galaxy-z-flip6.jpg',

  // Xiaomi
  'xiaomi_15_ultra': 'https://images.gsmarena.com/vv/bigpic/xiaomi-15-ultra.jpg',
  'xiaomi_15': 'https://images.gsmarena.com/vv/bigpic/xiaomi-15.jpg',
  'xiaomi_14_ultra': 'https://images.gsmarena.com/vv/bigpic/xiaomi-14-ultra.jpg',
  'xiaomi_14': 'https://images.gsmarena.com/vv/bigpic/xiaomi-14.jpg',
  'xiaomi_13': 'https://images.gsmarena.com/vv/bigpic/xiaomi-13.jpg',

  // Redmi
  'redmi_k80_pro': 'https://images.gsmarena.com/vv/bigpic/xiaomi-redmi-k80-pro.jpg',
  'redmi_k80': 'https://images.gsmarena.com/vv/bigpic/xiaomi-redmi-k80.jpg',
  'redmi_k70_pro': 'https://images.gsmarena.com/vv/bigpic/xiaomi-redmi-k70-pro.jpg',
  'redmi_note_14_pro': 'https://images.gsmarena.com/vv/bigpic/xiaomi-redmi-note-14-pro.jpg',
  'redmi_note_14': 'https://images.gsmarena.com/vv/bigpic/xiaomi-redmi-note-14.jpg',

  // POCO
  'poco_x7_pro': 'https://images.gsmarena.com/vv/bigpic/xiaomi-poco-x7-pro.jpg',
  'poco_x7': 'https://images.gsmarena.com/vv/bigpic/xiaomi-poco-x7.jpg',
  'poco_x6_pro': 'https://images.gsmarena.com/vv/bigpic/xiaomi-poco-x6-pro.jpg',
  'poco_f6_pro': 'https://images.gsmarena.com/vv/bigpic/xiaomi-poco-f6-pro.jpg',
  'poco_f6': 'https://images.gsmarena.com/vv/bigpic/xiaomi-poco-f6.jpg',

  // Google Pixel
  'pixel_9_pro_xl': 'https://images.gsmarena.com/vv/bigpic/google-pixel-9-pro-xl.jpg',
  'pixel_9_pro': 'https://images.gsmarena.com/vv/bigpic/google-pixel-9-pro.jpg',
  'pixel_9': 'https://images.gsmarena.com/vv/bigpic/google-pixel-9.jpg',
  'pixel_8_pro': 'https://images.gsmarena.com/vv/bigpic/google-pixel-8-pro.jpg',
  'pixel_8': 'https://images.gsmarena.com/vv/bigpic/google-pixel-8.jpg',
  'pixel_7_pro': 'https://images.gsmarena.com/vv/bigpic/google-pixel-7-pro.jpg',
  'pixel_7': 'https://images.gsmarena.com/vv/bigpic/google-pixel-7.jpg',

  // OnePlus
  'oneplus_15': 'https://images.gsmarena.com/vv/bigpic/oneplus-15.jpg',
  'oneplus_15r': 'https://images.gsmarena.com/vv/bigpic/oneplus-15r.jpg',
  'oneplus_13': 'https://images.gsmarena.com/vv/bigpic/oneplus-13.jpg',
  'oneplus_13r': 'https://images.gsmarena.com/vv/bigpic/oneplus-13r.jpg',
  'oneplus_12': 'https://images.gsmarena.com/vv/bigpic/oneplus-12.jpg',

  // Huawei
  'huawei_mate_80_pro': 'https://images.gsmarena.com/vv/bigpic/huawei-mate-80-pro.jpg',
  'huawei_mate_80': 'https://images.gsmarena.com/vv/bigpic/huawei-mate-80.jpg',
  'huawei_mate_60_pro': 'https://images.gsmarena.com/vv/bigpic/huawei-mate-60-pro.jpg',
  'huawei_p60_pro': 'https://images.gsmarena.com/vv/bigpic/huawei-p60-pro.jpg',

  // Honor
  'honor_magic_8_pro': 'https://images.gsmarena.com/vv/bigpic/honor-magic-8-pro.jpg',
  'honor_magic_8': 'https://images.gsmarena.com/vv/bigpic/honor-magic-8.jpg',
  'honor_magic_7_pro': 'https://images.gsmarena.com/vv/bigpic/honor-magic-7-pro.jpg',
  'honor_500_pro': 'https://images.gsmarena.com/vv/bigpic/honor-500-pro.jpg',

  // iQOO
  'iqoo_15_pro': 'https://images.gsmarena.com/vv/bigpic/iqoo-15-pro.jpg',
  'iqoo_15': 'https://images.gsmarena.com/vv/bigpic/iqoo-15.jpg',
  'iqoo_13_pro': 'https://images.gsmarena.com/vv/bigpic/iqoo-13-pro.jpg',
  'iqoo_13': 'https://images.gsmarena.com/vv/bigpic/iqoo-13.jpg',

  // Vivo
  'vivo_x200_pro': 'https://images.gsmarena.com/vv/bigpic/vivo-x200-pro.jpg',
  'vivo_x200': 'https://images.gsmarena.com/vv/bigpic/vivo-x200.jpg',
  'vivo_v50': 'https://images.gsmarena.com/vv/bigpic/vivo-v50.jpg',
  'vivo_v40': 'https://images.gsmarena.com/vv/bigpic/vivo-v40.jpg',

  // Oppo
  'oppo_find_x8_pro': 'https://images.gsmarena.com/vv/bigpic/oppo-find-x8-pro.jpg',
  'oppo_find_x8': 'https://images.gsmarena.com/vv/bigpic/oppo-find-x8.jpg',
  'oppo_reno_13_pro': 'https://images.gsmarena.com/vv/bigpic/oppo-reno-13-pro.jpg',

  // Realme
  'realme_gt_7_pro': 'https://images.gsmarena.com/vv/bigpic/realme-gt-7-pro.jpg',
  'realme_gt_6': 'https://images.gsmarena.com/vv/bigpic/realme-gt-6.jpg',
  'realme_14_pro_plus': 'https://images.gsmarena.com/vv/bigpic/realme-14-pro-plus.jpg',

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

  // Sony
  'xperia_1_vi': 'https://images.gsmarena.com/vv/bigpic/sony-xperia-1-vi.jpg',
  'xperia_5_vi': 'https://images.gsmarena.com/vv/bigpic/sony-xperia-5-vi.jpg',

  // Meizu
  'meizu_22': 'https://images.gsmarena.com/vv/bigpic/meizu-22.jpg',
  'meizu_21': 'https://images.gsmarena.com/vv/bigpic/meizu-21.jpg',

  // Другие
  'nokia_g100': 'https://images.gsmarena.com/vv/bigpic/nokia-g100.jpg',
  'ulefone_armor_24_ultra': 'https://images.gsmarena.com/vv/bigpic/ulefone-armor-24-ultra.jpg',
  'doogee_s100_pro': 'https://images.gsmarena.com/vv/bigpic/doogee-s100-pro.jpg',
  'blackview_bv9300': 'https://images.gsmarena.com/vv/bigpic/blackview-bv9300.jpg',
};

/**
 * Получить изображение телефона по ID
 * Если нет реальной картинки, используется placeholder
 */
function getPhoneImage(phoneId) {
  const image = PHONE_IMAGES[phoneId];
  
  if (image) {
    return image;
  }
  
  // Fallback на placeholder с названием
  return `https://via.placeholder.com/300x400/0f0f1e/00d4ff?text=${encodeURIComponent(phoneId.replace(/_/g, ' '))}`;
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
