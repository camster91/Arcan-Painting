"use client";

import { useEstimateCalculator } from "@/hooks/useEstimateCalculator";
import { PageHeader } from "@/components/admin/estimates/calculator/PageHeader";
import { ClientInformationForm } from "@/components/admin/estimates/calculator/ClientInformationForm";
import { RoomDimensionsForm } from "@/components/admin/estimates/calculator/RoomDimensionsForm";
import { SurfaceSettingsForm } from "@/components/admin/estimates/calculator/SurfaceSettingsForm";
import { PrepWorkForm } from "@/components/admin/estimates/calculator/PrepWorkForm";
import { SettingsPricingForm } from "@/components/admin/estimates/calculator/SettingsPricingForm";
import { EstimateSummary } from "@/components/admin/estimates/calculator/EstimateSummary";

export default function EstimateCalculatorPage() {
  const calculator = useEstimateCalculator();

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Forms */}
          <div className="lg:col-span-2 space-y-6">
            <ClientInformationForm
              clientName={calculator.clientName}
              setClientName={calculator.setClientName}
              clientEmail={calculator.clientEmail}
              setClientEmail={calculator.setClientEmail}
              clientPhone={calculator.clientPhone}
              setClientPhone={calculator.setClientPhone}
              address={calculator.address}
              setAddress={calculator.setAddress}
              projectTitle={calculator.projectTitle}
              setProjectTitle={calculator.setProjectTitle}
            />

            <RoomDimensionsForm
              areaName={calculator.areaName}
              setAreaName={calculator.setAreaName}
              length={calculator.length}
              setLength={calculator.setLength}
              width={calculator.width}
              setWidth={calculator.setWidth}
              height={calculator.height}
              setHeight={calculator.setHeight}
            />

            <SurfaceSettingsForm
              wallsMethod={calculator.wallsMethod}
              setWallsMethod={calculator.setWallsMethod}
              wallsCoats={calculator.wallsCoats}
              setWallsCoats={calculator.setWallsCoats}
              wallsPrimer={calculator.wallsPrimer}
              setWallsPrimer={calculator.setWallsPrimer}
              ceilMethod={calculator.ceilMethod}
              setCeilMethod={calculator.setCeilMethod}
              ceilCoats={calculator.ceilCoats}
              setCeilCoats={calculator.setCeilCoats}
              ceilPrimer={calculator.ceilPrimer}
              setCeilPrimer={calculator.setCeilPrimer}
              trimLf={calculator.trimLf}
              setTrimLf={calculator.setTrimLf}
              doorsCount={calculator.doorsCount}
              setDoorsCount={calculator.setDoorsCount}
            />

            <PrepWorkForm
              tapeLf={calculator.tapeLf}
              setTapeLf={calculator.setTapeLf}
              plasticSqft={calculator.plasticSqft}
              setPlasticSqft={calculator.setPlasticSqft}
              minorPatches={calculator.minorPatches}
              setMinorPatches={calculator.setMinorPatches}
              majorPatchSqft={calculator.majorPatchSqft}
              setMajorPatchSqft={calculator.setMajorPatchSqft}
              caulkLf={calculator.caulkLf}
              setCaulkLf={calculator.setCaulkLf}
            />

            <SettingsPricingForm
              hourlyCost={calculator.hourlyCost}
              setHourlyCost={calculator.setHourlyCost}
              markupPct={calculator.markupPct}
              setMarkupPct={calculator.setMarkupPct}
              taxRate={calculator.taxRate}
              setTaxRate={calculator.setTaxRate}
            />
          </div>

          {/* Live Summary */}
          <div className="lg:col-span-1">
            <EstimateSummary
              length={calculator.length}
              width={calculator.width}
              height={calculator.height}
              hourlyCost={calculator.hourlyCost}
              finishPaintCost={calculator.finishPaintCost}
              markupPct={calculator.markupPct}
              taxRate={calculator.taxRate}
              error={calculator.error}
              notification={calculator.notification}
              onSave={calculator.onSave}
              isLoading={calculator.isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
