// Wraps the app in every context provider. New providers are added here, not in App.
import { AuthProvider } from '../contexts/AuthContext.jsx'
import { ToastProvider } from '../components/admin/Toast.jsx'
import { LocaleProvider } from '../contexts/LocaleContext.jsx'
import { WishlistProvider } from '../contexts/WishlistContext.jsx'

export default function Providers({ children }) {
  return (
    <LocaleProvider>
      <AuthProvider>
        <ToastProvider>
          <WishlistProvider>{children}</WishlistProvider>
        </ToastProvider>
      </AuthProvider>
    </LocaleProvider>
  )
}
