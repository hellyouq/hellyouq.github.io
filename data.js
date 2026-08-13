// ========================
// ОГРОМНАЯ БАЗА ДАННЫХ ТЕЛЕФОНОВ "Телефонный барон"
// Реальные цены, состояния, поломки, комплектация
// ========================

// Система состояний телефонов
const CONDITION_TYPES = {
  PERFECT: 'perfect',           // Идеальное состояние
  GOOD: 'good',                 // Хорошее, незначительные царапины
  FAIR: 'fair',                 // Приемлемое, видимые повреждения
  POOR: 'poor',                 // Плохое, серьёзные повреждения
  CRITICAL: 'critical'          // Критическое, едва работает
};

// Коэффициенты состояния для расчёта цены
const CONDITION_MULTIPLIERS = {
  'perfect': 0.95,
  'good': 0.80,
  'fair': 0.55,
  'poor': 0.30,
  'critical': 0.10
};

// Типы повреждений
const DAMAGES = [
  { type: 'screen', name: 'Разбит экран', probability: 0.35, partName: 'screen', seriousness: 'high' },
  { type: 'battery', name: 'Быстро разряжается', probability: 0.25, partName: 'battery', seriousness: 'medium' },
  { type: 'button', name: 'Не работают кнопки', probability: 0.15, partName: 'button', seriousness: 'low' },
  { type: 'back', name: 'Сколы на корпусе', probability: 0.20, partName: 'backGlass', seriousness: 'low' },
  { type: 'chargePort', name: 'Не работает зарядка', probability: 0.10, partName: 'chargePort', seriousness: 'high' },
  { type: 'camera', name: 'Повреждена камера', probability: 0.12, partName: 'camera', seriousness: 'medium' },
  { type: 'motherboard', name: 'Проблема с материнкой', probability: 0.05, partName: 'motherboard', seriousness: 'critical' },
  { type: 'speaker', name: 'Нет звука', probability: 0.08, partName: 'speaker', seriousness: 'medium' }
];

// Комплектация
const ACCESSORIES = [
  { id: 'box', name: 'Оригинальная коробка', priceBonus: 0.05, probability: 0.50 },
  { id: 'charger', name: 'Зарядное устройство', priceBonus: 0.08, probability: 0.40 },
  { id: 'cable', name: 'USB кабель', priceBonus: 0.02, probability: 0.60 },
  { id: 'headphones', name: 'Наушники', priceBonus: 0.03, probability: 0.20 }
];

// ========================
// ОГРОМНАЯ БАЗА ТЕЛЕФОНОВ
// ========================

const PHONES_DATABASE = {
  Apple: [
    { id: 'iphone_16_pro_max', name: 'iPhone 16 Pro Max', year: 2024, basePrice: 150000 },
    { id: 'iphone_16_pro', name: 'iPhone 16 Pro', year: 2024, basePrice: 120000 },
    { id: 'iphone_16_plus', name: 'iPhone 16 Plus', year: 2024, basePrice: 95000 },
    { id: 'iphone_16', name: 'iPhone 16', year: 2024, basePrice: 85000 },
    { id: 'iphone_15_pro_max', name: 'iPhone 15 Pro Max', year: 2023, basePrice: 120000 },
    { id: 'iphone_15_pro', name: 'iPhone 15 Pro', year: 2023, basePrice: 95000 },
    { id: 'iphone_15_plus', name: 'iPhone 15 Plus', year: 2023, basePrice: 85000 },
    { id: 'iphone_15', name: 'iPhone 15', year: 2023, basePrice: 80000 },
    { id: 'iphone_14_pro_max', name: 'iPhone 14 Pro Max', year: 2022, basePrice: 95000 },
    { id: 'iphone_14_pro', name: 'iPhone 14 Pro', year: 2022, basePrice: 75000 },
    { id: 'iphone_14_plus', name: 'iPhone 14 Plus', year: 2022, basePrice: 70000 },
    { id: 'iphone_14', name: 'iPhone 14', year: 2022, basePrice: 65000 },
    { id: 'iphone_13_pro_max', name: 'iPhone 13 Pro Max', year: 2021, basePrice: 75000 },
    { id: 'iphone_13_pro', name: 'iPhone 13 Pro', year: 2021, basePrice: 60000 },
    { id: 'iphone_13', name: 'iPhone 13', year: 2021, basePrice: 55000 },
    { id: 'iphone_13_mini', name: 'iPhone 13 mini', year: 2021, basePrice: 45000 },
    { id: 'iphone_12', name: 'iPhone 12', year: 2020, basePrice: 40000 },
    { id: 'iphone_12_mini', name: 'iPhone 12 mini', year: 2020, basePrice: 35000 },
    { id: 'iphone_11', name: 'iPhone 11', year: 2019, basePrice: 30000 },
    { id: 'iphone_se_3', name: 'iPhone SE (3rd gen)', year: 2022, basePrice: 25000 },
    { id: 'iphone_se_2', name: 'iPhone SE (2nd gen)', year: 2020, basePrice: 15000 },
    { id: 'iphone_xr', name: 'iPhone XR', year: 2018, basePrice: 20000 },
    { id: 'iphone_x', name: 'iPhone X', year: 2017, basePrice: 15000 },
    { id: 'iphone_8', name: 'iPhone 8', year: 2017, basePrice: 10000 },
    { id: 'iphone_7', name: 'iPhone 7', year: 2016, basePrice: 8000 }
  ],
  
  Samsung: [
    { id: 'galaxy_s25_ultra', name: 'Galaxy S25 Ultra', year: 2025, basePrice: 140000 },
    { id: 'galaxy_s25_plus', name: 'Galaxy S25+', year: 2025, basePrice: 95000 },
    { id: 'galaxy_s25', name: 'Galaxy S25', year: 2025, basePrice: 85000 },
    { id: 'galaxy_s24_ultra', name: 'Galaxy S24 Ultra', year: 2024, basePrice: 120000 },
    { id: 'galaxy_s24_plus', name: 'Galaxy S24+', year: 2024, basePrice: 85000 },
    { id: 'galaxy_s24', name: 'Galaxy S24', year: 2024, basePrice: 75000 },
    { id: 'galaxy_s23_ultra', name: 'Galaxy S23 Ultra', year: 2023, basePrice: 100000 },
    { id: 'galaxy_s23', name: 'Galaxy S23', year: 2023, basePrice: 60000 },
    { id: 'galaxy_s22_ultra', name: 'Galaxy S22 Ultra', year: 2022, basePrice: 80000 },
    { id: 'galaxy_s22', name: 'Galaxy S22', year: 2022, basePrice: 50000 },
    { id: 'galaxy_note_20_ultra', name: 'Galaxy Note 20 Ultra', year: 2020, basePrice: 50000 },
    { id: 'galaxy_note_20', name: 'Galaxy Note 20', year: 2020, basePrice: 40000 },
    { id: 'galaxy_z_fold_6', name: 'Galaxy Z Fold 6', year: 2024, basePrice: 200000 },
    { id: 'galaxy_z_fold_5', name: 'Galaxy Z Fold 5', year: 2023, basePrice: 170000 },
    { id: 'galaxy_z_flip_6', name: 'Galaxy Z Flip 6', year: 2024, basePrice: 130000 },
    { id: 'galaxy_a55', name: 'Galaxy A55', year: 2024, basePrice: 35000 },
    { id: 'galaxy_a54', name: 'Galaxy A54', year: 2023, basePrice: 30000 },
    { id: 'galaxy_a24', name: 'Galaxy A24', year: 2024, basePrice: 20000 }
  ],

  Xiaomi: [
    { id: 'xiaomi_15_ultra', name: 'Xiaomi 15 Ultra', year: 2024, basePrice: 100000 },
    { id: 'xiaomi_15', name: 'Xiaomi 15', year: 2024, basePrice: 75000 },
    { id: 'xiaomi_14_ultra', name: 'Xiaomi 14 Ultra', year: 2023, basePrice: 95000 },
    { id: 'xiaomi_14_pro', name: 'Xiaomi 14 Pro', year: 2023, basePrice: 70000 },
    { id: 'xiaomi_14', name: 'Xiaomi 14', year: 2023, basePrice: 65000 },
    { id: 'xiaomi_13_ultra', name: 'Xiaomi 13 Ultra', year: 2022, basePrice: 80000 },
    { id: 'xiaomi_13_pro', name: 'Xiaomi 13 Pro', year: 2022, basePrice: 55000 },
    { id: 'xiaomi_13', name: 'Xiaomi 13', year: 2022, basePrice: 45000 }
  ],

  Redmi: [
    { id: 'redmi_k80_pro', name: 'Redmi K80 Pro', year: 2024, basePrice: 60000 },
    { id: 'redmi_k80', name: 'Redmi K80', year: 2024, basePrice: 45000 },
    { id: 'redmi_k70_pro', name: 'Redmi K70 Pro', year: 2023, basePrice: 50000 },
    { id: 'redmi_k70', name: 'Redmi K70', year: 2023, basePrice: 35000 },
    { id: 'redmi_note_14_pro', name: 'Redmi Note 14 Pro', year: 2024, basePrice: 30000 },
    { id: 'redmi_note_14', name: 'Redmi Note 14', year: 2024, basePrice: 25000 },
    { id: 'redmi_note_13', name: 'Redmi Note 13', year: 2023, basePrice: 20000 }
  ],

  POCO: [
    { id: 'poco_x7_pro', name: 'POCO X7 Pro', year: 2024, basePrice: 40000 },
    { id: 'poco_x7', name: 'POCO X7', year: 2024, basePrice: 35000 },
    { id: 'poco_x6_pro', name: 'POCO X6 Pro', year: 2023, basePrice: 35000 },
    { id: 'poco_x6', name: 'POCO X6', year: 2023, basePrice: 30000 },
    { id: 'poco_f6_pro', name: 'POCO F6 Pro', year: 2024, basePrice: 45000 },
    { id: 'poco_f6', name: 'POCO F6', year: 2024, basePrice: 38000 },
    { id: 'poco_f5', name: 'POCO F5', year: 2023, basePrice: 30000 }
  ],

  Google: [
    { id: 'pixel_9_pro_xl', name: 'Pixel 9 Pro XL', year: 2024, basePrice: 110000 },
    { id: 'pixel_9_pro', name: 'Pixel 9 Pro', year: 2024, basePrice: 90000 },
    { id: 'pixel_9_pro_fold', name: 'Pixel 9 Pro Fold', year: 2024, basePrice: 180000 },
    { id: 'pixel_9', name: 'Pixel 9', year: 2024, basePrice: 75000 },
    { id: 'pixel_8_pro', name: 'Pixel 8 Pro', year: 2023, basePrice: 85000 },
    { id: 'pixel_8', name: 'Pixel 8', year: 2023, basePrice: 65000 },
    { id: 'pixel_8a', name: 'Pixel 8a', year: 2023, basePrice: 35000 },
    { id: 'pixel_7_pro', name: 'Pixel 7 Pro', year: 2022, basePrice: 60000 },
    { id: 'pixel_7', name: 'Pixel 7', year: 2022, basePrice: 50000 },
    { id: 'pixel_7a', name: 'Pixel 7a', year: 2022, basePrice: 30000 },
    { id: 'pixel_6_pro', name: 'Pixel 6 Pro', year: 2021, basePrice: 45000 },
    { id: 'pixel_6', name: 'Pixel 6', year: 2021, basePrice: 35000 },
    { id: 'pixel_6a', name: 'Pixel 6a', year: 2021, basePrice: 20000 }
  ],

  OnePlus: [
    { id: 'oneplus_15', name: 'OnePlus 15', year: 2024, basePrice: 85000 },
    { id: 'oneplus_15r', name: 'OnePlus 15R', year: 2024, basePrice: 65000 },
    { id: 'oneplus_13', name: 'OnePlus 13', year: 2023, basePrice: 75000 },
    { id: 'oneplus_13r', name: 'OnePlus 13R', year: 2023, basePrice: 55000 },
    { id: 'oneplus_12', name: 'OnePlus 12', year: 2023, basePrice: 55000 },
    { id: 'oneplus_12r', name: 'OnePlus 12R', year: 2023, basePrice: 40000 },
    { id: 'oneplus_nord_5', name: 'OnePlus Nord 5', year: 2024, basePrice: 35000 },
    { id: 'oneplus_nord_ce_6', name: 'OnePlus Nord CE 6', year: 2023, basePrice: 30000 }
  ],

  Huawei: [
    { id: 'huawei_mate_80_pro', name: 'Huawei Mate 80 Pro', year: 2024, basePrice: 100000 },
    { id: 'huawei_mate_80', name: 'Huawei Mate 80', year: 2024, basePrice: 80000 },
    { id: 'huawei_mate_60_pro', name: 'Huawei Mate 60 Pro', year: 2023, basePrice: 85000 },
    { id: 'huawei_p60_pro', name: 'Huawei P60 Pro', year: 2023, basePrice: 70000 },
    { id: 'huawei_nova_13', name: 'Huawei Nova 13', year: 2024, basePrice: 40000 }
  ],

  Honor: [
    { id: 'honor_magic_8_pro', name: 'Honor Magic 8 Pro', year: 2024, basePrice: 95000 },
    { id: 'honor_magic_8', name: 'Honor Magic 8', year: 2024, basePrice: 70000 },
    { id: 'honor_magic_7_pro', name: 'Honor Magic 7 Pro', year: 2023, basePrice: 80000 },
    { id: 'honor_500_pro', name: 'Honor 500 Pro', year: 2024, basePrice: 45000 },
    { id: 'honor_200_pro', name: 'Honor 200 Pro', year: 2024, basePrice: 35000 }
  ],

  iQOO: [
    { id: 'iqoo_15_pro', name: 'iQOO 15 Pro', year: 2024, basePrice: 80000 },
    { id: 'iqoo_15', name: 'iQOO 15', year: 2024, basePrice: 70000 },
    { id: 'iqoo_13_pro', name: 'iQOO 13 Pro', year: 2023, basePrice: 70000 },
    { id: 'iqoo_13', name: 'iQOO 13', year: 2023, basePrice: 55000 },
    { id: 'iqoo_z11', name: 'iQOO Z11', year: 2024, basePrice: 40000 }
  ],

  Vivo: [
    { id: 'vivo_x200_pro', name: 'Vivo X200 Pro', year: 2024, basePrice: 85000 },
    { id: 'vivo_x200', name: 'Vivo X200', year: 2024, basePrice: 65000 },
    { id: 'vivo_v50', name: 'Vivo V50', year: 2024, basePrice: 50000 },
    { id: 'vivo_v40', name: 'Vivo V40', year: 2023, basePrice: 40000 },
    { id: 'vivo_y200', name: 'Vivo Y200', year: 2024, basePrice: 22000 }
  ],

  Oppo: [
    { id: 'oppo_find_x8_pro', name: 'Oppo Find X8 Pro', year: 2024, basePrice: 95000 },
    { id: 'oppo_find_x8', name: 'Oppo Find X8', year: 2024, basePrice: 75000 },
    { id: 'oppo_reno_13_pro', name: 'Oppo Reno 13 Pro', year: 2024, basePrice: 50000 },
    { id: 'oppo_a80', name: 'Oppo A80', year: 2024, basePrice: 25000 }
  ],

  Realme: [
    { id: 'realme_gt_7_pro', name: 'Realme GT 7 Pro', year: 2024, basePrice: 70000 },
    { id: 'realme_gt_6', name: 'Realme GT 6', year: 2024, basePrice: 55000 },
    { id: 'realme_14_pro_plus', name: 'Realme 14 Pro+', year: 2024, basePrice: 50000 },
    { id: 'realme_narzo_80_pro', name: 'Realme Narzo 80 Pro', year: 2024, basePrice: 35000 }
  ],

  Motorola: [
    { id: 'moto_razr_60_ultra', name: 'Moto RAZR 60 Ultra', year: 2024, basePrice: 100000 },
    { id: 'moto_razr_50_ultra', name: 'Moto RAZR 50 Ultra', year: 2023, basePrice: 95000 },
    { id: 'moto_edge_60_pro', name: 'Moto Edge 60 Pro', year: 2024, basePrice: 65000 },
    { id: 'moto_g85', name: 'Moto G85', year: 2024, basePrice: 28000 }
  ],

  Nothing: [
    { id: 'nothing_phone_3', name: 'Nothing Phone (3)', year: 2024, basePrice: 55000 },
    { id: 'nothing_phone_2a', name: 'Nothing Phone (2a)', year: 2023, basePrice: 35000 },
    { id: 'nothing_phone_2', name: 'Nothing Phone (2)', year: 2023, basePrice: 40000 }
  ],

  CMF: [
    { id: 'cmf_phone_2', name: 'CMF Phone 2', year: 2024, basePrice: 25000 },
    { id: 'cmf_phone_1', name: 'CMF Phone 1', year: 2023, basePrice: 20000 }
  ],

  Asus: [
    { id: 'rog_phone_9_pro', name: 'ROG Phone 9 Pro', year: 2024, basePrice: 120000 },
    { id: 'rog_phone_8', name: 'ROG Phone 8', year: 2023, basePrice: 95000 },
    { id: 'zenfone_12_ultra', name: 'Zenfone 12 Ultra', year: 2024, basePrice: 80000 }
  ],

  Meizu: [
    { id: 'meizu_22', name: 'Meizu 22', year: 2024, basePrice: 45000 },
    { id: 'meizu_21', name: 'Meizu 21', year: 2023, basePrice: 40000 }
  ],

  // ===== РЕДКИЕ И НИШЕВЫЕ БРЕНДЫ =====
  
  TCL: [
    { id: 'tcl_50_nxtpaper', name: 'TCL 50 NXTPAPER', year: 2024, basePrice: 28000 },
    { id: 'tcl_40_prime', name: 'TCL 40 Prime', year: 2023, basePrice: 18000 }
  ],

  ZTE: [
    { id: 'zte_axon_50', name: 'ZTE Axon 50', year: 2023, basePrice: 35000 },
    { id: 'zte_blade_v50', name: 'ZTE Blade V50', year: 2023, basePrice: 25000 }
  ],

  Ulefone: [
    { id: 'ulefone_armor_24_ultra', name: 'Ulefone Armor 24 Ultra', year: 2024, basePrice: 35000 },
    { id: 'ulefone_power_armor_16_pro', name: 'Ulefone Power Armor 16 Pro', year: 2024, basePrice: 40000 },
    { id: 'ulefone_armor_mini_20t', name: 'Ulefone Armor Mini 20T', year: 2024, basePrice: 18000 }
  ],

  Doogee: [
    { id: 'doogee_s100_pro', name: 'Doogee S100 Pro', year: 2024, basePrice: 32000 },
    { id: 'doogee_v30_pro', name: 'Doogee V30 Pro', year: 2024, basePrice: 35000 },
    { id: 'doogee_s96_pro', name: 'Doogee S96 Pro', year: 2023, basePrice: 28000 }
  ],

  Blackview: [
    { id: 'blackview_bv9300', name: 'Blackview BV9300', year: 2024, basePrice: 30000 },
    { id: 'blackview_bv8300', name: 'Blackview BV8300', year: 2023, basePrice: 25000 },
    { id: 'blackview_a200_pro', name: 'Blackview A200 Pro', year: 2024, basePrice: 20000 }
  ],

  Poco: [
    { id: 'poco_m6_pro', name: 'POCO M6 Pro', year: 2024, basePrice: 18000 },
    { id: 'poco_c65', name: 'POCO C65', year: 2024, basePrice: 12000 }
  ],

  Infinix: [
    { id: 'infinix_gt_20_pro', name: 'Infinix GT 20 Pro', year: 2024, basePrice: 25000 },
    { id: 'infinix_note_40', name: 'Infinix Note 40', year: 2024, basePrice: 20000 },
    { id: 'infinix_hot_40_pro', name: 'Infinix Hot 40 Pro', year: 2024, basePrice: 15000 }
  ],

  Tecno: [
    { id: 'tecno_phantom_x3_pro', name: 'Tecno Phantom X3 Pro', year: 2024, basePrice: 38000 },
    { id: 'tecno_pova_6_pro', name: 'Tecno POVA 6 Pro', year: 2024, basePrice: 22000 },
    { id: 'tecno_spark_20_pro', name: 'Tecno Spark 20 Pro', year: 2024, basePrice: 14000 }
  ],

  Itel: [
    { id: 'itel_vision_3', name: 'itel Vision 3', year: 2024, basePrice: 8000 },
    { id: 'itel_a70', name: 'itel A70', year: 2023, basePrice: 6000 }
  ],

  Umidigi: [
    { id: 'umidigi_bison_x20_pro', name: 'Umidigi Bison X20 Pro', year: 2024, basePrice: 32000 },
    { id: 'umidigi_a15_pro', name: 'Umidigi A15 Pro', year: 2024, basePrice: 20000 }
  ],

  Oukitel: [
    { id: 'oukitel_k15_pro', name: 'Oukitel K15 Pro', year: 2024, basePrice: 22000 },
    { id: 'oukitel_wp50_pro', name: 'Oukitel WP50 Pro', year: 2024, basePrice: 28000 }
  ],

  AGM: [
    { id: 'agm_h3s', name: 'AGM H3S', year: 2024, basePrice: 30000 },
    { id: 'agm_g1_se', name: 'AGM G1 SE', year: 2024, basePrice: 32000 }
  ],

  Cubot: [
    { id: 'cubot_x50', name: 'Cubot X50', year: 2024, basePrice: 24000 },
    { id: 'cubot_p80', name: 'Cubot P80', year: 2024, basePrice: 16000 }
  ],

  Leagoo: [
    { id: 'leagoo_s23_ultra', name: 'Leagoo S23 Ultra', year: 2024, basePrice: 28000 },
    { id: 'leagoo_power_6_pro', name: 'Leagoo Power 6 Pro', year: 2024, basePrice: 18000 }
  ],

  Nomu: [
    { id: 'nomu_m18_pro', name: 'Nomu M18 Pro', year: 2024, basePrice: 26000 }
  ],

  Crosscall: [
    { id: 'crosscall_core_m5', name: 'Crosscall Core M5', year: 2024, basePrice: 32000 },
    { id: 'crosscall_core_t5', name: 'Crosscall Core T5', year: 2024, basePrice: 28000 }
  ],

  Samsung_старые: [
    { id: 'galaxy_j7', name: 'Galaxy J7 (2015)', year: 2015, basePrice: 8000 },
    { id: 'galaxy_a20', name: 'Galaxy A20', year: 2019, basePrice: 12000 },
    { id: 'galaxy_a30', name: 'Galaxy A30', year: 2019, basePrice: 14000 },
    { id: 'galaxy_a50', name: 'Galaxy A50', year: 2019, basePrice: 18000 }
  ],

  Xiaomi_старые: [
    { id: 'redmi_7', name: 'Redmi 7', year: 2019, basePrice: 8000 },
    { id: 'redmi_8', name: 'Redmi 8', year: 2019, basePrice: 9000 },
    { id: 'xiaomi_mi_9', name: 'Mi 9', year: 2019, basePrice: 15000 },
    { id: 'xiaomi_mi_10', name: 'Mi 10', year: 2020, basePrice: 20000 }
  ],

  Sony: [
    { id: 'xperia_1_vi', name: 'Xperia 1 VI', year: 2024, basePrice: 110000 },
    { id: 'xperia_5_vi', name: 'Xperia 5 VI', year: 2024, basePrice: 80000 },
    { id: 'xperia_pro_i', name: 'Xperia Pro-I', year: 2021, basePrice: 90000 }
  ],

  Nokia: [
    { id: 'nokia_g100', name: 'Nokia G100', year: 2022, basePrice: 18000 },
    { id: 'nokia_g50', name: 'Nokia G50', year: 2021, basePrice: 15000 }
  ],

  LG: [
    { id: 'lg_g8x_thinq', name: 'LG G8X ThinQ', year: 2019, basePrice: 25000 },
    { id: 'lg_velvet', name: 'LG Velvet', year: 2020, basePrice: 28000 }
  ],

  HTC: [
    { id: 'htc_u23_pro', name: 'HTC U23 Pro', year: 2023, basePrice: 22000 },
    { id: 'htc_desire_21', name: 'HTC Desire 21', year: 2021, basePrice: 12000 }
  ],

  Fairphone: [
    { id: 'fairphone_5', name: 'Fairphone 5', year: 2024, basePrice: 55000 },
    { id: 'fairphone_4', name: 'Fairphone 4', year: 2021, basePrice: 40000 }
  ],

  BQ: [
    { id: 'bq_aquaris_x2', name: 'BQ Aquaris X2', year: 2018, basePrice: 18000 }
  ],

  Nubia: [
    { id: 'nubia_z60_ultra', name: 'Nubia Z60 Ultra', year: 2024, basePrice: 75000 },
    { id: 'nubia_z50s_pro', name: 'Nubia Z50S Pro', year: 2023, basePrice: 60000 }
  ],

  RedMagic: [
    { id: 'redmagic_10_pro', name: 'RedMagic 10 Pro', year: 2024, basePrice: 85000 },
    { id: 'redmagic_9_pro', name: 'RedMagic 9 Pro', year: 2023, basePrice: 75000 }
  ],

  Xperia: [
    { id: 'xperia_ace_iv', name: 'Xperia Ace IV', year: 2023, basePrice: 28000 }
  ],

  Moto_G: [
    { id: 'moto_g54', name: 'Moto G54', year: 2024, basePrice: 18000 },
    { id: 'moto_g53', name: 'Moto G53', year: 2023, basePrice: 16000 },
    { id: 'moto_g73', name: 'Moto G73', year: 2024, basePrice: 20000 },
    { id: 'moto_g84', name: 'Moto G84', year: 2024, basePrice: 22000 }
  ],

  Moto_E: [
    { id: 'moto_e54', name: 'Moto E54', year: 2024, basePrice: 10000 },
    { id: 'moto_e13', name: 'Moto E13', year: 2022, basePrice: 8000 }
  ],

  Poco_M: [
    { id: 'poco_m6', name: 'POCO M6', year: 2024, basePrice: 14000 },
    { id: 'poco_m5s', name: 'POCO M5s', year: 2023, basePrice: 12000 }
  ],

  Redmi_старые: [
    { id: 'redmi_6', name: 'Redmi 6', year: 2018, basePrice: 6000 },
    { id: 'redmi_9', name: 'Redmi 9', year: 2020, basePrice: 10000 },
    { id: 'redmi_10', name: 'Redmi 10', year: 2021, basePrice: 12000 }
  ],

  Vivo_старые: [
    { id: 'vivo_y21', name: 'Vivo Y21', year: 2021, basePrice: 10000 },
    { id: 'vivo_y51', name: 'Vivo Y51', year: 2020, basePrice: 12000 }
  ],

  Oppo_старые: [
    { id: 'oppo_a72', name: 'Oppo A72', year: 2020, basePrice: 14000 },
    { id: 'oppo_f15', name: 'Oppo F15', year: 2020, basePrice: 15000 }
  ],

  Realme_старые: [
    { id: 'realme_7_pro', name: 'Realme 7 Pro', year: 2020, basePrice: 16000 },
    { id: 'realme_5_pro', name: 'Realme 5 Pro', year: 2019, basePrice: 12000 }
  ],

  Micromax: [
    { id: 'micromax_in_note_2', name: 'Micromax In Note 2', year: 2022, basePrice: 14000 }
  ],

  Lava: [
    { id: 'lava_o2', name: 'Lava O2', year: 2024, basePrice: 12000 }
  ],

  Poco_Gaming: [
    { id: 'poco_f4_gaming', name: 'POCO F4 GT', year: 2022, basePrice: 35000 }
  ],

  Nubia_Z: [
    { id: 'nubia_z40_ultra', name: 'Nubia Z40 Ultra', year: 2022, basePrice: 55000 }
  ]
};

// ========================
// ФУНКЦИИ ГЕНЕРАЦИИ ДАННЫХ
// ========================

/**
 * Генерирует состояние телефона с повреждениями
 */
function generateCondition() {
  const rand = Math.random();
  if (rand < 0.15) return CONDITION_TYPES.PERFECT;
  if (rand < 0.35) return CONDITION_TYPES.GOOD;
  if (rand < 0.60) return CONDITION_TYPES.FAIR;
  if (rand < 0.85) return CONDITION_TYPES.POOR;
  return CONDITION_TYPES.CRITICAL;
}

/**
 * Генерирует список поломок в зависимости от состояния
 */
function generateDamages(condition) {
  const damages = [];
  let damageCount = 0;
  
  if (condition === CONDITION_TYPES.PERFECT) damageCount = 0;
  else if (condition === CONDITION_TYPES.GOOD) damageCount = Math.random() > 0.5 ? 0 : 1;
  else if (condition === CONDITION_TYPES.FAIR) damageCount = Math.floor(Math.random() * 2) + 1;
  else if (condition === CONDITION_TYPES.POOR) damageCount = Math.floor(Math.random() * 3) + 2;
  else damageCount = Math.floor(Math.random() * 4) + 3;
  
  for (let i = 0; i < damageCount; i++) {
    const damage = DAMAGES[Math.floor(Math.random() * DAMAGES.length)];
    if (!damages.find(d => d.type === damage.type)) {
      damages.push(damage);
    }
  }
  
  return damages;
}

/**
 * Генерирует комплектацию телефона
 */
function generateAccessories() {
  const accessories = [];
  ACCESSORIES.forEach(acc => {
    if (Math.random() < acc.probability) {
      accessories.push(acc.id);
    }
  });
  return accessories;
}

/**
 * Генерирует цену объявления на основе базовой цены и состояния
 */
function generateListingPrice(basePrice, condition) {
  const multiplier = CONDITION_MULTIPLIERS[condition];
  const variation = 0.85 + Math.random() * 0.30; // ±15% случайности
  return Math.floor(basePrice * multiplier * variation);
}

/**
 * Генерирует случайное объявление на доске
 */
function generateListing(phoneId, brandName) {
  const brand = PHONES_DATABASE[brandName];
  const phone = brand.find(p => p.id === phoneId);
  
  if (!phone) return null;
  
  const condition = generateCondition();
  const damages = generateDamages(condition);
  const accessories = generateAccessories();
  const price = generateListingPrice(phone.basePrice, condition);
  
  // Бонус цены за комплектацию
  let priceBonus = 0;
  accessories.forEach(acc => {
    const accObj = ACCESSORIES.find(a => a.id === acc);
    if (accObj) priceBonus += accObj.priceBonus;
  });
  
  const finalPrice = Math.floor(price * (1 + priceBonus));
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    phoneId: phoneId,
    brandName: brandName,
    phoneName: phone.name,
    year: phone.year,
    condition: condition,
    damages: damages,
    accessories: accessories,
    price: finalPrice,
    originalPrice: phone.basePrice,
    listingDate: new Date().toISOString(),
    seller: 'Seller #' + Math.floor(Math.random() * 10000)
  };
}

/**
 * Генерирует доску объявлений (N случайных объявлений)
 */
function generateBoard(count = 12) {
  const board = [];
  const brandNames = Object.keys(PHONES_DATABASE);
  
  for (let i = 0; i < count; i++) {
    const brandName = brandNames[Math.floor(Math.random() * brandNames.length)];
    const brand = PHONES_DATABASE[brandName];
    const phone = brand[Math.floor(Math.random() * brand.length)];
    
    const listing = generateListing(phone.id, brandName);
    board.push(listing);
  }
  
  return board;
}

/**
 * Система торга
 * @param {number} askingPrice - Цена в объявлении
 * @param {number} offerPrice - Предложенная цена
 * @returns {object} { accepted: bool, counterOffer: number|null }
 */
function negotiatePrice(askingPrice, offerPrice) {
  const difference = askingPrice - offerPrice;
  
  // Если предложение ниже на 2000+, отказ
  if (difference >= 2000) {
    return { accepted: false, counterOffer: null, reason: 'Ваше предложение слишком низко' };
  }
  
  // Если предложение выше, сразу согласие
  if (offerPrice >= askingPrice) {
    return { accepted: true, counterOffer: null };
  }
  
  // Если разница меньше 2000, 50/50 вероятность
  if (Math.random() < 0.5) {
    return { accepted: true, counterOffer: null };
  } else {
    // Контрпредложение: цена минус небольшой процент
    const counterOffer = Math.floor(askingPrice * 0.95);
    return { accepted: false, counterOffer: counterOffer, reason: 'Продавец предлагает контрцену' };
  }
}

/**
 * Получить детали запчастей по бренду (мок-данные)
 */
function getPartsPricesByBrand(brandName) {
  // Базовые множители по бренду для цен запчастей
  const brandMultipliers = {
    'Apple': 1.5,      // Apple дороже
    'Samsung': 1.3,
    'Xiaomi': 0.9,
    'Google': 1.2,
    'OnePlus': 1.0,
    'Huawei': 1.1,
    'Honor': 0.95,
    'iQOO': 0.95,
    'Vivo': 0.9,
    'Oppo': 0.9,
    'Realme': 0.85,
    'Motorola': 0.95,
    'Nothing': 1.0,
    'CMF': 0.8,
    'Asus': 1.2,
    'Meizu': 0.85,
    'POCO': 0.85,
    'Redmi': 0.85
  };
  
  const multiplier = brandMultipliers[brandName] || 1.0;
  
  return {
    screen: Math.floor(5000 * multiplier),
    battery: Math.floor(2000 * multiplier),
    button: Math.floor(700 * multiplier),
    backGlass: Math.floor(3500 * multiplier),
    chargePort: Math.floor(1200 * multiplier),
    camera: Math.floor(3000 * multiplier),
    motherboard: Math.floor(12000 * multiplier),
    speaker: Math.floor(800 * multiplier)
  };
}

// ========================
// ИНИЦИАЛИЗАЦИЯ ИГРЫ
// ========================

const GAME_CONFIG = {
  startingBalance: 5000,
  maxListingsPerBoard: 12,
  minProfitMargin: 1.1 // Минимум 10% прибыли для успешной сделки
};
