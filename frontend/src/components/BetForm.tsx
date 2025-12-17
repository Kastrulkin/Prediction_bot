import { useState, useEffect } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Event, BetSide } from '../types';
import { betsApi } from '../utils/api';
import { formatTon, nanotonsToTon, tonToNanotons } from '../utils/constants';
import { useStore } from '../store/store';

interface BetFormProps {
  event: Event;
  onBetPlaced?: () => void;
}

export const BetForm = ({ event, onBetPlaced }: BetFormProps) => {
  const [tonConnectUI] = useTonConnectUI();
  const { user } = useStore();
  const [side, setSide] = useState<BetSide>('yes');
  const [amount, setAmount] = useState<string>('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const totalYes = nanotonsToTon(event.total_yes);
  const totalNo = nanotonsToTon(event.total_no);
  const totalPool = totalYes + totalNo;
  const probYes = totalPool > 0 ? (totalYes / totalPool) * 100 : 50;
  const probNo = 100 - probYes;

  // Вычисляем коэффициент
  const coefYes = probYes > 0 ? (100 / probYes).toFixed(2) : '1.00';
  const coefNo = probNo > 0 ? (100 / probNo).toFixed(2) : '1.00';

  // Вычисляем потенциальный выигрыш
  const potentialWin = side === 'yes' 
    ? (parseFloat(amount) * parseFloat(coefYes)).toFixed(2)
    : (parseFloat(amount) * parseFloat(coefNo)).toFixed(2);

  useEffect(() => {
    setError(null);
    setSuccess(false);
  }, [side, amount]);

  const handleAmountChange = (value: string) => {
    // Валидация: только числа и точка
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handlePlaceBet = async () => {
    if (!user || !tonConnectUI.connected) {
      setError('Please connect your wallet first');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amountNum < 0.1) {
      setError('Minimum bet is 0.1 TON');
      return;
    }

    if (amountNum > 100) {
      setError('Maximum bet is 100 TON');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Конвертируем TON в nanotons
      const amountNanotons = tonToNanotons(amountNum);

      // Создаем транзакцию TON
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [
          {
            address: event.contract_address || '', // TODO: получить из события
            amount: amountNanotons,
            payload: '', // TODO: добавить payload для контракта
          },
        ],
      };

      // Отправляем транзакцию через TonConnect
      const result = await tonConnectUI.sendTransaction(transaction);

      // Создаем ставку в backend
      const response = await betsApi.create({
        eventId: event.id,
        side,
        amount: amountNum,
        txHash: result.boc,
      });

      if (response.data.success) {
        setSuccess(true);
        setAmount('1');
        if (onBetPlaced) {
          setTimeout(() => {
            onBetPlaced();
            setSuccess(false);
          }, 2000);
        }
      }
    } catch (err: any) {
      console.error('Error placing bet:', err);
      setError(err.response?.data?.error || err.message || 'Failed to place bet');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !tonConnectUI.connected) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">Please connect your wallet to place a bet</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border rounded-lg shadow">
      <h3 className="text-xl font-bold mb-4">Place a Bet</h3>

      {/* Выбор стороны */}
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setSide('yes')}
            className={`p-4 border-2 rounded-lg transition ${
              side === 'yes'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-green-300'
            }`}
          >
            <div className="text-lg font-semibold text-green-600">YES</div>
            <div className="text-sm text-gray-600">Probability: {probYes.toFixed(1)}%</div>
            <div className="text-sm font-bold">Coefficient: {coefYes}x</div>
          </button>

          <button
            onClick={() => setSide('no')}
            className={`p-4 border-2 rounded-lg transition ${
              side === 'no'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-red-300'
            }`}
          >
            <div className="text-lg font-semibold text-red-600">NO</div>
            <div className="text-sm text-gray-600">Probability: {probNo.toFixed(1)}%</div>
            <div className="text-sm font-bold">Coefficient: {coefNo}x</div>
          </button>
        </div>
      </div>

      {/* Ввод суммы */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bet Amount (TON)
        </label>
        <div className="relative">
          <input
            type="text"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter amount"
            disabled={loading}
          />
          <div className="absolute right-3 top-2 text-gray-500">TON</div>
        </div>
        <div className="mt-2 flex gap-2">
          {[1, 5, 10, 25, 50].map((val) => (
            <button
              key={val}
              onClick={() => setAmount(val.toString())}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition"
              disabled={loading}
            >
              {val} TON
            </button>
          ))}
        </div>
      </div>

      {/* Информация о ставке */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Your bet:</span>
          <span className="font-semibold">{amount} TON on {side.toUpperCase()}</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Fee (0.5%):</span>
          <span className="text-gray-700">{(parseFloat(amount) * 0.005).toFixed(4)} TON</span>
        </div>
        <div className="flex justify-between text-sm font-bold">
          <span>Potential win:</span>
          <span className="text-green-600">{potentialWin} TON</span>
        </div>
      </div>

      {/* Ошибки и успех */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">Bet placed successfully!</p>
        </div>
      )}

      {/* Кнопка ставки */}
      <button
        onClick={handlePlaceBet}
        disabled={loading || !amount || parseFloat(amount) <= 0}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Processing...' : `Place Bet (${amount} TON)`}
      </button>
    </div>
  );
};

