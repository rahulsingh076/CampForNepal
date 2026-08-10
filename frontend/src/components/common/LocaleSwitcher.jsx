// Lets a visitor change country, language, and currency at any time. Used in the header.
import { useEffect, useId, useRef, useState } from 'react'
import { useLocale } from '../../contexts/LocaleContext.jsx'
import useLocaleOptions from '../../hooks/useLocaleOptions.js'
import Button from './Button.jsx'
import LoadingState from './LoadingState.jsx'
import LocaleFields from './LocaleFields.jsx'

export default function LocaleSwitcher({ className = '', showCountry = false, compact = false }) {
  const locale = useLocale()
  const options = useLocaleOptions()
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const controlRef = useRef(null)
  const menuRef = useRef(null)

  const language = options.languages.find((item) => item.code === locale.language)
  const country = options.countries.find((item) => item.countryCode === locale.country)
  const languageLabel = language?.name || locale.language.toUpperCase()
  const countryLabel = country?.countryName || (locale.country === 'XX' ? 'Other' : locale.country)
  const compactLanguage = (language?.code || locale.language).toUpperCase()
  const compactCountry = country?.countryCode || (locale.country === 'XX' ? '' : locale.country)
  const summary = compact
    ? [showCountry ? compactCountry : null, compactLanguage, locale.currencyCode].filter(Boolean).join(' · ')
    : showCountry
      ? `${countryLabel} · ${languageLabel} · ${locale.currencyCode}`
      : `${languageLabel} · ${locale.currencyCode}`

  useEffect(() => {
    if (!open) return undefined

    function closeWhenOutside(event) {
      if (!menuRef.current?.contains(event.target) && !controlRef.current?.contains(event.target)) setOpen(false)
    }
    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        setOpen(false)
        controlRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', closeWhenOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeWhenOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        ref={controlRef}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="dialog"
        aria-label={`Country: ${countryLabel}. Language and currency: ${languageLabel}, ${locale.currencyCode}`}
        className={`flex min-h-11 items-center rounded-lg border border-stone-300 px-3 py-2 text-small font-medium text-stone-800 transition-colors duration-200 hover:border-stone-400 ${showCountry ? 'max-w-full text-left' : compact ? 'max-w-28' : 'max-w-36'}`}
      >
        <span className={compact || !showCountry ? 'truncate whitespace-nowrap' : 'whitespace-normal'}>{summary}</span>
      </button>

      {open && (
        <div id={menuId} ref={menuRef} role="dialog" aria-label={locale.t('locale.title')} className="absolute right-0 z-dropdown mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl bg-white p-6 shadow-xl ring-1 ring-stone-200">
          <h2 className="text-h4 font-display text-stone-900">{locale.t('locale.title')}</h2>

          {options.status === 'ready' ? (
            <div className="mt-4">
              <LocaleFields
                countries={options.countries}
                languages={options.languages}
                currencies={options.currencies}
                showHints={false}
              />
            </div>
          ) : (
            <div className="mt-4">
              <LoadingState rows={3} label={locale.t('common.loading')} />
            </div>
          )}

          <div className="mt-6">
            <Button size="sm" fullWidth className="min-h-11" onClick={() => setOpen(false)}>
              {locale.t('locale.done')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
