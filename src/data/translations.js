// i18n Translations for Warehouse Terminal Application (UZ LATIN & RU)

export const translations = {
  uz: {
    // Auth Screen
    authTitle: 'Avtorizatsiya',
    fioLabel: 'F.I.O. xodim',
    fioPlaceholder: 'Xodimning F.I.O.sini kiriting',
    shiftLabel: 'Smena',
    shiftSuffix: 'smena',
    loginBtn: 'Tizimga kirish',
    fioError: 'F.I.O. xodimni kiriting!',

    // Direction Selection
    dirTitle: 'Yo\'nalishni tanlang',
    dirSubtitle: 'Xodim',

    dirSortTitle: '1. Sortirovka',
    dirSortDesc: 'Pallet va Koroblarni skanerlash',

    dirParkTitle: '2. Parkovka',
    dirParkDesc: 'Palletni ombor zonasiga joylashtirish',

    dirSearchTitle: '3. Korobni qidirish',
    dirSearchDesc: 'Korob qaysi pallet yoki zonadaligini topish',

    // Workflow Header
    sortHeaderTitle: 'Sortirovka',
    sortHeaderSub: 'Sotuv uchun',
    parkHeaderTitle: 'Parkovka',
    parkHeaderSub: 'Ombor zonasiga',
    searchHeaderTitle: 'Korobni qidirish',
    searchHeaderSub: 'Ma\'lumot olish',

    // Step 3 & 4 (Sort Workflow)
    scanGmTitle: 'Palletni skanerlang',
    scanGmInputPlaceholder: 'Pallet kodini uring (84-000056560)',
    scannedGmLabel: 'URILGAN PALLET:',
    scanActTitle: 'Korobni skanerlang',
    actInputPlaceholder: 'Korob raqamini uring (484959 yoki 80-0000...)',
    scannedActsCount: 'Urilgan Koroblar',
    scannedActsEmpty: 'Hali hech qanday korob urilmadi',
    finishGmBtn: 'PALLETNI YAKUNLASH',
    nextGmBtn: 'KEYINGI PALLETNI SORTIROVKALASH',
    gmClosedSuccess: 'Pallet yopildi va saqlandi!',

    // Mobile Action Buttons
    btnNext: 'KEYINGI →',
    btnAdd: 'QO\'SHISH',
    btnPark: '📍 PARKOVKA QILISH →',
    btnSearch: '🔍 QIDIRISH',

    // Validation Errors
    gmPrefixError: 'Noto\'g\'ri pallet kodi! Kod 84-0000... bilan boshlanishi shart!',

    // Parkovka Workflow
    parkStep1Title: '1-QADAM: PALLETNI SKANERLANG',
    parkStep1Placeholder: 'Pallet kodini uring (84-000056560)',
    parkStep2Title: '2-QADAM: OMBOR ZONASINI SKANERLANG',
    parkStep2Placeholder: 'Zona kodini uring (ZONE-B4.01.13.3.1)',
    parkScannedGm: 'URILGAN PALLET:',
    parkOtherGmBtn: '← Boshqa pallet tanlash',
    parkSuccessTitle: 'MUVAFFAQIYATLI PARKOVKA QILINDI!',
    parkNextBtn: 'KEYINGI PALLETNI PARKOVKA QILISH',

    // Search Workflow
    searchTitle: 'Korobni qidirish',
    searchInputLabel: 'KOROB RAQAMINI KIRITING:',
    searchInputPlaceholder: 'Masalan: 484959',
    searchNotFound: 'raqami bo\'yicha ma\'lumot topilmadi.',
    searchMatchedBanner: '🎯 KOROB PALLET ICHIDAN TOPILDI!',
    searchCard1Header: '1. TEGISHLI PALLET',
    searchCard2Header: '2. JORIY OMBOR PARKOVKA ZONASI (OXIRGI JOYLASHUV)',
    searchCard3Header: '3. PALLET ICHIDAGI BARCHA KOROBLAR RÖYXATI',
    searchCard4Header: '4. BARCHA HARAKATLAR JURNALI VA TARIXI',
    searchNotParkedYet: '⏳ Hali parkovka qilinmagan (Kutilmoqda)',

    // Drawer Settings
    settingsTitle: 'Shaxsiy sozlamalar',
    employeeLabel: 'XODIM:',
    floorLabel: 'Qavat',
    switchUserBtn: 'XODIMNI ALMASHTIRISH / CHIQISH',
    langLabel: 'Til:'
  },
  ru: {
    // Auth Screen
    authTitle: 'Авторизация',
    fioLabel: 'Ф.И.О. сотрудника',
    fioPlaceholder: 'Введите Ф.И.О. сотрудника',
    shiftLabel: 'Смена',
    shiftSuffix: 'смена',
    loginBtn: 'Войти',
    fioError: 'Введите Ф.И.О. сотрудника!',

    // Direction Selection
    dirTitle: 'Выбор направления',
    dirSubtitle: 'Сотрудник',

    dirSortTitle: '1. Сортировка',
    dirSortDesc: 'Сканирование паллета и коробов',

    dirParkTitle: '2. Парковка',
    dirParkDesc: 'Размещение паллета в зону склада',

    dirSearchTitle: '3. Поиск короба',
    dirSearchDesc: 'Поиск нахождения короба в паллете или зоне',

    // Workflow Header
    sortHeaderTitle: 'Сортировка',
    sortHeaderSub: 'Для продажи',
    parkHeaderTitle: 'Парковка',
    parkHeaderSub: 'В зону склада',
    searchHeaderTitle: 'Поиск короба',
    searchHeaderSub: 'Информация',

    // Step 3 & 4 (Sort Workflow)
    scanGmTitle: 'Отсканируйте паллет',
    scanGmInputPlaceholder: 'Введите код паллета (84-000056560)',
    scannedGmLabel: 'ОТСКАНИРОВАННЫЙ ПАЛЛЕТ:',
    scanActTitle: 'Отсканируйте Короб',
    actInputPlaceholder: 'Введите номер короба (484959 или 80-0000...)',
    scannedActsCount: 'Отсканировано коробов',
    scannedActsEmpty: 'Коробы еще не отсканированы',
    finishGmBtn: 'ЗАВЕРШИТЬ ПАЛЛЕТ',
    nextGmBtn: 'СОРТИРОВАТЬ СЛЕДУЮЩИЙ ПАЛЛЕТ',
    gmClosedSuccess: 'Паллет закрыт и сохранен!',

    // Mobile Action Buttons
    btnNext: 'ДАЛЕЕ →',
    btnAdd: 'ДОБАВИТЬ',
    btnPark: '📍 ПАРКОВАТЬ →',
    btnSearch: '🔍 НАЙТИ',

    // Validation Errors
    gmPrefixError: 'Неверный код паллета! Код должен начинаться с 84-0000...',

    // Parkovka Workflow
    parkStep1Title: '1-ШАГ: ОТСКАНИРУЙТЕ ПАЛЛЕТ',
    parkStep1Placeholder: 'Введите код паллета (84-000056560)',
    parkStep2Title: '2-ШАГ: ОТСКАНИРУЙТЕ ЗОНУ СКЛАДА',
    parkStep2Placeholder: 'Введите код зоны (ZONE-B4.01.13.3.1)',
    parkScannedGm: 'ОТСКАНИРОВАННЫЙ ПАЛЛЕТ:',
    parkOtherGmBtn: '← Выбрать другой паллет',
    parkSuccessTitle: 'УСПЕШНО ЗАПАРКОВАНО!',
    parkNextBtn: 'ПАРКОВАТЬ СЛЕДУЮЩИЙ ПАЛЛЕТ',

    // Search Workflow
    searchTitle: 'Поиск короба',
    searchInputLabel: 'ВВЕДИТЕ НОМЕР КОРОБА:',
    searchInputPlaceholder: 'Например: 484959',
    searchNotFound: 'информация по коробу не найдена.',
    searchMatchedBanner: '🎯 КОРОБ НАЙДЕН ВНУТРИ ПАЛЛЕТА!',
    searchCard1Header: '1. ПРИНАДЛЕЖИТ К ПАЛЛЕТУ',
    searchCard2Header: '2. ТЕКУЩАЯ ЗОНА ПАРКОВКИ (ПОСЛЕДНЕЕ МЕСТО)',
    searchCard3Header: '3. ВСЕ КОРОБА ВНУТРИ ПАЛЛЕТА',
    searchCard4Header: '4. ПОЛНАЯ ИСТОРИЯ И ЖУРНАЛ ДЕЙСТВИЙ',
    searchNotParkedYet: '⏳ Еще не запарковано (Ожидание)',

    // Drawer Settings
    settingsTitle: 'Персональные настройки',
    employeeLabel: 'СОТРУДНИК:',
    floorLabel: 'Этаж',
    switchUserBtn: 'СМЕНИТЬ ПОЛЬЗОВАТЕЛЯ / ВЫЙТИ',
    langLabel: 'Язык:'
  }
};
