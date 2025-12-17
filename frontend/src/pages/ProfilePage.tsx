import { useEffect, useState } from 'react';
import { useStore } from '../store/store';
import { betsApi } from '../utils/api';
import { Bet } from '../types';
import { formatTon } from '../utils/constants';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';

export const ProfilePage = () => {
  const { user } = useStore();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBets = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        // TODO: Получить userId из user или auth
        const response = await betsApi.getUserBets(1);
        setBets(response.data.bets || []);
      } catch (err: any) {
        console.error('Failed to fetch bets:', err);
        setError(err.response?.data?.error || 'Failed to load bets');
      } finally {
        setLoading(false);
      }
    };

    fetchBets();
  }, [user]);

  if (!user) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">Please connect your wallet to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      <div className="mb-6 p-4 bg-white border rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Wallet</h2>
        <p className="text-sm text-gray-600 font-mono break-all">{user.tonAddress}</p>
        <p className="text-sm text-gray-500 mt-2">Balance: {user.balance.toFixed(2)} TON</p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">My Bets</h2>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : bets.length === 0 ? (
          <p className="text-gray-500">No bets yet</p>
        ) : (
          <div className="space-y-4">
            {bets.map((bet) => (
              <div
                key={bet.id}
                className="p-4 bg-white border rounded-lg shadow hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span
                      className={`px-2 py-1 rounded text-sm font-semibold ${
                        bet.side === 'yes'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {bet.side.toUpperCase()}
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      Event #{bet.event_id}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      bet.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : bet.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {bet.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Amount: <span className="font-semibold">{formatTon(bet.amount_gross)} TON</span>
                </div>
                {bet.price && (
                  <div className="text-sm text-gray-600">
                    Price: <span className="font-semibold">{(bet.price * 100).toFixed(2)}%</span>
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(bet.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

