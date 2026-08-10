// The homepage. Section order and visibility come entirely from the CMS data,
// so the admin website builder can rearrange it later without a code change.
import { useEffect, useState } from 'react'
import Button from '../../components/common/Button.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import Section from '../../components/common/Section.jsx'
import HeroSection from '../../components/sections/HeroSection.jsx'
import QuickExplore from '../../components/sections/QuickExplore.jsx'
import HOME_SECTIONS from '../../config/homeSections.jsx'
import useCollection from '../../hooks/useCollection.js'
import usePageMeta from '../../hooks/usePageMeta.js'
import { getSingleton } from '../../lib/dataClient.js'
import HomeSkeleton from './HomeSkeleton.jsx'

export default function Home() {
  const [page, setPage] = useState({ status: 'loading', data: null })

  usePageMeta(
    'Himalayan treks, peak climbs and cultural journeys',
    page.data?.hero?.subheadline
  )

  // Guide and review cards show language and country names, which live in
  // their own collections. Loading them once here avoids repeat calls.
  const languages = useCollection('languages')
  const countries = useCollection('countries')

  useEffect(() => {
    let active = true
    getSingleton('cmsHomepage').then((result) => {
      if (!active) return
      setPage({ status: result.success ? 'ready' : 'error', data: result.data })
    })
    return () => {
      active = false
    }
  }, [])

  if (page.status === 'loading') return <HomeSkeleton />

  if (page.status === 'error') {
    return (
      <Section width="narrow">
        <ErrorState
          title="We could not load the homepage"
          description="Something went wrong on our side. Please try again in a moment."
          action={<Button onClick={() => window.location.reload()}>Reload the page</Button>}
        />
      </Section>
    )
  }

  const lookups = {
    languageNames: Object.fromEntries(languages.items.map((row) => [row.code, row.name])),
    countryNames: Object.fromEntries(
      countries.items.map((row) => [row.countryCode, row.countryName])
    ),
  }

  // An unknown key is skipped rather than crashing the page.
  const sections = [...page.data.sections]
    .filter((section) => section.visible && HOME_SECTIONS[section.key])
    .sort((a, b) => a.order - b.order)

  return (
    <>
      <HeroSection hero={page.data.hero} />
      <QuickExplore content={page.data.quickExplore} />

      {sections.map((section) => {
        const SectionComponent = HOME_SECTIONS[section.key]
        return <SectionComponent key={section.key} section={section} lookups={lookups} />
      })}
    </>
  )
}
