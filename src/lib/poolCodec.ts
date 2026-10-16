/**
 * The bundled pool is stored lightly encoded so labels are not readable at a
 * glance in the network tab or page source. This is obfuscation, not security:
 * anyone reading the code can decode it. Server mode keeps answers private.
 */
const KEY = 'real-or-rendered';

export function encodePool(json: string): string {
  const bytes = new TextEncoder().encode(json);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[i]! ^ KEY.charCodeAt(i % KEY.length) ^ (i * 31) % 251;
  let bin = '';
  for (let i = 0; i < out.length; i++) bin += String.fromCharCode(out[i]!);
  return btoa(bin);
}

export function decodePool(encoded: string): unknown {
  const bin = atob(encoded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i) ^ KEY.charCodeAt(i % KEY.length) ^ (i * 31) % 251;
  return JSON.parse(new TextDecoder().decode(out));
}
