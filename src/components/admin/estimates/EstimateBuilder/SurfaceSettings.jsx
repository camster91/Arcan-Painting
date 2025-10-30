export function SurfaceSettings({ area, onUpdate }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      {/* Walls */}
      <div className="border border-slate-200 rounded-lg p-3">
        <h4 className="font-medium text-slate-900 mb-3">Walls</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Method
            </label>
            <select
              value={area.wallsMethod}
              onChange={(e) =>
                onUpdate(area.id, {
                  wallsMethod: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="roll">Roll & Brush</option>
              <option value="spray">Spray</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Coats
              </label>
              <select
                value={area.wallsCoats}
                onChange={(e) =>
                  onUpdate(area.id, {
                    wallsCoats: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={area.wallsPrimer}
                  onChange={(e) =>
                    onUpdate(area.id, {
                      wallsPrimer: e.target.checked,
                    })
                  }
                  className="form-checkbox h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-slate-700">Primer</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Ceiling */}
      <div className="border border-slate-200 rounded-lg p-3">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-slate-900">Ceiling</h4>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={area.paintCeiling}
              onChange={(e) =>
                onUpdate(area.id, {
                  paintCeiling: e.target.checked,
                })
              }
              className="form-checkbox h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-slate-700">Paint Ceiling</span>
          </label>
        </div>

        {area.paintCeiling ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Method
              </label>
              <select
                value={area.ceilMethod}
                onChange={(e) =>
                  onUpdate(area.id, {
                    ceilMethod: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="roll">Roll & Brush</option>
                <option value="spray">Spray</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Coats
                </label>
                <select
                  value={area.ceilCoats}
                  onChange={(e) =>
                    onUpdate(area.id, {
                      ceilCoats: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={area.ceilPrimer}
                    onChange={(e) =>
                      onUpdate(area.id, {
                        ceilPrimer: e.target.checked,
                      })
                    }
                    className="form-checkbox h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-slate-700">Primer</span>
                </label>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-slate-500">
              No ceiling painting selected
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
