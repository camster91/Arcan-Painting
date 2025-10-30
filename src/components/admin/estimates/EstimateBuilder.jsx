"use client";

import { useEstimateBuilder } from "@/hooks/useEstimateBuilder";
import {
  calculateAreaTotals,
  calculateTotals,
} from "@/utils/estimateBuilderCalculations";
import { saveEstimate } from "@/utils/estimateBuilderApi";
import { BuilderHeader } from "./EstimateBuilder/BuilderHeader";
import { ClientInformation } from "./EstimateBuilder/ClientInformation";
import { AreasSection } from "./EstimateBuilder/AreasSection";
import { PricingSettings } from "./EstimateBuilder/PricingSettings";
import { EstimateSummary } from "./EstimateBuilder/EstimateSummary";

export function EstimateBuilder({
  editingEstimate,
  onEstimateCreated,
  onEstimateUpdated,
  onCancel,
}) {
  const {
    clientName,
    setClientName,
    clientEmail,
    setClientEmail,
    clientPhone,
    setClientPhone,
    address,
    setAddress,
    projectTitle,
    setProjectTitle,
    projectDescription,
    setProjectDescription,
    taxRate,
    setTaxRate,
    hourlyRate,
    setHourlyRate,
    markupPct,
    setMarkupPct,
    areas,
    addArea,
    removeArea,
    updateArea,
    updatePrepWork,
    error,
    setError,
    isLoading,
    setIsLoading,
  } = useEstimateBuilder(editingEstimate);

  const totals = calculateTotals(areas, hourlyRate, markupPct, taxRate);

  const handleCalculateAreaTotals = (area) => {
    return calculateAreaTotals(area, hourlyRate);
  };

  const handleSave = async () => {
    setError("");
    setIsLoading(true);

    try {
      await saveEstimate({
        editingEstimate,
        clientName,
        clientEmail,
        clientPhone,
        address,
        projectTitle,
        projectDescription,
        areas,
        taxRate,
        hourlyRate,
        markupPct,
        onEstimateCreated,
        onEstimateUpdated,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Form Area */}
        <div className="xl:col-span-3 space-y-6">
          <BuilderHeader
            editingEstimate={editingEstimate}
            onCancel={onCancel}
          />

          <ClientInformation
            clientName={clientName}
            setClientName={setClientName}
            clientEmail={clientEmail}
            setClientEmail={setClientEmail}
            clientPhone={clientPhone}
            setClientPhone={setClientPhone}
            address={address}
            setAddress={setAddress}
            projectTitle={projectTitle}
            setProjectTitle={setProjectTitle}
            projectDescription={projectDescription}
            setProjectDescription={setProjectDescription}
          />

          <AreasSection
            areas={areas}
            onAddArea={addArea}
            onRemoveArea={removeArea}
            onUpdateArea={updateArea}
            onUpdatePrepWork={updatePrepWork}
            calculateAreaTotals={handleCalculateAreaTotals}
          />

          <PricingSettings
            hourlyRate={hourlyRate}
            setHourlyRate={setHourlyRate}
            markupPct={markupPct}
            setMarkupPct={setMarkupPct}
            taxRate={taxRate}
            setTaxRate={setTaxRate}
          />
        </div>

        {/* Summary Sidebar */}
        <div className="xl:col-span-1">
          <EstimateSummary
            totals={totals}
            markupPct={markupPct}
            taxRate={taxRate}
            error={error}
            isLoading={isLoading}
            editingEstimate={editingEstimate}
            onSave={handleSave}
          />
        </div>
      </div>
    </div>
  );
}
