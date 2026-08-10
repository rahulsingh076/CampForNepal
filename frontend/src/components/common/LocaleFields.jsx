// The three locale pickers, shared by the welcome screen and the header switcher.
import { useLocale } from '../../contexts/LocaleContext.jsx'
import FormField from './FormField.jsx'

export default function LocaleFields({ countries, languages, currencies, showHints = true }) {
  const locale = useLocale()

  // Picking a country suggests that market's language and currency.
  function handleCountryChange(event) {
    const next = countries.find((item) => item.countryCode === event.target.value)
    if (!next) return

    locale.setCountry(next.countryCode, {
      language: next.defaultLanguage,
      currency: next.defaultCurrency,
    })
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <FormField
        label={locale.t('welcome.countryLabel')}
        as="select"
        value={locale.country}
        onChange={handleCountryChange}
        hint={showHints ? locale.t('welcome.countryHint') : undefined}
        options={countries.map((item) => ({
          value: item.countryCode,
          label: `${item.countryName} (${item.countryCode}) - ${item.defaultLanguage.toUpperCase()}, ${item.defaultCurrency}`,
        }))}
        className="sm:col-span-2"
      />

      <FormField
        label={locale.t('welcome.languageLabel')}
        as="select"
        value={locale.language}
        onChange={(event) => locale.setLanguage(event.target.value)}
        hint={showHints ? locale.t('welcome.languageHint') : undefined}
        options={languages.map((item) => ({
          value: item.code,
          label: `${item.name} — ${item.nativeName}`,
        }))}
      />

      <FormField
        label={locale.t('welcome.currencyLabel')}
        as="select"
        value={locale.currencyCode}
        onChange={(event) => locale.setCurrency(event.target.value)}
        options={currencies.map((item) => ({
          value: item.code,
          label: `${item.code} (${item.symbol}) - ${item.label}`,
        }))}
      />
    </div>
  )
}
