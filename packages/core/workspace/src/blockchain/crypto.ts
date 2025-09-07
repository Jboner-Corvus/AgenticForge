import * as CryptoJS from 'crypto-js';

export function calculateHash(data) {
  return CryptoJS.SHA256(JSON.stringify(data)).toString();
}
