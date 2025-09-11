// Crypto utilities for AES-GCM, RSA-OAEP, hashing, and HEX conversions

// Convert ArrayBuffer <-> hex
export function arrayBufferToHex(buffer) {
  const byteArray = new Uint8Array(buffer);
  const hexCodes = Array.from(byteArray).map((b) => b.toString(16).padStart(2, '0'));
  return hexCodes.join('');
}

export function hexToArrayBuffer(hexString) {
  if (hexString.length % 2 !== 0) throw new Error('Invalid hex string');
  const arrayBuffer = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    arrayBuffer[i / 2] = parseInt(hexString.substr(i, 2), 16);
  }
  return arrayBuffer.buffer;
}

export async function sha256(arrayBuffer) {
  return await crypto.subtle.digest('SHA-256', arrayBuffer);
}

export async function generateAesGcmKey() {
  return await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export function getRandomIv(byteLength = 12) {
  const iv = new Uint8Array(byteLength);
  crypto.getRandomValues(iv);
  return iv;
}

export async function aesGcmEncrypt(aesKey, plaintextBytes, iv) {
  return await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, plaintextBytes);
}

export async function aesGcmDecrypt(aesKey, ciphertextBuffer, iv) {
  return await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, ciphertextBuffer);
}

export async function importRsaPublicKeyFromHexSpki(hex) {
  const spki = hexToArrayBuffer(hex);
  return await crypto.subtle.importKey(
    'spki',
    spki,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['encrypt']
  );
}

export async function importRsaPrivateKeyFromHexPkcs8(hex) {
  const pkcs8 = hexToArrayBuffer(hex);
  return await crypto.subtle.importKey(
    'pkcs8',
    pkcs8,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt']
  );
}

export async function rsaOaepEncrypt(publicKey, dataBuffer) {
  return await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, dataBuffer);
}

export async function rsaOaepDecrypt(privateKey, dataBuffer) {
  return await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, dataBuffer);
}

// Bundle helpers
export function concatUint8Arrays(arrays) {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}


