import { useNavigate } from 'react-router-dom';
import FileView from '../FileView.jsx';
import Header from '../components/Header.jsx';

export default function VaultPage({ user, setUser, privateKeyHex, setPrivateKeyHex, status, setStatus }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser(null);
    setPrivateKeyHex('');
    setStatus('You have been logged out.');
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header 
        title="GhostCloud"
        right={user ? (
          <button
            onClick={handleLogout}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/30 focus:ring-offset-2 transition-colors"
          >
            Logout
          </button>
        ) : null}
      />

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* File View */}
        {user && (
          <div className="max-w-7xl mx-auto">
            <FileView user={user} privateKeyHex={privateKeyHex} setStatus={setStatus} />
          </div>
        )}
      </main>
    </div>
  );
}
