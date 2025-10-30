export function PrepWorkForm({ prepWork, onUpdate }) {
  return (
    <div>
      <h4 className="font-medium text-slate-900 mb-3">Prep Work</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Tape (LF)
          </label>
          <input
            type="number"
            value={prepWork.tapeLf}
            onChange={(e) => onUpdate({ tapeLf: e.target.value })}
            placeholder="200"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Plastic (Sq Ft)
          </label>
          <input
            type="number"
            value={prepWork.plasticSqft}
            onChange={(e) => onUpdate({ plasticSqft: e.target.value })}
            placeholder="300"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Minor Patches
          </label>
          <input
            type="number"
            value={prepWork.minorPatches}
            onChange={(e) => onUpdate({ minorPatches: e.target.value })}
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
            value={prepWork.majorPatchSqft}
            onChange={(e) => onUpdate({ majorPatchSqft: e.target.value })}
            placeholder="15"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Caulk (LF)
          </label>
          <input
            type="number"
            value={prepWork.caulkLf}
            onChange={(e) => onUpdate({ caulkLf: e.target.value })}
            placeholder="50"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
      </div>
    </div>
  );
}
