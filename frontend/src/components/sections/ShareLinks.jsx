// Share row. Copying the address works; the social buttons wait for V2.
import { useState } from 'react'

const PLATFORMS = ['Facebook', 'X', 'WhatsApp', 'Email']

export default function ShareLinks({ title }) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      // Clipboard access can be refused; saying nothing is better than a scary error.
      setCopied(false)
    }
  }

  return (
    <div className="border-t border-stone-200 pt-6">
      <h2 className="text-small font-semibold uppercase tracking-widest text-stone-600">
        Share this
      </h2>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copyLink}
          className="rounded-lg border border-stone-300 px-4 py-2 text-small font-medium text-stone-800 transition-colors duration-200 hover:border-stone-400"
        >
          {copied ? 'Link copied' : 'Copy link'}
        </button>

        {PLATFORMS.map((platform) => (
          <span
            key={platform}
            title={`Sharing to ${platform} is not wired up in this build`}
            className="cursor-not-allowed rounded-lg border border-dashed border-stone-300 px-4 py-2 text-small text-stone-500"
          >
            {platform}
          </span>
        ))}
      </div>

      <p className="sr-only">Social sharing is not connected in this build.</p>
    </div>
  )
}
