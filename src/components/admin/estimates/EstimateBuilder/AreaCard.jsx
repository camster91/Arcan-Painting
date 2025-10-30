import { Trash2 } from "lucide-react";
import { SurfaceSettings } from "./SurfaceSettings";
import { PrepWorkForm } from "./PrepWorkForm";

export function AreaCard({
  area,
  canRemove,
  onRemove,
  onUpdate,
  onUpdatePrepWork,
  areaTotals,
}) {
  return (
    <div className="border border-slate-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <input
          type="text"
          value={area.name}
          onChange={(e) => onUpdate(area.id, { name: e.target.value })}
          className="text-lg font-medium bg-transparent border-0 focus:ring-0 p-0 text-slate-900"
        />
        {canRemove && (
          <button
            onClick={() => onRemove(area.id)}
            className="p-2 text-slate-400 hover:text-red-600 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Dimensions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Length (ft)
          </label>
          <input
            type="number"
            value={area.length}
            onChange={(e) => onUpdate(area.id, { length: e.target.value })}
            placeholder="20"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Width (ft)
          </label>
          <input
            type="number"
            value={area.width}
            onChange={(e) => onUpdate(area.id, { width: e.target.value })}
            placeholder="15"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Height (ft)
          </label>
          <input
            type="number"
            value={area.height}
            onChange={(e) => onUpdate(area.id, { height: e.target.value })}
            placeholder="8"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
      </div>

      {/* Surface Settings */}
      <SurfaceSettings area={area} onUpdate={onUpdate} />

      {/* Trim & Doors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Trim (Linear Feet)
          </label>
          <input
            type="number"
            value={area.trimLf}
            onChange={(e) => onUpdate(area.id, { trimLf: e.target.value })}
            placeholder="100"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Number of Doors
          </label>
          <input
            type="number"
            value={area.doorsCount}
            onChange={(e) => onUpdate(area.id, { doorsCount: e.target.value })}
            placeholder="4"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
      </div>

      {/* Prep Work */}
      <PrepWorkForm
        prepWork={area.prepWork}
        onUpdate={(prepUpdates) => onUpdatePrepWork(area.id, prepUpdates)}
      />

      {/* Area Summary */}
      <div className="mt-4 p-3 bg-slate-50 rounded-lg">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600">Area Total:</span>
          <span className="font-medium text-slate-900">
            ${areaTotals.total.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
