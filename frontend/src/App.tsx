import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { HomePage } from './pages/HomePage';
import { EventPage } from './pages/EventPage';
import { ProfilePage } from './pages/ProfilePage';
import { WalletConnect } from './components/WalletConnect';
import './App.css';

function App() {
  return (
    <TonConnectUIProvider manifestUrl="https://your-domain.com/tonconnect-manifest.json">
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          {/* Navigation */}
          <nav className="bg-white shadow-sm border-b">
            <div className="max-w-6xl mx-auto px-6 py-4">
              <div className="flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold text-blue-600">
                  PredictionBot
                </Link>
                <div className="flex gap-4 items-center">
                  <Link
                    to="/"
                    className="text-gray-600 hover:text-gray-900 transition"
                  >
                    Events
                  </Link>
                  <Link
                    to="/profile"
                    className="text-gray-600 hover:text-gray-900 transition"
                  >
                    Profile
                  </Link>
                  <WalletConnect />
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/events/:id" element={<EventPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TonConnectUIProvider>
  );
}

export default App;

