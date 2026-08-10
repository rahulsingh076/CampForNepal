// Root component: providers, then the router.
import { BrowserRouter } from 'react-router-dom'
import ErrorBoundary from '../components/common/ErrorBoundary.jsx'
import Providers from './providers.jsx'
import AppRouter from './router.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Providers>
        <ErrorBoundary>
          <AppRouter />
        </ErrorBoundary>
      </Providers>
    </BrowserRouter>
  )
}
