export function SurfaceSettingsForm({
  wallsMethod,
  setWallsMethod,
  wallsCoats,
  setWallsCoats,
  wallsPrimer,
  setWallsPrimer,
  ceilMethod,
  setCeilMethod,
  ceilCoats,
  setCeilCoats,
  ceilPrimer,
  setCeilPrimer,
  trimLf,
  setTrimLf,
  doorsCount,
  setDoorsCount,
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Surface Settings
      </h3>

      {/* Walls */}
      <div className="border border-slate-200 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-slate-900 mb-3">Walls</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Method
            </label>
            <select
              value={wallsMethod}
              onChange={(e) => setWallsMethod(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="roll">Roll & Brush</option>
              <option value="spray">Spray</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Coats
            </label>
            <select
              value={wallsCoats}
              onChange={(e) => setWallsCoats(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="1">1 Coat</option>
              <option value="2">2 Coats</option>
              <option value="3">3 Coats</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Primer Required
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={wallsPrimer}
                onChange={(e) => setWallsPrimer(e.target.checked)}
                className="form-checkbox h-5 w-5 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-slate-700">Yes</span>
            </label>
          </div>
        </div>
      </div>

      {/* Ceiling */}
      <div className="border border-slate-200 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-slate-900 mb-3">Ceiling</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Method
            </label>
            <select
              value={ceilMethod}
              onChange={(e) => setCeilMethod(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="roll">Roll & Brush</option>
              <option value="spray">Spray</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Coats
            </label>
            <select
              value={ceilCoats}
              onChange={(e) => setCeilCoats(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="1">1 Coat</option>
              <option value="2">2 Coats</option>
              <option value="3">3 Coats</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Primer Required
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={ceilPrimer}
                onChange={(e) => setCeilPrimer(e.target.checked)}
                className="form-checkbox h-5 w-5 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-slate-700">Yes</span>
            </label>
          </div>
        </div>
      </div>

      {/* Trim & Doors */}
      <div className="border border-slate-200 rounded-lg p-4">
        <h4 className="font-medium text-slate-900 mb-3">Trim & Doors</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Trim (Linear Feet)
            </label>
            <input
              type="number"
              value={trimLf}
              onChange={(e) => setTrimLf(e.target.value)}
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
              value={doorsCount}
              onChange={(e) => setDoorsCount(e.target.value)}
              placeholder="4"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
