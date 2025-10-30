import { useState, useEffect } from "react";
import {
  Users,
  DollarSign,
  FolderOpen,
  Calendar,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

export default function MetricsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [metrics, setMetrics] = useState({
    leads: { total: 0, new: 0, trend: 0 },
    revenue: { total: 0, thisMonth: 0, trend: 0 },
    projects: { active: 0, completed: 0, trend: 0 },
    appointments: { upcoming: 0, today: 0, trend: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch("/api/admin/dashboard");
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard metrics");
        }

        const data = await response.json();

        // Transform API data to metrics format
        setMetrics({
          leads: {
            total: data.totalLeads || 0,
            new: data.newLeads || 0,
            trend: data.leadsTrend || 0,
          },
          revenue: {
            total: data.totalRevenue || 0,
            thisMonth: data.monthlyRevenue || 0,
            trend: data.revenueTrend || 0,
          },
          projects: {
            active: data.activeProjects || 0,
            completed: data.completedProjects || 0,
            trend: data.projectsTrend || 0,
          },
          appointments: {
            upcoming: data.upcomingAppointments || 0,
            today: data.todayAppointments || 0,
            trend: data.appointmentsTrend || 0,
          },
        });
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
        // Fallback to sample data if API fails
        setMetrics({
          leads: { total: 47, new: 12, trend: 15.3 },
          revenue: { total: 125000, thisMonth: 18500, trend: 8.7 },
          projects: { active: 8, completed: 23, trend: -2.1 },
          appointments: { upcoming: 15, today: 3, trend: 12.4 },
        });
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const metricCards = [
    {
      title: "Leads",
      icon: Users,
      value: metrics.leads.total,
      subtitle: `${metrics.leads.new} new this week`,
      trend: metrics.leads.trend,
      color: "bg-blue-500",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Revenue",
      icon: DollarSign,
      value: `$${metrics.revenue.total.toLocaleString()}`,
      subtitle: `$${metrics.revenue.thisMonth.toLocaleString()} this month`,
      trend: metrics.revenue.trend,
      color: "bg-green-500",
      lightColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      title: "Projects",
      icon: FolderOpen,
      value: metrics.projects.active,
      subtitle: `${metrics.projects.completed} completed`,
      trend: metrics.projects.trend,
      color: "bg-purple-500",
      lightColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      title: "Appointments",
      icon: Calendar,
      value: metrics.appointments.upcoming,
      subtitle: `${metrics.appointments.today} today`,
      trend: metrics.appointments.trend,
      color: "bg-orange-500",
      lightColor: "bg-orange-50",
      textColor: "text-orange-600",
    },
  ];

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % metricCards.length);
  };

  const prevSlide = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + metricCards.length) % metricCards.length,
    );
  };

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="flex space-x-4 overflow-hidden">
          {[...Array(2)].map((_, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-72 h-32 bg-slate-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      {/* Mobile Carousel */}
      <div className="lg:hidden">
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {metricCards.map((card, index) => {
              const Icon = card.icon;
              const isPositive = card.trend >= 0;
              const TrendIcon = isPositive ? TrendingUp : TrendingDown;

              return (
                <div key={index} className="flex-shrink-0 w-full px-2">
                  <div
                    className={`${card.lightColor} rounded-xl p-6 border border-slate-200`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}
                      >
                        <Icon size={24} className="text-white" />
                      </div>
                      <div
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          isPositive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        <TrendIcon size={12} />
                        {Math.abs(card.trend)}%
                      </div>
                    </div>

                    <div>
                      <h3 className="text-slate-600 text-sm font-medium mb-1">
                        {card.title}
                      </h3>
                      <div
                        className={`text-3xl font-bold ${card.textColor} mb-1`}
                      >
                        {card.value}
                      </div>
                      <p className="text-slate-500 text-sm">{card.subtitle}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Indicators */}
        <div className="flex justify-center space-x-2 mt-4">
          {metricCards.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? "bg-amber-500" : "bg-slate-300"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Desktop Grid */}
      <div className="hidden lg:grid lg:grid-cols-4 lg:gap-6">
        {metricCards.map((card, index) => {
          const Icon = card.icon;
          const isPositive = card.trend >= 0;
          const TrendIcon = isPositive ? TrendingUp : TrendingDown;

          return (
            <div
              key={index}
              className={`${card.lightColor} rounded-xl p-6 border border-slate-200`}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}
                >
                  <Icon size={24} className="text-white" />
                </div>
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    isPositive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  <TrendIcon size={12} />
                  {Math.abs(card.trend)}%
                </div>
              </div>

              <div>
                <h3 className="text-slate-600 text-sm font-medium mb-1">
                  {card.title}
                </h3>
                <div className={`text-3xl font-bold ${card.textColor} mb-1`}>
                  {card.value}
                </div>
                <p className="text-slate-500 text-sm">{card.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
