import { id } from "ethers";

/**
 * Ensures a given string is a valid bytes32 hex string.
 * If it's already a valid 0x... 64-char hex, returns it.
 * Otherwise, it hashes the string using keccak256 via ethers.id().
 */
export function toBytes32Hash(input?: string): string {
  if (!input) return '0x0000000000000000000000000000000000000000000000000000000000000000';
  
  const isAlreadyBytes32 = /^0x[a-fA-F0-9]{64}$/.test(input);
  if (isAlreadyBytes32) return input;
  
  return id(input); // id() internally calculates the keccak256 hash of the UTF-8 bytes of the string.
}

export function isBytes32(value: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(value);
}