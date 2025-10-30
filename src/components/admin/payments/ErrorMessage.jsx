export function ErrorMessage({ message }) {
  if (!message) return null;

  return (
    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-red-600">{message}</p>
    </div>
  );
}
