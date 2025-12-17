import { Event } from '../types';
import { formatTon, nanotonsToTon } from '../utils/constants';
import { useNavigate } from 'react-router-dom';

interface EventCardProps {
  event: Event;
}

export const EventCard = ({ event }: EventCardProps) => {
  const navigate = useNavigate();
  const totalYes = nanotonsToTon(event.total_yes);
  const totalNo = nanotonsToTon(event.total_no);
  const totalPool = totalYes + totalNo;
  const probYes = totalPool > 0 ? (totalYes / totalPool) * 100 : 50;

  return (
    <div
      className="p-4 border rounded-lg bg-white shadow hover:shadow-lg transition cursor-pointer"
      onClick={() => navigate(`/events/${event.id}`)}
    >
      <h3 className="font-bold text-lg mb-2">{event.title}</h3>
      {event.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.description}</p>
      )}
      
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-green-600 font-semibold">YES: {formatTon(event.total_yes)} TON</span>
          <span className="text-red-600 font-semibold">NO: {formatTon(event.total_no)} TON</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all"
            style={{ width: `${probYes}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">YES: {probYes.toFixed(1)}%</p>
      </div>

      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>Status: {event.status}</span>
        <span>Ends: {new Date(event.end_date).toLocaleDateString()}</span>
      </div>
    </div>
  );
};

