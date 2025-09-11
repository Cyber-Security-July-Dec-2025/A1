// RSA keypair generation and export/import helpers
import { arrayBufferToHex } from './crypto.js';

export async function generateRsaKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  const spki = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const pkcs8 = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return {
    publicKeySpkiHex: arrayBufferToHex(spki),
    privateKeyPkcs8Hex: arrayBufferToHex(pkcs8),
  };
}


