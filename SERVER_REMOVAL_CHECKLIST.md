# Чеклист для безопасного удаления проекта с сервера

## ⚠️ ВАЖНО: Выполняйте шаги последовательно!

---

## Шаг 1: Создать бэкап базы данных PostgreSQL

**На сервере выполните:**

```bash
# Подключитесь к серверу
ssh user@your-server.com

# Создайте бэкап базы данных
pg_dump -h localhost -U your_db_user -d prediction_bot > backup_$(date +%Y%m%d_%H%M%S).sql

# Или если используете DATABASE_URL:
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Скачайте бэкап на локальную машину
scp user@your-server.com:/path/to/backup_*.sql ./db_backups/
```

**Локально создайте папку для бэкапов:**
```bash
mkdir -p db_backups
```

---

## Шаг 2: Сохранить файлы окружения (.env)

**На сервере:**

```bash
# Найдите все .env файлы
find /path/to/project -name ".env*" -type f

# Скопируйте их локально
scp user@your-server.com:/path/to/project/backend/.env ./backend/.env.backup
scp user@your-server.com:/path/to/project/frontend/.env ./frontend/.env.backup
```

**⚠️ ВАЖНО:** `.env` файлы содержат секретные ключи (DATABASE_URL, TON_RPC_URL, ADMIN_ADDRESS и т.д.)

---

## Шаг 3: Сохранить код (Git или архив)

**Вариант А: Если используете Git**

**Локально:**

```bash
# Убедитесь, что все изменения закоммичены
git status

# Если есть незакоммиченные изменения, закоммитьте их
git add .
git commit -m "Save before server removal"

# Отправьте в удаленный репозиторий (если используете)
git push origin main
```

**Вариант Б: Если НЕ используете Git (создайте архив)**

**Локально:**

```bash
# Создайте архив всего проекта (исключая node_modules и build)
cd "/Users/alexdemyanov/Yandex.Disk-demyanovap.localized/AI bots"
tar -czf PreditctionBot_backup_$(date +%Y%m%d_%H%M%S).tar.gz \
  PreditctionBot \
  --exclude='node_modules' \
  --exclude='build' \
  --exclude='dist' \
  --exclude='*.log' \
  --exclude='.DS_Store'

# Сохраните архив в безопасное место
mv PreditctionBot_backup_*.tar.gz ~/Desktop/  # или другое место
```

---

## Шаг 4: Сохранить логи (опционально)

**На сервере:**

```bash
# Если есть важные логи
scp -r user@your-server.com:/path/to/project/backend/logs ./backend/logs_backup/
```

---

## Шаг 5: Проверить локальную версию проекта

**Локально:**

```bash
# Убедитесь, что все зависимости установлены
cd backend && npm install
cd ../frontend && npm install
cd ../smart-contract && npm install

# Проверьте, что проект запускается локально
cd backend
npm run dev  # Должен запуститься (даже если БД недоступна)
```

---

## Шаг 6: Удалить проект с сервера

**На сервере:**

```bash
# 1. Остановите все процессы проекта
pm2 stop prediction-bot  # если используете PM2
# или
pkill -f "node.*backend"  # если запущено напрямую

# 2. Удалите проект
rm -rf /path/to/project

# 3. (Опционально) Удалите базу данных PostgreSQL
# ⚠️ ВНИМАНИЕ: Делайте это ТОЛЬКО если уверены, что бэкап сохранен!
# psql -U your_db_user -d postgres -c "DROP DATABASE prediction_bot;"

# 4. (Опционально) Удалите пользователя БД
# ⚠️ ВНИМАНИЕ: Делайте это ТОЛЬКО если уверены!
# dropuser your_db_user
```

---

## Шаг 7: Проверить локальную работоспособность

**Локально:**

```bash
# 1. Восстановите базу данных из бэкапа (если нужно)
createdb prediction_bot_local
psql prediction_bot_local < db_backups/backup_YYYYMMDD_HHMMSS.sql

# 2. Обновите .env файл для локальной БД
# В backend/.env измените DATABASE_URL на локальный:
# DATABASE_URL=postgresql://user:password@localhost:5432/prediction_bot_local

# 3. Запустите миграции (если нужно)
cd backend
npm run db:init

# 4. Запустите проект
npm run dev
```

---

## Что НЕ нужно удалять с сервера (если планируете вернуться):

- База данных PostgreSQL (можно оставить, но создать бэкап)
- Переменные окружения в системе (если используются)
- SSL сертификаты (если есть)

---

## Быстрая команда для бэкапа всего проекта:

**На сервере:**

```bash
# Создайте архив всего проекта
tar -czf prediction_bot_backup_$(date +%Y%m%d_%H%M%S).tar.gz \
  /path/to/project \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='build' \
  --exclude='dist'

# Скачайте архив
scp user@your-server.com:/path/to/prediction_bot_backup_*.tar.gz ./
```

---

## Контрольный список перед удалением:

- [ ] Бэкап базы данных создан и скачан локально
- [ ] Все .env файлы сохранены локально
- [ ] Код сохранен (Git commit или архив создан)
- [ ] Локальная версия проекта работает
- [ ] Все зависимости установлены локально
- [ ] Логи сохранены (если нужны)
- [ ] Процессы на сервере остановлены
- [ ] Готовы удалить проект с сервера

---

## Если что-то пошло не так:

1. **База данных потеряна:** Восстановите из бэкапа
2. **Код потерян:** Клонируйте из Git репозитория
3. **.env потерян:** Восстановите из бэкапа или создайте заново по SETUP.md

---

**Дата создания:** $(date)
**Статус:** Готово к использованию

