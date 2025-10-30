export function PrepWorkForm({
  tapeLf,
  setTapeLf,
  plasticSqft,
  setPlasticSqft,
  minorPatches,
  setMinorPatches,
  majorPatchSqft,
  setMajorPatchSqft,
  caulkLf,
  setCaulkLf,
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Prep Work</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Tape (Linear Feet)
          </label>
          <input
            type="number"
            value={tapeLf}
            onChange={(e) => setTapeLf(e.target.value)}
            placeholder="200"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Plastic Sheeting (Sq Ft)
          </label>
          <input
            type="number"
            value={plasticSqft}
            onChange={(e) => setPlasticSqft(e.target.value)}
            placeholder="300"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Minor Patches (Count)
          </label>
          <input
            type="number"
            value={minorPatches}
            onChange={(e) => setMinorPatches(e.target.value)}
            placeholder="8"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Major Patch (Sq Ft)
          </label>
          <input
            type="number"
            value={majorPatchSqft}
            onChange={(e) => setMajorPatchSqft(e.target.value)}
            placeholder="15"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Caulk (Linear Feet)
          </label>
          <input
            type="number"
            value={caulkLf}
            onChange={(e) => setCaulkLf(e.target.value)}
            placeholder="50"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
      </div>
    </div>
  );
}
