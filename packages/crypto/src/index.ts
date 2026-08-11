import { poseidon2 } from "poseidon-lite";
import { keccak256, stringToBytes } from "viem";

function bigintFromUtf8(value: string): bigint {
  return BigInt(keccak256(stringToBytes(value)));
}

export function poseidonCommitment(
  organizationSecret: string,
  privateData: string,
  nonce: string
): `0x${string}` {
  const a = bigintFromUtf8(organizationSecret);
  const b = bigintFromUtf8(privateData);
  const c = bigintFromUtf8(nonce);
  const result = poseidon2([a, b ^ c]);
  return `0x${result.toString(16).padStart(64, "0")}` as `0x${string}`;
}
