// Visible only when focused, so keyboard users can bypass repeated navigation.
// It stays `fixed` and slides in from off-screen rather than being hidden with
// the screen-reader-only utility: the focus variant that undoes that utility
// outranks the layout classes and resets the link to position static with no
// padding, shifting the whole page the moment it is focused.
export default function SkipLink() {
  function focusMainContent() {
    // Hash navigation scrolls to the target, but does not reliably move focus
    // there in every browser. The shell's main landmark is deliberately
    // tabbable only for this purpose.
    window.setTimeout(() => document.getElementById('main')?.focus(), 0)
  }

  return (
    <a
      href="#main"
      onClick={focusMainContent}
      className="fixed left-4 top-4 z-toast -translate-y-24 rounded-md bg-primary-800 px-4 py-2 text-small font-semibold text-white transition-transform duration-200 focus:translate-y-0"
    >
      Skip to content
    </a>
  )
}
