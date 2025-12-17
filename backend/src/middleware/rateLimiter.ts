import rateLimit from 'express-rate-limit';

// Общий лимит для всех API
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Строгий лимит для ставок
export const betLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 10, // максимум 10 ставок в минуту
  message: 'Too many bets from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Лимит для создания событий
export const eventCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 5, // максимум 5 событий в час
  message: 'Too many events created, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

