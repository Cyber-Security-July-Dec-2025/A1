// Key management: cache public key in localStorage, never store private key

const PUBLIC_KEY_STORAGE_KEY = 'secure_vault_public_key_hex_spki';

export function savePublicKeyHex(hex) {
  localStorage.setItem(PUBLIC_KEY_STORAGE_KEY, hex);
}

export function getPublicKeyHex() {
  return localStorage.getItem(PUBLIC_KEY_STORAGE_KEY) || '';
}

export function clearPublicKey() {
  localStorage.removeItem(PUBLIC_KEY_STORAGE_KEY);
}


