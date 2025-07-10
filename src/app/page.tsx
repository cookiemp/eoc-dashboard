import Header from "@/components/dashboard/header";
import IncidentMap from "@/components/dashboard/incident-map";
import AiSummary from "@/components/dashboard/ai-summary";
import WeatherAlerts from "@/components/dashboard/weather-alerts";
import NewsFeed from "@/components/dashboard/news-feed";
import HealthAlerts from "@/components/dashboard/health-alerts";
import { humanitarianNews, generalNews } from "@/lib/mock-data";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-4">
          <div className="lg:col-span-4">
            <IncidentMap />
          </div>
          <div className="lg:col-span-2">
            <AiSummary articles={humanitarianNews} />
          </div>
          <div className="lg:col-span-2">
            <WeatherAlerts />
          </div>
          <div className="lg:col-span-2">
            <NewsFeed title="Humanitarian News" items={humanitarianNews} />
          </div>
          <div className="lg:col-span-2">
            <NewsFeed title="Ethiopia News" items={generalNews} />
          </div>
          <div className="lg:col-span-4">
            <HealthAlerts />
          </div>
        </div>
      </main>
    </div>
  );
}
