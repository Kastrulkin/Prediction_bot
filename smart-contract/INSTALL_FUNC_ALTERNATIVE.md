# Альтернативные способы установки func compiler

## Проблема

Прямое скачивание с GitHub может не работать из-за редиректов или изменений в структуре релизов.

## Решение 1: Установка через TON SDK

### Установка TON SDK (включает func)

```bash
# Установка через npm (рекомендуется)
npm install -g @ton/ton

# Или через yarn
yarn global add @ton/ton
```

После установки func должен быть доступен через:
```bash
npx @ton/ton func
```

## Решение 2: Использование Docker

Если не хотите устанавливать локально:

```bash
# Создать Dockerfile
cat > Dockerfile << 'EOF'
FROM ubuntu:22.04
RUN apt-get update && apt-get install -y wget
RUN wget https://github.com/ton-blockchain/func/releases/latest/download/func-linux -O /usr/local/bin/func
RUN chmod +x /usr/local/bin/func
EOF

# Собрать образ
docker build -t func-compiler .

# Использовать для компиляции
docker run --rm -v $(pwd):/work -w /work func-compiler \
  func build sources/MarketEscrow.fc -o build/MarketEscrow.cell
```

## Решение 3: Ручная установка

1. Перейдите на https://github.com/ton-blockchain/func/releases
2. Найдите последний релиз
3. Скачайте `func-mac` (для macOS)
4. Сделайте исполняемым:
   ```bash
   chmod +x func-mac
   ```
5. Переместите в PATH:
   ```bash
   sudo mv func-mac /usr/local/bin/func
   ```

## Решение 4: Использование Blueprint (рекомендуется для разработки)

Blueprint - это фреймворк для разработки TON контрактов, который включает func:

```bash
npm install -g @ton/blueprint
```

Затем можно использовать:
```bash
blueprint build
```

## Решение 5: Использование готового скомпилированного контракта

Если компиляция вызывает проблемы, можно:
1. Попросить кого-то скомпилировать контракт
2. Использовать онлайн компилятор (если есть)
3. Временно использовать заглушку для разработки

## Проверка установки

После установки проверьте:

```bash
func --version
# или
npx @ton/ton func --version
```

## Для нашего проекта

Рекомендую использовать **Решение 1** (через npm):

```bash
npm install -g @ton/ton
```

Затем обновить скрипт компиляции для использования:
```bash
npx @ton/ton func build sources/MarketEscrow.fc -o build/MarketEscrow.cell
```

