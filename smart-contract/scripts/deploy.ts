import { toNano } from '@ton/core';
import { MarketEscrow } from '../wrappers/MarketEscrow';
import { NetworkProvider } from '@ton/ton';
import dotenv from 'dotenv';

dotenv.config();

export async function run(provider: NetworkProvider) {
  const network = provider.network();
  const isTestnet = network === 'testnet';

  console.log(`Deploying to ${network}...`);

  // Получаем адрес админа из переменных окружения
  const adminAddress = process.env.ADMIN_ADDRESS;
  if (!adminAddress) {
    throw new Error('ADMIN_ADDRESS is not set in .env');
  }

  // TODO: Загрузить скомпилированный код контракта
  // const code = Cell.fromBase64('...');
  
  // Пока используем заглушку
  const code = Buffer.from(''); // TODO: заменить на реальный код

  const marketEscrow = MarketEscrow.createFromConfig(
    {
      adminAddress: provider.sender().address!,
      feeInBps: 50, // 0.5%
      feeOutBps: 150, // 1.5%
    },
    code as any
  );

  await provider.deploy(marketEscrow, toNano('0.1'));

  console.log('Contract deployed at:', marketEscrow.address.toString());
}

