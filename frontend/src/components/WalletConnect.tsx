import { useEffect } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { useStore } from '../store/store';

export const WalletConnect = () => {
  const [tonConnectUI] = useTonConnectUI();
  const { setUser } = useStore();

  useEffect(() => {
    if (tonConnectUI.connected && tonConnectUI.wallet) {
      setUser({
        tonAddress: tonConnectUI.wallet.account.address,
        balance: 0, // Will be fetched from API
      });
    } else {
      setUser(null);
    }
  }, [tonConnectUI.connected, tonConnectUI.wallet, setUser]);

  const handleConnect = () => {
    tonConnectUI.openModal();
  };

  const handleDisconnect = () => {
    tonConnectUI.disconnect();
  };

  return (
    <div className="p-4 bg-blue-50 rounded-lg">
      {!tonConnectUI.connected ? (
        <button
          onClick={handleConnect}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Connect Wallet
        </button>
      ) : (
        <div>
          <p className="text-sm text-gray-600 mb-2">
            Connected: {tonConnectUI.wallet?.account.address.slice(0, 10)}...
          </p>
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

