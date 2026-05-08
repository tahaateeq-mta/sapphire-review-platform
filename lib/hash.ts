/**
 * Deterministic Hash Utility for FYP Proof-of-Concept.
 * Returns a hex string starting with 0x.
 * NOTE: For production, use a server-side SHA-256 implementation.
 */
export function generateHash(data: unknown): string {
  if (!data) return "0x0000000000000000000000000000000000000000000000000000000000000000";
  
  const str = JSON.stringify(data, Object.keys(data as object).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to a 64-character hex string (mocking SHA-256 length)
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const dummy = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  return "0x" + (hex + dummy).slice(0, 64);
}