import { compileFunc } from '@ton-community/func-js';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

async function compile() {
  console.log('🔨 Compiling MarketEscrow contract...');

  const projectDir = join(__dirname, '..');
  const sourceFile = join(projectDir, 'sources', 'MarketEscrow.fc');
  const stdlibFile = join(projectDir, 'imports', 'stdlib.fc');
  const outputDir = join(projectDir, 'build');
  const outputFile = join(outputDir, 'MarketEscrow.cell');

  try {
    // Читаем исходный файл
    const sourceCode = readFileSync(sourceFile, 'utf-8');
    const stdlibCode = readFileSync(stdlibFile, 'utf-8');

    // Компилируем
    const result = await compileFunc({
      sources: {
        'MarketEscrow.fc': sourceCode,
        'imports/stdlib.fc': stdlibCode,
      },
    });

    if (result.status === 'error') {
      console.error('❌ Compilation failed:');
      console.error(result.message);
      process.exit(1);
    }

    // Создаем директорию build если её нет
    mkdirSync(outputDir, { recursive: true });

    // Сохраняем скомпилированный контракт
    writeFileSync(outputFile, Buffer.from(result.codeBoc, 'base64'));

    console.log('✅ Contract compiled successfully!');
    console.log(`📦 Output: ${outputFile}`);
    console.log(`📊 Code BOC size: ${result.codeBoc.length} bytes`);

    // Показываем предупреждения, если есть
    if (result.fiftCode) {
      console.log('\n⚠️  Fift code generated (for reference):');
      console.log(result.fiftCode.substring(0, 200) + '...');
    }
  } catch (error: any) {
    console.error('❌ Error during compilation:', error.message);
    process.exit(1);
  }
}

compile();

