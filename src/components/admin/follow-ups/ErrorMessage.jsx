export function ErrorMessage({ error }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <p className="text-red-800">Error: {error}</p>
    </div>
  );
}
