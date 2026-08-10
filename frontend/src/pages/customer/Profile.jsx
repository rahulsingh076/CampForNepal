// Profile: name plus the country, language and currency the site already uses.
import { useState } from 'react'
import FormField from '../../components/common/FormField.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'
import LocaleFields from '../../components/common/LocaleFields.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useLocale } from '../../contexts/LocaleContext.jsx'
import usePageMeta from '../../hooks/usePageMeta.js'
import useLocaleOptions from '../../hooks/useLocaleOptions.js'
import { updateItem } from '../../lib/dataClient.js'

export default function Profile() {
  usePageMeta('Profile', 'Your account details and travel preferences.')
  const { user, refreshUser } = useAuth()
  const locale = useLocale()
  const options = useLocaleOptions()

  const [fullName, setFullName] = useState(user.fullName)
  const [state, setState] = useState('idle')

  // The locale pickers write straight to LocaleContext; saving also stores the
  // same choices on the account so they are one thing, not two.
  async function handleSubmit(event) {
    event.preventDefault()
    if (fullName.trim().length < 2) {
      setState('invalid')
      return
    }

    setState('saving')
    const result = await updateItem(
      'users',
      user.id,
      {
        fullName: fullName.trim(),
        country: locale.country,
        preferences: {
          ...user.preferences,
          language: locale.language,
          currency: locale.currencyCode,
        },
      },
      { id: user.id, fullName: fullName.trim() }
    )

    if (result.success) {
      refreshUser(result.data)
      setState('saved')
    } else {
      setState('failed')
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-h2 text-stone-900">Profile</h1>
      <p className="mt-1 text-body text-stone-600">
        Preferences here drive the whole site — prices, language, and suggestions.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
        <FormField
          label="Full name"
          required
          autoComplete="name"
          value={fullName}
          onChange={(event) => {
            setFullName(event.target.value)
            if (state !== 'idle') setState('idle')
          }}
          error={state === 'invalid' ? 'Your name is needed.' : null}
        />

        <FormField label="Email" type="email" value={user.email} disabled readOnly hint="Demo accounts keep their email address." onChange={() => {}} />

        {options.status === 'loading' && <LoadingState label="Loading preferences…" />}
        {options.status === 'ready' && (
          <LocaleFields
            countries={options.countries}
            languages={options.languages}
            currencies={options.currencies}
            showHints={false}
          />
        )}

        {state === 'saved' && (
          <p role="status" className="text-small font-medium text-success-700">
            Saved. The site now uses these preferences everywhere.
          </p>
        )}
        {state === 'failed' && (
          <p role="alert" className="text-small font-medium text-danger-700">
            Could not save just now — your browser storage may be full.
          </p>
        )}

        <button
          type="submit"
          disabled={state === 'saving'}
          className="rounded-lg bg-primary-700 px-4 py-3 text-body font-semibold text-white transition-colors duration-200 hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === 'saving' ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <p className="mt-8 rounded-lg bg-sand-100 p-4 text-small text-stone-600">
        This is a demo account stored in your browser. Passwords are never real and
        nothing leaves this device.
      </p>
    </div>
  )
}
