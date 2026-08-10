// Renders the approved logo at its natural ratio in each application shell.
import { BRAND_ASSETS, SITE_NAME } from '../../config/siteIdentity.js'

export default function BrandLogo({ className = '', alt = SITE_NAME }) {
  const logo = BRAND_ASSETS.primary

  return (
    <img
      src={logo.src}
      width={logo.width}
      height={logo.height}
      alt={alt}
      decoding="async"
      className={`h-14 w-auto object-contain ${className}`.trim()}
    />
  )
}
