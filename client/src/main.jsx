import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import AuthPage from './pages/AuthPage.jsx';
import VaultPage from './pages/VaultPage.jsx';

function Root() {
  const [user, setUser] = useState(null); // { userId, publicKey }
  const [privateKeyHex, setPrivateKeyHex] = useState('');
  const [status, setStatus] = useState('');

  return (
    <BrowserRouter>
      <ToastContainer className="mt-16" />
      <Routes>
        <Route
          path="/auth"
          element={
            <AuthPage
              user={user}
              setUser={setUser}
              privateKeyHex={privateKeyHex}
              setPrivateKeyHex={setPrivateKeyHex}
              status={status}
              setStatus={setStatus}
            />
          }
        />
        <Route
          path="/vault"
          element={
            user ? (
              <VaultPage
                user={user}
                setUser={setUser}
                privateKeyHex={privateKeyHex}
                setPrivateKeyHex={setPrivateKeyHex}
                status={status}
                setStatus={setStatus}
              />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
