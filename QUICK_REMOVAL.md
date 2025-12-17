# Быстрое удаление проекта с сервера

## Минимальные шаги (5 минут):

### 1. Бэкап базы данных (ОБЯЗАТЕЛЬНО!)

```bash
# На сервере
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Скачать на локальную машину
scp user@server:/path/to/backup_*.sql ./db_backups/
```

### 2. Сохранить .env файлы

```bash
# Скачать с сервера
scp user@server:/path/to/project/backend/.env ./backend/.env.backup
```

### 3. Создать архив проекта локально (на всякий случай)

```bash
cd "/Users/alexdemyanov/Yandex.Disk-demyanovap.localized/AI bots"
tar -czf PreditctionBot_backup_$(date +%Y%m%d).tar.gz \
  PreditctionBot \
  --exclude='node_modules' \
  --exclude='build' \
  --exclude='dist'
```

### 4. Удалить с сервера

```bash
# На сервере
pm2 stop prediction-bot  # или pkill -f "node.*backend"
rm -rf /path/to/project
```

---

## ⚠️ КРИТИЧЕСКИ ВАЖНО:

1. **Бэкап БД** - без него потеряете все данные
2. **.env файлы** - без них не сможете подключиться к БД и API
3. **Архив кода** - на случай если что-то пойдет не так

---

## После удаления:

Проект останется только локально. Для работы локально:
- Настройте локальную PostgreSQL БД
- Обновите DATABASE_URL в backend/.env
- Запустите `npm run db:init` для создания схемы

