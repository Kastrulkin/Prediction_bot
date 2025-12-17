import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsApi } from '../utils/api';
import { Event } from '../types';
import { BetForm } from '../components/BetForm';
import { formatTon, nanotonsToTon } from '../utils/constants';
import { useStore } from '../store/store';

export const EventPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setSelectedEvent } = useStore();
  const [event, setEvent] = useState<Event | null>(null);
  const [eventDetails, setEventDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await eventsApi.getById(parseInt(id));
        
        if (response.data.success) {
          setEvent(response.data.event);
          setEventDetails({
            probability: response.data.probability,
            coefficients: response.data.coefficients,
            totalPool: response.data.totalPool,
          });
          setSelectedEvent(response.data.event);
        } else {
          setError('Event not found');
        }
      } catch (err: any) {
        console.error('Failed to fetch event:', err);
        setError(err.response?.data?.error || 'Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, setSelectedEvent]);

  const handleBetPlaced = async () => {
    // Обновляем данные события после ставки
    if (!id) return;
    
    try {
      const response = await eventsApi.getById(parseInt(id));
      if (response.data.success) {
        setEvent(response.data.event);
        setEventDetails({
          probability: response.data.probability,
          coefficients: response.data.coefficients,
          totalPool: response.data.totalPool,
        });
      }
    } catch (err) {
      console.error('Failed to refresh event:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error || 'Event not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const totalYes = nanotonsToTon(event.total_yes);
  const totalNo = nanotonsToTon(event.total_no);
  const totalPool = totalYes + totalNo;
  const probYes = totalPool > 0 ? (totalYes / totalPool) * 100 : 50;
  const probNo = 100 - probYes;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Кнопка назад */}
      <button
        onClick={() => navigate('/')}
        className="mb-4 text-blue-600 hover:text-blue-800"
      >
        ← Back to Events
      </button>

      {/* Заголовок события */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
        {event.description && (
          <p className="text-gray-600 mb-4">{event.description}</p>
        )}
        <div className="flex gap-4 text-sm text-gray-500">
          <span>Status: <span className="font-semibold">{event.status}</span></span>
          <span>Ends: <span className="font-semibold">{new Date(event.end_date).toLocaleString()}</span></span>
          {event.category && (
            <span>Category: <span className="font-semibold">{event.category}</span></span>
          )}
        </div>
      </div>

      {/* Статистика пулов */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* YES Pool */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-semibold text-green-700 mb-2">YES Pool</h3>
          <div className="text-2xl font-bold text-green-600 mb-1">
            {formatTon(event.total_yes)} TON
          </div>
          <div className="text-sm text-gray-600">
            Probability: {probYes.toFixed(2)}%
          </div>
          {eventDetails?.coefficients && (
            <div className="text-sm text-gray-600">
              Coefficient: {eventDetails.coefficients.yes?.toFixed(2)}x
            </div>
          )}
        </div>

        {/* NO Pool */}
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-semibold text-red-700 mb-2">NO Pool</h3>
          <div className="text-2xl font-bold text-red-600 mb-1">
            {formatTon(event.total_no)} TON
          </div>
          <div className="text-sm text-gray-600">
            Probability: {probNo.toFixed(2)}%
          </div>
          {eventDetails?.coefficients && (
            <div className="text-sm text-gray-600">
              Coefficient: {eventDetails.coefficients.no?.toFixed(2)}x
            </div>
          )}
        </div>
      </div>

      {/* Визуализация вероятности */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-green-600 font-semibold">YES: {probYes.toFixed(1)}%</span>
          <span className="text-red-600 font-semibold">NO: {probNo.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-green-600 h-4 rounded-full transition-all"
            style={{ width: `${probYes}%` }}
          />
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Total Pool: <span className="font-semibold">{formatTon((BigInt(event.total_yes) + BigInt(event.total_no)).toString())} TON</span>
        </div>
      </div>

      {/* Форма ставки */}
      {event.status === 'open' && (
        <div className="mb-6">
          <BetForm event={event} onBetPlaced={handleBetPlaced} />
        </div>
      )}

      {/* Информация о разрешении */}
      {event.status === 'resolved' && event.resolved_outcome && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-700 mb-2">Event Resolved</h3>
          <p className="text-blue-800">
            Outcome: <span className="font-bold">{event.resolved_outcome.toUpperCase()}</span>
          </p>
          {event.resolved_at && (
            <p className="text-sm text-blue-600 mt-1">
              Resolved at: {new Date(event.resolved_at).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Информация о контракте */}
      {event.contract_address && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Contract Address</h3>
          <p className="text-xs text-gray-600 font-mono break-all">
            {event.contract_address}
          </p>
        </div>
      )}
    </div>
  );
};

