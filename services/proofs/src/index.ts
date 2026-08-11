export interface ProofProvider {
  readonly name: string;
  generate(input: { circuitId: string; privateInputs: unknown; publicInputs: unknown }): Promise<{
    proof: unknown;
    publicInputs: unknown;
  }>;
  verify(input: { circuitId: string; proof: unknown; publicInputs: unknown }): Promise<boolean>;
}

export interface CircuitRegistry {
  resolve(name: string, version: string): Promise<{ id: string; provider: string; verifierRef: string }>;
}

/**
 * Production implementation should be backed by an audited proving system
 * such as a Circom/snarkjs, Halo2, Noir, Plonk or Groth16 provider.
 */
export class UnsupportedProofProvider implements ProofProvider {
  readonly name = "unsupported";
  async generate(): Promise<never> {
    throw new Error("NO_PROOF_PROVIDER_CONFIGURED");
  }
  async verify(): Promise<never> {
    throw new Error("NO_PROOF_PROVIDER_CONFIGURED");
  }
}
