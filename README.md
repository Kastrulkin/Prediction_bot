# PredictionBot 🤖

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![TON](https://img.shields.io/badge/TON-0088CC?style=flat&logo=ton&logoColor=white)](https://ton.org/)

Мини-приложение в Telegram для торговли прогнозами (YES/NO рынки) с использованием TON блокчейна.

## 📋 Описание

PredictionBot позволяет пользователям создавать события для прогнозирования и делать ставки на исходы (YES/NO) с использованием TON. Платформа автоматически распределяет выплаты победителям после разрешения события администратором.

## 🏗️ Архитектура

- **Frontend**: React 18 + TypeScript + TonConnect UI + Zustand
- **Backend**: Node.js + Express + PostgreSQL + Redis
- **Smart Contract**: TON escrow контракт (один контракт на рынок)
- **Telegram**: Bot для уведомлений

## 📁 Структура проекта

```
ton-prediction-bot/
├── frontend/          # React приложение
├── backend/           # Node.js API сервер
├── smart-contract/    # TON смарт-контракты
└── docs/              # Документация
```

## 🚀 Быстрый старт

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- TON testnet wallet

### Установка

```bash
# Backend
cd backend
npm install
cp .env.example .env
npm run dev

# Frontend
cd frontend
npm install
npm start

# Smart Contract
cd smart-contract
npm install
```

## 📖 Документация

- **[Полная спецификация проекта](./PROJECT_SPECIFICATION.md)** - детальное описание архитектуры, API и бизнес-логики
- **[Инструкция по установке](./SETUP.md)** - пошаговая настройка всех компонентов
- **[Прогресс разработки](./PROGRESS.md)** - текущий статус проекта
- **[Следующие шаги](./NEXT_STEPS.md)** - план дальнейшей разработки

## 🔧 Технологии

- **Frontend**: React 18, TypeScript, Vite, TonConnect UI, Zustand, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, PostgreSQL, Redis
- **Blockchain**: TON, FunC, TON SDK
- **Tools**: ESLint, Prettier, Winston (логирование)

## 🔐 Комиссии

- **fee_in**: 0.3–0.5% со всех ставок на входе
- **fee_out**: 1–2% с пула проигравшей стороны при разрешении

## 📝 Лицензия

MIT

