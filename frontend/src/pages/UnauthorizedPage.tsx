import { useNavigate } from 'react-router-dom';

export function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-danger mb-4">403</h1>
        <p className="text-muted mb-6">You don't have permission to view this page.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-accent text-primary rounded px-4 py-2 hover:bg-accent/80 transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
