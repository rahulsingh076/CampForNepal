// Floating WhatsApp button. The number comes from the CMS contact details.
export default function WhatsAppButton({ number, label = 'Chat with us on WhatsApp' }) {
  if (!number) return null

  // wa.me needs the number stripped of spaces, dashes, and the leading plus.
  const digits = number.replace(/[^\d]/g, '')

  return (
    <a
      href={`https://wa.me/${digits}`}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={label}
      title={label}
      className="floating-contact fixed z-sticky flex h-14 w-14 items-center justify-center rounded-full bg-primary-700 text-white shadow-lg transition-colors duration-200 hover:bg-primary-800"
    >
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.39a9.86 9.86 0 004.74 1.21h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.13-2.9-7A9.82 9.82 0 0012.04 2zm0 18.15h-.01a8.2 8.2 0 01-4.18-1.15l-.3-.18-3.11.82.83-3.03-.2-.31a8.18 8.18 0 01-1.26-4.4c0-4.54 3.7-8.23 8.24-8.23a8.2 8.2 0 018.23 8.24c0 4.54-3.7 8.24-8.24 8.24zm4.52-6.16c-.25-.13-1.47-.72-1.69-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.09-.16.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.23.25-.86.84-.86 2.05s.88 2.38 1 2.54c.13.17 1.74 2.65 4.2 3.72.59.25 1.05.4 1.4.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.28z" />
      </svg>
    </a>
  )
}
