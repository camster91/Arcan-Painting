import { useState, useEffect } from "react";
import {
  TrendingUp,
  Target,
  DollarSign,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function PerformanceMetrics() {
  const [metricsData, setMetricsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("30"); // 7, 30, 90 days
  const [activeTab, setActiveTab] = useState("overview"); // overview, revenue, conversion

  useEffect(() => {
    fetchPerformanceData();
  }, [selectedPeriod]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);

      // Simulate API call with enhanced metrics
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockData = {
        overview: {
          totalRevenue: 89500,
          revenueGrowth: 12.5,
          leadConversion: 24.8,
          conversionGrowth: 3.2,
          avgProjectValue: 4250,
          projectValueGrowth: -2.1,
          customerSatisfaction: 4.8,
          satisfactionGrowth: 0.3,
        },

        monthlyRevenue: [
          { month: "Jan", revenue: 65000, leads: 45, projects: 12 },
          { month: "Feb", revenue: 72000, leads: 52, projects: 14 },
          { month: "Mar", revenue: 68000, leads: 48, projects: 13 },
          { month: "Apr", revenue: 75000, leads: 58, projects: 16 },
          { month: "May", revenue: 82000, leads: 62, projects: 18 },
          { month: "Jun", revenue: 89500, leads: 67, projects: 21 },
        ],

        conversionFunnel: [
          { stage: "Leads", value: 150, percentage: 100 },
          { stage: "Contacted", value: 120, percentage: 80 },
          { stage: "Estimate Sent", value: 85, percentage: 57 },
          { stage: "Estimate Approved", value: 45, percentage: 30 },
          { stage: "Project Completed", value: 37, percentage: 25 },
        ],

        serviceBreakdown: [
          { name: "Interior Painting", value: 45, color: "#3B82F6" },
          { name: "Exterior Painting", value: 30, color: "#10B981" },
          { name: "Cabinet Refinishing", value: 15, color: "#F59E0B" },
          { name: "Deck Staining", value: 10, color: "#8B5CF6" },
        ],

        weeklyTrends: [
          { week: "W1", newLeads: 12, appointments: 8, estimates: 5 },
          { week: "W2", newLeads: 15, appointments: 11, estimates: 7 },
          { week: "W3", newLeads: 18, appointments: 13, estimates: 9 },
          { week: "W4", newLeads: 22, appointments: 16, estimates: 12 },
        ],
      };

      setMetricsData(mockData);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch performance data:", error);
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value, showSign = true) => {
    const sign = value >= 0 ? "+" : "";
    return `${showSign ? sign : ""}${value.toFixed(1)}%`;
  };

  const MetricCard = ({
    title,
    value,
    change,
    changeType = "percentage",
    icon: Icon,
    color = "blue",
  }) => {
    const isPositive = change >= 0;
    const colorClasses = {
      blue: "bg-blue-500 text-white",
      green: "bg-green-500 text-white",
      amber: "bg-amber-500 text-white",
      purple: "bg-purple-500 text-white",
    };

    return (
      <div className="bg-white p-6 rounded-lg border border-slate-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
            <div className="text-2xl font-bold text-slate-900 mb-2">
              {typeof value === "number" && title.includes("Revenue")
                ? formatCurrency(value)
                : value}
            </div>
            <div
              className={`flex items-center text-sm ${
                isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {isPositive ? (
                <ArrowUpRight size={16} />
              ) : (
                <ArrowDownRight size={16} />
              )}
              <span className="ml-1">
                {changeType === "percentage"
                  ? formatPercentage(change)
                  : change}
              </span>
              <span className="ml-1 text-slate-500">vs last period</span>
            </div>
          </div>
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}
          >
            <Icon size={24} />
          </div>
        </div>
      </div>
    );
  };

  if (loading || !metricsData) {
    return (
      <div className="px-4 py-6">
        <div className="space-y-6">
          <div className="h-8 bg-slate-200 rounded w-64 animate-pulse"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="h-32 bg-slate-200 rounded-lg animate-pulse"
              ></div>
            ))}
          </div>
          <div className="h-64 bg-slate-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Performance Metrics
          </h2>
          <p className="text-slate-600">Business insights and trends</p>
        </div>

        {/* Period Selector */}
        <div className="flex bg-slate-100 rounded-lg p-1">
          {[
            { value: "7", label: "7D" },
            { value: "30", label: "30D" },
            { value: "90", label: "90D" },
          ].map((period) => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === period.value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8 px-6">
        <MetricCard
          title="Total Revenue"
          value={metricsData.overview.totalRevenue}
          change={metricsData.overview.revenueGrowth}
          icon={DollarSign}
          color="green"
        />
        <MetricCard
          title="Lead Conversion"
          value={`${metricsData.overview.leadConversion}%`}
          change={metricsData.overview.conversionGrowth}
          icon={Target}
          color="blue"
        />
        <MetricCard
          title="Avg Project Value"
          value={metricsData.overview.avgProjectValue}
          change={metricsData.overview.projectValueGrowth}
          icon={BarChart3}
          color="purple"
        />
        <MetricCard
          title="Customer Rating"
          value={`${metricsData.overview.customerSatisfaction}/5`}
          change={metricsData.overview.satisfactionGrowth}
          icon={CheckCircle}
          color="amber"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 mb-6 px-6">
        {[
          { key: "overview", label: "Revenue Overview" },
          { key: "conversion", label: "Conversion Funnel" },
          { key: "services", label: "Service Breakdown" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chart Content */}
      <div className="space-y-6 px-6">
        {activeTab === "overview" && (
          <>
            {/* Revenue Trend Chart */}
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Monthly Revenue Trend
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metricsData.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                    <Tooltip
                      formatter={(value) => [formatCurrency(value), "Revenue"]}
                      labelStyle={{ color: "#374151" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.2}
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekly Activity Trends */}
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Weekly Activity Trends
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metricsData.weeklyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="newLeads"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      name="New Leads"
                    />
                    <Line
                      type="monotone"
                      dataKey="appointments"
                      stroke="#10B981"
                      strokeWidth={2}
                      name="Appointments"
                    />
                    <Line
                      type="monotone"
                      dataKey="estimates"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      name="Estimates"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {activeTab === "conversion" && (
          <div className="bg-white p-6 rounded-lg border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Sales Conversion Funnel
            </h3>
            <div className="space-y-4">
              {metricsData.conversionFunnel.map((stage, index) => (
                <div key={stage.stage} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">
                      {stage.stage}
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900">
                        {stage.value}
                      </span>
                      <span className="text-xs text-slate-500 ml-2">
                        ({stage.percentage}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${stage.percentage}%` }}
                    ></div>
                  </div>
                  {index < metricsData.conversionFunnel.length - 1 && (
                    <div className="flex justify-center mt-2">
                      <ArrowDownRight className="text-slate-400" size={20} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "services" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service Distribution Pie Chart */}
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Service Distribution
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metricsData.serviceBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {metricsData.serviceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Service Performance List */}
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Service Performance
              </h3>
              <div className="space-y-4">
                {metricsData.serviceBreakdown.map((service, index) => (
                  <div
                    key={service.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: service.color }}
                      ></div>
                      <span className="text-sm font-medium text-slate-700">
                        {service.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900">
                        {service.value}%
                      </div>
                      <div className="text-xs text-slate-500">
                        of total revenue
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
