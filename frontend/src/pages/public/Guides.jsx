// The guide team, filtered by language, region, and what they lead.
import GuideCard from '../../components/cards/GuideCard.jsx'
import Button from '../../components/common/Button.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import DemoNotice from '../../components/common/DemoNotice.jsx'
import FilterPanel from '../../components/common/FilterPanel.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import Section from '../../components/common/Section.jsx'
import StaggerGroup from '../../components/motion/StaggerGroup.jsx'
import useCollection from '../../hooks/useCollection.js'
import usePageMeta from '../../hooks/usePageMeta.js'
import useSingleton from '../../hooks/useSingleton.js'
import useUrlFilterState from '../../hooks/useUrlFilterState.js'
import { toPublicGuides } from '../../lib/publicGuide.js'
import { matchesText } from '../../lib/queryList.js'

const TITLE = 'Our guides'
const DESCRIPTION = 'Sample guide profiles for this browser-only demo. Check real guide credentials and availability directly before relying on them.'

const NO_FILTERS = { search: '', language: '', region: '', guideType: '' }

function optionsFrom(items, pick, labels = {}) {
  const values = new Set()
  items.forEach((item) => [].concat(pick(item) || []).forEach((value) => values.add(value)))
  return [...values].sort().map((value) => ({ value, label: labels[value] || value }))
}

export default function Guides() {
  const guides = useCollection('guides', {})
  const languages = useCollection('languages', {})
  const settings = useSingleton('siteSettings')
  const demoMode = settings.data?.demoMode !== false
  const { choice, applyChoice, clear } = useUrlFilterState(NO_FILTERS)

  usePageMeta(demoMode ? 'Sample guides' : TITLE, DESCRIPTION)

  // Projected once, here. Nothing downstream ever sees a raw guide record.
  const team = toPublicGuides(guides.items)
  const languageNames = Object.fromEntries(languages.items.map((row) => [row.code, row.name]))

  const visible = [...team]
    .filter((guide) =>
      matchesText(choice.search, [guide.fullName, guide.guideType, guide.regions, guide.languages]) &&
      (!choice.language || guide.languages.includes(choice.language)) &&
      (!choice.region || guide.regions.includes(choice.region)) &&
      (!choice.guideType || guide.guideType === choice.guideType)
    )
    .sort((left, right) => left.fullName.localeCompare(right.fullName))

  return (
    <>
      <PageHeader title={demoMode ? 'Sample guides' : TITLE} description={DESCRIPTION} />

      <Section>
        <DemoNotice context="evidence" className="mb-6" />
        {guides.status === 'loading' && <LoadingState rows={6} label="Loading guides" />}

        {guides.status === 'error' && (
          <ErrorState
            title="We could not load the guides"
            description="No guide profiles were changed. Try again, or return to the trip list."
            action={
              <Button variant="secondary" onClick={guides.reload}>
                Try again
              </Button>
            }
          />
        )}

        {guides.status === 'ready' && (
          <>
            <FilterPanel
              resultCount={visible.length}
              totalCount={team.length}
              onApply={applyChoice}
              onClear={clear}
              filters={[
                {
                  name: 'search',
                  label: 'Search guides',
                  placeholder: 'Name, region, or guide type',
                  control: 'search',
                  value: choice.search,
                  options: [],
                },
                {
                  name: 'language',
                  label: 'Speaks',
                  anyLabel: 'Any language',
                  value: choice.language,
                  options: optionsFrom(team, (guide) => guide.languages, languageNames),
                },
                {
                  name: 'region',
                  label: 'Region',
                  anyLabel: 'Every region',
                  value: choice.region,
                  options: optionsFrom(team, (guide) => guide.regions),
                },
                {
                  name: 'guideType',
                  label: 'Leads',
                  anyLabel: 'Any kind of trip',
                  value: choice.guideType,
                  options: optionsFrom(team, (guide) => guide.guideType),
                },
              ]}
            />

            <div className="mt-10">
              {visible.length === 0 ? (
                <EmptyState
                  title="No guides match those filters"
                  description={demoMode ? 'Try another language or region, or clear the filters to compare the sample profiles.' : 'Try another language or region, or clear the filters to compare the full team.'}
                  action={
                    <Button variant="secondary" onClick={clear}>
                      Clear all
                    </Button>
                  }
                />
              ) : (
                <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {visible.map((guide) => (
                    <GuideCard key={guide.id} item={guide} languageNames={languageNames} />
                  ))}
                </StaggerGroup>
              )}
            </div>
          </>
        )}
      </Section>
    </>
  )
}
