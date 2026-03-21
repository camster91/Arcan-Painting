import { useNavigate } from 'react-router';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
      <p className="text-gray-500 mb-8">The page you're looking for doesn't exist.</p>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600"
      >
        Go Home
      </button>
    </div>
  );
}
