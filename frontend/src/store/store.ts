import { create } from 'zustand';
import { Event, Bet, User } from '../types';

interface Store {
  user: User | null;
  setUser: (user: User | null) => void;
  events: Event[];
  setEvents: (events: Event[]) => void;
  bets: Bet[];
  setBets: (bets: Bet[]) => void;
  selectedEvent: Event | null;
  setSelectedEvent: (event: Event | null) => void;
}

export const useStore = create<Store>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  events: [],
  setEvents: (events) => set({ events }),
  bets: [],
  setBets: (bets) => set({ bets }),
  selectedEvent: null,
  setSelectedEvent: (event) => set({ selectedEvent: event }),
}));

