# Инструкция по установке func compiler

## Текущая ситуация

Func compiler не установлен в системе. Есть несколько вариантов установки.

## Вариант 1: Ручная установка (самый надежный)

1. **Перейдите на GitHub**: https://github.com/ton-blockchain/func/releases

2. **Найдите последний релиз** (например, v0.4.0 или новее)

3. **Скачайте `func-mac`** для macOS

4. **Установите**:
   ```bash
   # Перейдите в папку со скачанным файлом
   chmod +x func-mac
   sudo mv func-mac /usr/local/bin/func
   
   # Проверьте
   func --version
   ```

## Вариант 2: Использование Docker

Если не хотите устанавливать локально:

```bash
# Создайте скрипт compile-docker.sh
cat > compile-docker.sh << 'EOF'
#!/bin/bash
docker run --rm -v $(pwd):/work -w /work \
  tonblockchain/func:latest \
  func build sources/MarketEscrow.fc -o build/MarketEscrow.cell
EOF

chmod +x compile-docker.sh
./compile-docker.sh
```

## Вариант 3: Попросить кого-то скомпилировать

Можно попросить коллегу или использовать другой компьютер для компиляции, затем скопировать `build/MarketEscrow.cell` в проект.

## Вариант 4: Использовать онлайн компилятор (если доступен)

Некоторые сервисы предоставляют онлайн компиляцию TON контрактов.

## Рекомендация

**Используйте Вариант 1** - это самый простой и надежный способ.

После установки func, запустите:

```bash
cd smart-contract
npm run build
```

## Проверка

После установки проверьте:

```bash
func --version
```

Должна вывестись версия компилятора (например, `func v0.4.0`).

