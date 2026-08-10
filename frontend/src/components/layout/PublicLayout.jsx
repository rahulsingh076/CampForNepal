// Shell for every public page: header, the page itself, footer, WhatsApp button.
import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { getSingleton } from '../../lib/dataClient.js'
import Footer from './Footer.jsx'
import Header from './Header.jsx'
import WhatsAppButton from './WhatsAppButton.jsx'
import SkipLink from '../common/SkipLink.jsx'
import useDataChange from '../../hooks/useDataChange.js'
import { isSafeInternalPath } from '../../lib/urlSafety.js'

function safeMenuItem(item) {
  if (!item || !isSafeInternalPath(item.path)) return null
  return {
    ...item,
    children: (item.children || []).filter((child) => child.visible !== false && isSafeInternalPath(child.path)),
  }
}

export default function PublicLayout() {
  const [shell, setShell] = useState({ menu: [], globalAction: null, footer: null, contact: null, settings: null })
  const dataVersion = useDataChange(['menu', 'footer', 'contactDetails', 'siteSettings'])

  useEffect(() => {
    let active = true

    Promise.all([
      getSingleton('menu'),
      getSingleton('footer'),
      getSingleton('contactDetails'),
      getSingleton('siteSettings'),
    ]).then(([menu, footer, contact, settings]) => {
      if (!active) return
      const menuItems = menu.success ? menu.data.mainMenu || [] : []
      const publicMenu = menuItems
        .filter((item) => item.visible !== false)
        .sort((left, right) => (left.order || 0) - (right.order || 0))
        .map(safeMenuItem)
        .filter(Boolean)
        .map((item) => ({ ...item, children: item.children.sort((left, right) => (left.order || 0) - (right.order || 0)) }))
      setShell({
        menu: publicMenu,
        globalAction: menu.success && isSafeInternalPath(menu.data.globalAction?.path) ? menu.data.globalAction : null,
        footer: footer.success ? footer.data : null,
        contact: contact.success ? contact.data : null,
        settings: settings.success ? settings.data : null,
      })
    })

    return () => {
      active = false
    }
  }, [dataVersion])

  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <Header menu={shell.menu} globalAction={shell.globalAction} companyName={shell.settings?.siteName || shell.contact?.companyName} />

      {/* pb on small screens keeps the fixed booking bar on trip pages from
          covering the end of the page and the top of the footer. */}
      {/* tabIndex -1 so the skip link actually moves focus here, not just the
          scroll position — Safari and Firefox do not focus a plain <main>. */}
      <main id="main" tabIndex={-1} className="flex-1 pb-24 focus:outline-none lg:pb-0">
        <Outlet />
      </main>

      <Footer footer={shell.footer} contact={shell.contact} companyName={shell.settings?.siteName || shell.contact?.companyName} />
      <WhatsAppButton number={shell.contact?.whatsappEnabled === false ? '' : shell.contact?.whatsapp} />
    </div>
  )
}
