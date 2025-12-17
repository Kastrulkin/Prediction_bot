import { Contract, ContractProvider, Sender, Address, Cell, contractAddress, beginCell } from '@ton/core';

export type MarketEscrowConfig = {
  adminAddress: Address;
  feeInBps: number;
  feeOutBps: number;
};

export function marketEscrowConfigToCell(config: MarketEscrowConfig): Cell {
  return beginCell()
    .storeAddress(config.adminAddress)
    .storeCoins(0) // total_yes
    .storeCoins(0) // total_no
    .storeUint(0, 2) // resolved_outcome = open
    .storeUint(config.feeInBps, 16) // fee_in_bps
    .storeUint(config.feeOutBps, 16) // fee_out_bps
    .storeDict(null) // user_positions_dict
    .endCell();
}

export const MarketEscrowOpcodes = {
  place_bet: 1,
  resolve_market: 2,
  claim_payout: 3,
  refund_market: 4,
};

export class MarketEscrow implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}

  static createFromAddress(address: Address) {
    return new MarketEscrow(address);
  }

  static createFromConfig(config: MarketEscrowConfig, code: Cell, workchain = 0) {
    const data = marketEscrowConfigToCell(config);
    const init = { code, data };
    return new MarketEscrow(contractAddress(workchain, init), init);
  }

  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: 1,
      body: beginCell().endCell(),
    });
  }

  async sendPlaceBet(
    provider: ContractProvider,
    via: Sender,
    opts: {
      value: bigint;
      side: 'yes' | 'no';
    }
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: 1,
      body: beginCell()
        .storeUint(MarketEscrowOpcodes.place_bet, 32)
        .storeUint(opts.side === 'yes' ? 1 : 0, 1)
        .endCell(),
    });
  }

  async sendResolveMarket(
    provider: ContractProvider,
    via: Sender,
    opts: {
      value: bigint;
      outcome: 'yes' | 'no';
    }
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: 1,
      body: beginCell()
        .storeUint(MarketEscrowOpcodes.resolve_market, 32)
        .storeUint(opts.outcome === 'yes' ? 1 : 0, 1)
        .endCell(),
    });
  }

  async sendClaimPayout(provider: ContractProvider, via: Sender, opts: { value: bigint }) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: 1,
      body: beginCell()
        .storeUint(MarketEscrowOpcodes.claim_payout, 32)
        .endCell(),
    });
  }

  async sendRefundMarket(
    provider: ContractProvider,
    via: Sender,
    opts: {
      value: bigint;
      refundFeeBps: number;
    }
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: 1,
      body: beginCell()
        .storeUint(MarketEscrowOpcodes.refund_market, 32)
        .storeUint(opts.refundFeeBps, 16)
        .endCell(),
    });
  }

  async getMarketData(provider: ContractProvider) {
    const result = await provider.get('get_market_data', []);
    return {
      totalYes: result.stack.readBigNumber(),
      totalNo: result.stack.readBigNumber(),
      resolvedOutcome: result.stack.readNumber(),
      feeInBps: result.stack.readNumber(),
      feeOutBps: result.stack.readNumber(),
    };
  }

  async getUserPosition(provider: ContractProvider, userAddress: Address) {
    const result = await provider.get('get_user_position', [
      { type: 'slice', cell: beginCell().storeAddress(userAddress).endCell() },
    ]);
    return {
      amountYes: result.stack.readBigNumber(),
      amountNo: result.stack.readBigNumber(),
    };
  }
}

