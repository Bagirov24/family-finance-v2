import { AnalyticsTrendSection } from './_TrendSection'
import { AnalyticsWeekdaySection } from './_WeekdaySection'
import { AnalyticsPieSection } from './_PieCategorySection'
import { AnalyticsCashbackSection } from './_CashbackSection'

export default function AnalyticsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <AnalyticsTrendSection />
      <AnalyticsPieSection />
      <AnalyticsWeekdaySection />
      <AnalyticsCashbackSection />
    </div>
  )
}
