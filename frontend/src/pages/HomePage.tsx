import { useEffect, useState } from 'react';
import { useStore } from '../store/store';
import { eventsApi } from '../utils/api';
import { WalletConnect } from '../components/WalletConnect';
import { EventCard } from '../components/EventCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';

export const HomePage = () => {
  const { events, setEvents } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await eventsApi.getAll({ status: 'open', limit: 20 });
      setEvents(res.data.events || []);
    } catch (err: any) {
      console.error('Failed to fetch events:', err);
      setError(err.response?.data?.error || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [setEvents]);

  return (
    <div className="p-6 max-w-6xl mx-auto">

      <h2 className="text-2xl font-bold mt-8 mb-4">Open Events</h2>
      
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchEvents} />
      ) : events.length === 0 ? (
        <p className="text-gray-500">No events available</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};

