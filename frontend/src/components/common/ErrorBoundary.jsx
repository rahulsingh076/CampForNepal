import { Component } from 'react'

// A route-independent safety net. It intentionally has no provider dependency
// so a failure inside a provider still leaves visitors with a way back.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Unhandled application error', error, info)
  }

  componentDidUpdate(previousProps) {
    if (this.state.error && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main id="main" className="flex min-h-screen items-center justify-center bg-sand-50 px-4 py-12">
        <section className="max-w-lg border border-stone-200 bg-white p-7 text-center shadow-sm sm:p-10">
          <p className="text-small font-semibold uppercase tracking-wide text-primary-700">Something went wrong</p>
          <h1 className="mt-3 text-h2">This page needs another try</h1>
          <p className="mt-4 text-body text-stone-700">The rest of Camp for Nepal is still available. You can reload this page or return to the home page.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => window.location.reload()} className="rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white hover:bg-primary-800">Reload page</button>
            <a href="/" className="rounded-lg border border-stone-300 px-4 py-2 text-small font-semibold text-primary-800 hover:border-primary-600">Return home</a>
          </div>
        </section>
      </main>
    )
  }
}
