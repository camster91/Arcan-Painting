import { useState, useEffect, useRef } from "react";
import {
  Search,
  Filter,
  X,
  ChevronDown,
  Calendar,
  DollarSign,
  MapPin,
  User,
  Tag,
  SortAsc,
  SortDesc,
  RotateCcw,
} from "lucide-react";

export default function MobileSearchFilter({
  searchTerm,
  onSearchChange,
  filters = {},
  onFiltersChange,
  sortBy,
  onSortChange,
  onClearAll,
  placeholder = "Search leads...",
  showFilters = true,
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState("status");
  const searchInputRef = useRef(null);

  // Filter options
  const filterTabs = [
    {
      key: "status",
      label: "Status",
      icon: Tag,
      options: [
        { value: "new", label: "New", color: "bg-blue-100 text-blue-700" },
        {
          value: "contacted",
          label: "Contacted",
          color: "bg-yellow-100 text-yellow-700",
        },
        {
          value: "estimate_scheduled",
          label: "Estimate Scheduled",
          color: "bg-purple-100 text-purple-700",
        },
        {
          value: "estimate_sent",
          label: "Estimate Sent",
          color: "bg-orange-100 text-orange-700",
        },
        {
          value: "follow_up",
          label: "Follow Up",
          color: "bg-amber-100 text-amber-700",
        },
        { value: "won", label: "Won", color: "bg-green-100 text-green-700" },
        { value: "lost", label: "Lost", color: "bg-red-100 text-red-700" },
      ],
    },
    {
      key: "service",
      label: "Service",
      icon: User,
      options: [
        { value: "interior_painting", label: "Interior Painting" },
        { value: "exterior_painting", label: "Exterior Painting" },
        { value: "cabinet_refinishing", label: "Cabinet Refinishing" },
        { value: "deck_staining", label: "Deck Staining" },
        { value: "pressure_washing", label: "Pressure Washing" },
        { value: "wallpaper_removal", label: "Wallpaper Removal" },
      ],
    },
    {
      key: "value",
      label: "Project Value",
      icon: DollarSign,
      options: [
        { value: "0-1000", label: "Under $1,000" },
        { value: "1000-5000", label: "$1,000 - $5,000" },
        { value: "5000-10000", label: "$5,000 - $10,000" },
        { value: "10000-25000", label: "$10,000 - $25,000" },
        { value: "25000+", label: "Over $25,000" },
      ],
    },
    {
      key: "date",
      label: "Date Range",
      icon: Calendar,
      options: [
        { value: "today", label: "Today" },
        { value: "week", label: "This Week" },
        { value: "month", label: "This Month" },
        { value: "quarter", label: "This Quarter" },
        { value: "custom", label: "Custom Range" },
      ],
    },
  ];

  const sortOptions = [
    { value: "created_desc", label: "Newest First", icon: SortDesc },
    { value: "created_asc", label: "Oldest First", icon: SortAsc },
    { value: "name_asc", label: "Name A-Z", icon: SortAsc },
    { value: "name_desc", label: "Name Z-A", icon: SortDesc },
    { value: "value_desc", label: "Highest Value", icon: SortDesc },
    { value: "value_asc", label: "Lowest Value", icon: SortAsc },
  ];

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    Object.keys(filters).forEach((key) => {
      if (filters[key] && filters[key].length > 0) {
        count += Array.isArray(filters[key]) ? filters[key].length : 1;
      }
    });
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  // Handle filter changes
  const handleFilterChange = (category, value, checked) => {
    const currentFilters = filters[category] || [];
    let newFilters;

    if (checked) {
      newFilters = [...currentFilters, value];
    } else {
      newFilters = currentFilters.filter((f) => f !== value);
    }

    onFiltersChange({
      ...filters,
      [category]: newFilters,
    });
  };

  // Clear all filters
  const handleClearAll = () => {
    onFiltersChange({});
    onSearchChange("");
    setIsFilterOpen(false);
    onClearAll?.();
  };

  // Focus search input
  const focusSearch = () => {
    searchInputRef.current?.focus();
  };

  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>

          <input
            ref={searchInputRef}
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-20 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-900 placeholder-slate-500"
          />

          {/* Search Actions */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            {searchTerm && (
              <button
                onClick={() => onSearchChange("")}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X size={16} />
              </button>
            )}

            {showFilters && (
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`ml-2 p-2 rounded-lg transition-colors relative ${
                  isFilterOpen || activeFilterCount > 0
                    ? "bg-amber-100 text-amber-700"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Filter size={18} />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Summary */}
        {activeFilterCount > 0 && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-600">Active filters:</span>
            {Object.entries(filters).map(([category, values]) =>
              Array.isArray(values) && values.length > 0
                ? values.map((value) => (
                    <span
                      key={`${category}-${value}`}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium"
                    >
                      {value.replace("_", " ")}
                      <button
                        onClick={() =>
                          handleFilterChange(category, value, false)
                        }
                        className="hover:bg-amber-200 rounded-full p-0.5"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))
                : null,
            )}
            <button
              onClick={handleClearAll}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              <RotateCcw size={10} />
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Filter Panel */}
      {isFilterOpen && (
        <div className="border-t border-slate-200 bg-slate-50">
          {/* Filter Tabs */}
          <div className="flex overflow-x-auto border-b border-slate-200">
            {filterTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilterTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeFilterTab === tab.key
                      ? "border-amber-500 text-amber-600 bg-white"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Filter Content */}
          <div className="p-4 max-h-60 overflow-y-auto">
            {activeFilterTab === "status" && (
              <div className="space-y-2">
                {filterTabs[0].options.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.status?.includes(option.value) || false}
                      onChange={(e) =>
                        handleFilterChange(
                          "status",
                          option.value,
                          e.target.checked,
                        )
                      }
                      className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
                    />
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${option.color || "bg-slate-100 text-slate-700"}`}
                    >
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {activeFilterTab === "service" && (
              <div className="space-y-2">
                {filterTabs[1].options.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.service?.includes(option.value) || false}
                      onChange={(e) =>
                        handleFilterChange(
                          "service",
                          option.value,
                          e.target.checked,
                        )
                      }
                      className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm text-slate-700">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {activeFilterTab === "value" && (
              <div className="space-y-2">
                {filterTabs[2].options.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="value_range"
                      checked={filters.value?.includes(option.value) || false}
                      onChange={(e) =>
                        handleFilterChange(
                          "value",
                          option.value,
                          e.target.checked,
                        )
                      }
                      className="w-4 h-4 text-amber-600 border-slate-300 focus:ring-amber-500"
                    />
                    <span className="text-sm text-slate-700">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {activeFilterTab === "date" && (
              <div className="space-y-2">
                {filterTabs[3].options.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="date_range"
                      checked={filters.date?.includes(option.value) || false}
                      onChange={(e) =>
                        handleFilterChange(
                          "date",
                          option.value,
                          e.target.checked,
                        )
                      }
                      className="w-4 h-4 text-amber-600 border-slate-300 focus:ring-amber-500"
                    />
                    <span className="text-sm text-slate-700">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Sort Options */}
          <div className="border-t border-slate-200 p-4">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Sort by</h4>
            <div className="grid grid-cols-2 gap-2">
              {sortOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => onSortChange(option.value)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-sm transition-colors ${
                      sortBy === option.value
                        ? "bg-amber-100 text-amber-700 border border-amber-200"
                        : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                    }`}
                  >
                    <Icon size={14} />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter Actions */}
          <div className="border-t border-slate-200 p-4 flex gap-3">
            <button
              onClick={handleClearAll}
              className="flex-1 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw size={14} />
              Clear All
            </button>
            <button
              onClick={() => setIsFilterOpen(false)}
              className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
