// Preview scaffolding: approved mark placement and its safe surfaces.
import { BRAND_ASSETS, SITE_NAME } from '../../config/siteIdentity.js'
import BrandLogo from '../../components/layout/BrandLogo.jsx'
import Card from '../../components/common/Card.jsx'

export default function BrandPreview() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card padding="lg">
        <p className="text-small font-mono text-stone-500">Primary logo</p>
        <div className="mt-4 flex min-h-28 items-center rounded-md bg-white p-4 ring-1 ring-stone-200">
          <BrandLogo />
        </div>
        <p className="mt-4 text-small text-stone-600">
          Approved light-background raster lockup. It keeps its {BRAND_ASSETS.primary.width}:{BRAND_ASSETS.primary.height} source ratio.
        </p>
      </Card>

      <Card padding="lg">
        <p className="text-small font-mono text-stone-500">Dark-surface treatment</p>
        <div className="mt-4 flex min-h-28 items-center rounded-md bg-primary-900 p-4">
          <span className="rounded-md bg-white px-2 py-1">
            <BrandLogo alt={`${SITE_NAME} logo on a light surface`} />
          </span>
        </div>
        <p className="mt-4 text-small text-stone-600">
          There is no recoloured white source file. The approved mark sits on white whenever the surrounding surface is dark.
        </p>
      </Card>

      <Card padding="lg" className="lg:col-span-2">
        <p className="text-small font-mono text-stone-500">Icon and favicon crop</p>
        <div className="mt-4 flex items-center gap-4">
          <img
            src={BRAND_ASSETS.icon.src}
            width={BRAND_ASSETS.icon.width}
            height={BRAND_ASSETS.icon.height}
            alt={`${SITE_NAME} mountain mark`}
            className="h-16 w-16 rounded-md object-contain ring-1 ring-stone-200"
          />
          <p className="text-small text-stone-600">A square crop of the supplied mark, used only at favicon scale.</p>
        </div>
      </Card>
    </div>
  )
}

