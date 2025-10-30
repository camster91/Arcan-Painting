import { Plus } from "lucide-react";
import { AreaCard } from "./AreaCard";

export function AreasSection({
  areas,
  onAddArea,
  onRemoveArea,
  onUpdateArea,
  onUpdatePrepWork,
  calculateAreaTotals,
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Rooms & Areas ({areas.length})
        </h3>
        <button
          onClick={onAddArea}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
        >
          <Plus size={16} />
          Add Room
        </button>
      </div>

      <div className="space-y-6">
        {areas.map((area) => (
          <AreaCard
            key={area.id}
            area={area}
            canRemove={areas.length > 1}
            onRemove={onRemoveArea}
            onUpdate={onUpdateArea}
            onUpdatePrepWork={onUpdatePrepWork}
            areaTotals={calculateAreaTotals(area)}
          />
        ))}
      </div>
    </div>
  );
}
