#!/bin/bash

# Скрипт для компиляции MarketEscrow контракта

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🔨 Compiling MarketEscrow contract..."

# Проверяем наличие func
FUNC_CMD="func"
FIFT_CMD="fift"

# Проверяем func
if ! command -v func &> /dev/null; then
    # Пробуем найти в стандартном месте после установки через brew
    if [ -f "/usr/local/Cellar/ton/64/bin/func" ]; then
        FUNC_CMD="/usr/local/Cellar/ton/64/bin/func"
        echo "ℹ️  Using func from /usr/local/Cellar/ton/64/bin/func"
    else
        echo "❌ Error: func compiler not found"
        echo "Please install: brew install ton-blockchain/ton/ton"
        exit 1
    fi
fi

# Проверяем fift
if ! command -v fift &> /dev/null; then
    if [ -f "/usr/local/Cellar/ton/64/bin/fift" ]; then
        FIFT_CMD="/usr/local/Cellar/ton/64/bin/fift"
        echo "ℹ️  Using fift from /usr/local/Cellar/ton/64/bin/fift"
    else
        echo "❌ Error: fift compiler not found"
        echo "Please install: brew install ton-blockchain/ton/ton"
        exit 1
    fi
fi

# Проверяем наличие stdlib.fc
if [ ! -f "$PROJECT_DIR/imports/stdlib.fc" ]; then
    echo "⚠️  Warning: stdlib.fc not found in imports/"
    echo "Downloading stdlib.fc..."
    mkdir -p "$PROJECT_DIR/imports"
    curl -o "$PROJECT_DIR/imports/stdlib.fc" \
        https://raw.githubusercontent.com/ton-blockchain/ton/master/crypto/smartcont/stdlib.fc || {
        echo "❌ Failed to download stdlib.fc"
        echo "Please download it manually from:"
        echo "https://raw.githubusercontent.com/ton-blockchain/ton/master/crypto/smartcont/stdlib.fc"
        exit 1
    }
fi

# Создаем директорию build если её нет
mkdir -p "$PROJECT_DIR/build"

# Компилируем контракт
cd "$PROJECT_DIR"

echo "📝 Step 1: Compiling FunC to Fift..."
$FUNC_CMD sources/MarketEscrow.fc -o build/MarketEscrow.fif

if [ $? -ne 0 ]; then
    echo "❌ FunC compilation failed"
    exit 1
fi

echo "📝 Step 2: Compiling Fift to Cell..."
$FIFT_CMD -s build/MarketEscrow.fif -o build/MarketEscrow.cell

if [ $? -ne 0 ]; then
    echo "❌ Fift compilation failed"
    exit 1
fi

if [ $? -eq 0 ]; then
    echo "✅ Contract compiled successfully!"
    echo "📦 Output: build/MarketEscrow.cell"
    ls -lh build/MarketEscrow.cell
else
    echo "❌ Compilation failed"
    exit 1
fi

