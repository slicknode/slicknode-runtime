/**
 * Converts a value to promise if it is not a promise already
 *
 * @param value
 * @returns {any}
 */
import crypto from 'crypto';
import {Headers} from './types';

export function toPromise(value: any) {
  if (
    typeof value === 'object' &&
    value !== null &&
    typeof value.then === 'function'
  ) {
    return value;
  }
  return Promise.resolve(value);
}

export function getAuthHeaders(options: {
  body: string,
  secret: string,
  timestamp?: number,
}): Headers {
  const timestamp = options.timestamp || Math.floor(Date.now() / 1000);
  const signedString = [
    String(timestamp),
    options.body,
  ].join('\n');

  const hmac = crypto.createHmac('sha256', options.secret);
  hmac.update(signedString);
  const calculatedSignature = hmac.digest('hex');

  return {
    'X-Slicknode-Timestamp': String(timestamp),
    'Authorization': `SN1-HMAC-SHA256 Signature=${calculatedSignature}`,
  };
}
