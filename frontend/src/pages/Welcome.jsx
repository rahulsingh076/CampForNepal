// First-visit screen: asks where the visitor is travelling from, and why we want to know.
import { useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/common/Button.jsx'
import Container from '../components/common/Container.jsx'
import ErrorState from '../components/common/ErrorState.jsx'
import LoadingState from '../components/common/LoadingState.jsx'
import LocaleFields from '../components/common/LocaleFields.jsx'
import { useLocale } from '../contexts/LocaleContext.jsx'
import useLocaleOptions from '../hooks/useLocaleOptions.js'
import usePageMeta from '../hooks/usePageMeta.js'
import { returnTarget } from '../lib/returnTo.js'

export default function Welcome() {
  usePageMeta('Welcome', 'Choose your travel preferences for the Camp for Nepal demo.')
  const locale = useLocale()
  const options = useLocaleOptions()
  const navigate = useNavigate()
  const location = useLocation()

  // Return them to whatever they originally asked for, or the homepage.
  const destination = returnTarget(location.state?.from, '/', ['/welcome'])

  function finish(action) {
    action()
    navigate(destination, { replace: true })
  }

  return (
    <main className="min-h-screen bg-primary-900 py-16 text-sand-50 sm:py-24">
      <Container width="narrow">
        <p className="text-small font-semibold uppercase tracking-widest text-amber-300">
          {locale.t('welcome.eyebrow')}
        </p>
        <h1 className="mt-3 font-display text-h1 text-white">{locale.t('welcome.title')}</h1>
        <p className="readable-text mt-5 text-body text-sand-200">
          {locale.t('welcome.subtitle')}
        </p>

        <div className="mt-10 rounded-2xl bg-white p-6 text-stone-700 shadow-xl sm:p-8">
          {options.status === 'loading' && (
            <LoadingState rows={4} label={locale.t('welcome.loading')} />
          )}

          {options.status === 'error' && (
            <ErrorState
              title={locale.t('welcome.errorTitle')}
              description={locale.t('welcome.errorBody')}
              action={
                <Button variant="secondary" onClick={options.reload}>
                  {locale.t('welcome.retry')}
                </Button>
              }
            />
          )}

          {options.status === 'ready' && (
            <>
              <LocaleFields
                countries={options.countries}
                languages={options.languages}
                currencies={options.currencies}
              />

              <p className="readable-text mt-8 text-small text-stone-600">
                {locale.t('welcome.whyWeAsk')}
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Button size="lg" onClick={() => finish(locale.completeOnboarding)}>
                  {locale.t('welcome.next')}
                </Button>
                <Button variant="ghost" onClick={() => finish(locale.skipOnboarding)}>
                  {locale.t('welcome.skip')}
                </Button>
              </div>

              <p className="mt-4 text-small text-stone-500">{locale.t('welcome.skipNote')}</p>
            </>
          )}
        </div>

        {/* Styled for the dark band: TrustBadge is built for light surfaces. */}
        <p className="readable-text mt-10 text-small text-sand-300">
          {locale.t('welcome.privacy')}
        </p>
      </Container>
    </main>
  )
}
