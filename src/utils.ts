/**
 * Converts a value to promise if it is not a promise already
 *
 * @param value
 * @returns {any}
 */
import crypto from 'crypto';
import {Base64String, Headers, ResolvedGlobalId} from './types';

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

/**
 * Base64 encodes a string
 * @param i
 */
export function base64Encode(i: string): Base64String {
  return Buffer.from(i, 'utf8').toString('base64');
}

/**
 * Base64 decodes a string
 * @param i
 */
export function base64Decode(i: Base64String): string {
  return Buffer.from(i, 'base64').toString('utf8');
}

/**
 * Generates a global slicknode Node ID for a type with the provided internal ID
 */
export function toGlobalId(type: string, id: string): string {
  return base64Encode([type, id].join(':')).replace(/=/g, '');
}

/**
 * Converts a global slicknode ID to a resolved global ID object
 */
export function fromGlobalId(globalId: string): ResolvedGlobalId {
  const decodedGlobalId = base64Decode(globalId);
  const delimiterPos = decodedGlobalId.indexOf(':');
  return {
    __typename: decodedGlobalId.substring(0, delimiterPos),
    id: decodedGlobalId.substring(delimiterPos + 1),
  };
}
