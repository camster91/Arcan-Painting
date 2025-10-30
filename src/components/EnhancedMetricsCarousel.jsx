import { useState, useEffect } from "react";
import {
  Users,
  DollarSign,
  FolderOpen,
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function EnhancedMetricsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30"); // 7, 30, 90 days

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  // Auto-advance carousel - moved outside conditional rendering
  useEffect(() => {
    if (!loading && dashboardData) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % 4); // Fixed length
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [loading, dashboardData]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/dashboard?range=${timeRange}`);
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const data = await response.json();
      setDashboardData(data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setLoading(false);
    }
  };

  // Generate sample chart data based on metrics
  const generateChartData = (metric, days = 7) => {
    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Generate realistic data variations
      const baseValue = metric || 10;
      const variation = Math.random() * 0.4 + 0.8; // 0.8 to 1.2 multiplier

      data.push({
        name: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        value: Math.round(baseValue * variation),
        fullDate: date.toISOString().split("T")[0],
      });
    }

    return data;
  };

  // Pipeline status data for pie chart
  const getPipelineData = () => {
    if (!dashboardData) return [];

    const { leads } = dashboardData.metrics;
    return [
      { name: "New", value: leads.new, color: "#3B82F6" },
      { name: "Contacted", value: leads.pending, color: "#F59E0B" },
      { name: "Won", value: leads.won, color: "#10B981" },
    ].filter((item) => item.value > 0);
  };

  if (loading || !dashboardData) {
    return (
      <div className="px-4 py-6">
        <div className="flex space-x-4 overflow-hidden">
          {[...Array(2)].map((_, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-full lg:w-80 h-48 bg-slate-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const { metrics } = dashboardData;

  const enhancedMetricCards = [
    {
      title: "Leads Pipeline",
      icon: Users,
      value: metrics.leads.total,
      subtitle: `${metrics.leads.new} new this period`,
      trend: metrics.leads.trend,
      color: "bg-blue-500",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
      chart: "pie",
      chartData: getPipelineData(),
    },
    {
      title: "Revenue Trend",
      icon: DollarSign,
      value: `$${metrics.revenue.total.toLocaleString()}`,
      subtitle: `$${metrics.revenue.recent.toLocaleString()} this period`,
      trend: metrics.revenue.trend,
      color: "bg-green-500",
      lightColor: "bg-green-50",
      textColor: "text-green-600",
      chart: "area",
      chartData: generateChartData(metrics.revenue.recent / 1000, 7),
    },
    {
      title: "Active Projects",
      icon: FolderOpen,
      value: metrics.projects.active,
      subtitle: `${metrics.projects.completed} completed`,
      trend: metrics.projects.trend,
      color: "bg-purple-500",
      lightColor: "bg-purple-50",
      textColor: "text-purple-600",
      chart: "bar",
      chartData: generateChartData(metrics.projects.active, 7),
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
      chart: "line",
      chartData: generateChartData(metrics.appointments.new, 7),
    },
  ];

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % enhancedMetricCards.length);
  };

  const prevSlide = () => {
    setCurrentIndex(
      (prev) =>
        (prev - 1 + enhancedMetricCards.length) % enhancedMetricCards.length,
    );
  };

  const renderChart = (card) => {
    const chartProps = {
      width: "100%",
      height: 60,
      data: card.chartData,
    };

    switch (card.chart) {
      case "area":
        return (
          <ResponsiveContainer {...chartProps}>
            <AreaChart data={card.chartData}>
              <Area
                type="monotone"
                dataKey="value"
                stroke={card.color.replace("bg-", "#")}
                fill={card.color.replace("bg-", "#")}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer {...chartProps}>
            <LineChart data={card.chartData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={card.color.replace("bg-", "#")}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "bar":
        return (
          <ResponsiveContainer {...chartProps}>
            <BarChart data={card.chartData}>
              <Bar
                dataKey="value"
                fill={card.color.replace("bg-", "#")}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <div className="w-full h-16 flex items-center justify-center">
            <ResponsiveContainer width={80} height={60}>
              <PieChart>
                <Pie
                  data={card.chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={15}
                  outerRadius={25}
                  dataKey="value"
                >
                  {card.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="px-4 py-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Business Metrics
        </h2>
        <div className="flex bg-slate-100 rounded-lg p-1">
          {[
            { value: "7", label: "7D" },
            { value: "30", label: "30D" },
            { value: "90", label: "90D" },
          ].map((period) => (
            <button
              key={period.value}
              onClick={() => setTimeRange(period.value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                timeRange === period.value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Carousel */}
      <div className="lg:hidden">
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {enhancedMetricCards.map((card, index) => {
              const Icon = card.icon;
              const isPositive = card.trend >= 0;
              const TrendIcon = isPositive ? TrendingUp : TrendingDown;

              return (
                <div key={index} className="flex-shrink-0 w-full px-2">
                  <div
                    className={`${card.lightColor} rounded-xl p-6 border border-slate-200 h-64`}
                  >
                    {/* Header */}
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
                        {Math.abs(card.trend).toFixed(1)}%
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="mb-4">
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

                    {/* Chart */}
                    <div className="h-16">{renderChart(card)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Enhanced Indicators with Progress */}
        <div className="flex justify-center space-x-2 mt-4">
          {enhancedMetricCards.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`transition-all duration-300 ${
                index === currentIndex
                  ? "w-8 h-2 bg-amber-500 rounded-full"
                  : "w-2 h-2 bg-slate-300 rounded-full hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Desktop Grid with Enhanced Layout */}
      <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-4 lg:gap-6">
        {enhancedMetricCards.map((card, index) => {
          const Icon = card.icon;
          const isPositive = card.trend >= 0;
          const TrendIcon = isPositive ? TrendingUp : TrendingDown;

          return (
            <div
              key={index}
              className={`${card.lightColor} rounded-xl p-6 border border-slate-200 h-64`}
            >
              {/* Header */}
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
                  {Math.abs(card.trend).toFixed(1)}%
                </div>
              </div>

              {/* Metrics */}
              <div className="mb-4">
                <h3 className="text-slate-600 text-sm font-medium mb-1">
                  {card.title}
                </h3>
                <div className={`text-3xl font-bold ${card.textColor} mb-1`}>
                  {card.value}
                </div>
                <p className="text-slate-500 text-sm">{card.subtitle}</p>
              </div>

              {/* Chart */}
              <div className="h-16">{renderChart(card)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
