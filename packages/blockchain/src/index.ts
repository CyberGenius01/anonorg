import { createPublicClient, http, type PublicClient } from "viem";
import { localhost } from "viem/chains";

export interface BlockchainAdapter {
  getBlock(number: bigint): Promise<{
    number: bigint; hash: string; parentHash: string; timestamp: bigint;
    transactions: readonly string[];
  } | null>;
  getLatestBlockNumber(): Promise<bigint>;
}

export class EvmBlockchainAdapter implements BlockchainAdapter {
  readonly client: PublicClient;
  constructor(rpcUrl: string, chainId = 31337) {
    this.client = createPublicClient({
      chain: { ...localhost, id: chainId },
      transport: http(rpcUrl)
    });
  }
  async getLatestBlockNumber() {
    return this.client.getBlockNumber();
  }
  async getBlock(number: bigint) {
    const b = await this.client.getBlock({ blockNumber: number, includeTransactions: false });
    return {
      number: b.number,
      hash: b.hash,
      parentHash: b.parentHash,
      timestamp: b.timestamp,
      transactions: b.transactions
    };
  }
}
