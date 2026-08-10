// UI label strings by language. English is the complete fallback source.
// Partial locale dictionaries intentionally display English for a missing key;
// this does not imply that long-form CMS content has been translated.
const translations = {
  en: {
    'welcome.eyebrow': 'Welcome',
    'welcome.title': 'Where are you travelling from?',
    'welcome.subtitle':
      'Tell us where you are based and we will show the right prices, the right guides, and support in a language you are comfortable with.',
    'welcome.whyWeAsk':
      'We ask so we can suggest suitable trips, show prices in your currency, match you with a guide who speaks your language, and give you support hours that fit your timezone.',
    'welcome.countryLabel': 'Country or region',
    'welcome.countryHint': 'This sets your currency and support details.',
    'welcome.languageLabel': 'Preferred language',
    'welcome.languageHint': 'Suggested from your country. Change it any time.',
    'welcome.currencyLabel': 'Show prices in',
    'welcome.next': 'Continue',
    'welcome.skip': 'Skip for now',
    'welcome.skipNote': 'Skipping uses English and US dollars. You can change this later.',
    'welcome.loading': 'Loading countries',
    'welcome.errorTitle': 'We could not load the country list',
    'welcome.errorBody': 'Something went wrong on our side. You can try again, or skip and set this later.',
    'welcome.retry': 'Try again',
    'welcome.privacy': 'We never use your location. Nothing here is shared with anyone.',

    'locale.title': 'Country and language',
    'locale.country': 'Country',
    'locale.language': 'Language',
    'locale.currency': 'Currency',
    'locale.change': 'Change',
    'locale.done': 'Done',
    'locale.reset': 'Reset onboarding',

    'support.title': 'Talk to someone before you book',
    'common.loading': 'Loading',
    'common.retry': 'Try again',
  },

  // Partial by design: any missing key falls through to English.
  ne: {
    'welcome.eyebrow': 'स्वागत छ',
    'welcome.title': 'तपाईं कहाँबाट यात्रा गर्दै हुनुहुन्छ?',
    'welcome.next': 'अगाडि बढ्नुहोस्',
    'welcome.skip': 'अहिलेलाई छोड्नुहोस्',
    'locale.country': 'देश',
    'locale.language': 'भाषा',
    'locale.currency': 'मुद्रा',
    'common.loading': 'लोड हुँदैछ',
  },
  ko: {
    'welcome.eyebrow': '환영합니다',
    'welcome.title': '어느 나라에서 오셨나요?',
    'welcome.next': '계속하기',
    'welcome.skip': '나중에 하기',
    'locale.country': '국가',
    'locale.language': '언어',
    'locale.currency': '통화',
    'common.loading': '불러오는 중',
  },
  ja: {
    'welcome.eyebrow': 'ようこそ',
    'welcome.title': 'どちらからお越しですか？',
    'welcome.next': '続ける',
    'welcome.skip': '後で設定する',
    'locale.country': '国',
    'locale.language': '言語',
    'locale.currency': '通貨',
    'common.loading': '読み込み中',
  },
  hi: {
    'welcome.eyebrow': 'स्वागत है',
    'welcome.title': 'आप कहाँ से यात्रा कर रहे हैं?',
    'welcome.next': 'आगे बढ़ें',
    'welcome.skip': 'अभी छोड़ें',
    'locale.country': 'देश',
    'locale.language': 'भाषा',
    'locale.currency': 'मुद्रा',
    'common.loading': 'लोड हो रहा है',
  },
  zh: {
    'welcome.eyebrow': '欢迎',
    'welcome.title': '您来自哪个国家？',
    'welcome.next': '继续',
    'welcome.skip': '暂时跳过',
    'locale.country': '国家',
    'locale.language': '语言',
    'locale.currency': '货币',
    'common.loading': '加载中',
  },
}

export const FALLBACK_LANGUAGE = 'en'

// Looks a label up, falling back to English, then to the key itself.
export function translate(language, key) {
  return translations[language]?.[key] ?? translations[FALLBACK_LANGUAGE][key] ?? key
}

export default translations
