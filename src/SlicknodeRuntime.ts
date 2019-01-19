import assert from 'assert';
import crypto from 'crypto';
import {toPromise} from './utils';

import {
  Headers, RuntimeRequest,
  RuntimeResponse,
  SlicknodeRuntimeOptions,
} from './types';

export class SlicknodeRuntime {
  private options: SlicknodeRuntimeOptions;

  /**
   * A map of module IDs and their module paths
   */
  private modules: {[moduleId: string]: string};

  /**
   * Constructor
   * @param {SlicknodeRuntimeOptions} options
   */
  public constructor(options: SlicknodeRuntimeOptions = {}) {
    this.options = {
      // Merge options with default settings
      maxClockDrift: 120,
      ...options,
    };
    this.modules = {};
  }

  /**
   * Registers a new module with the runtime
   *
   * @param {string} moduleId The slicknode module ID
   * @param {string} modulePath The NodeJS resolved path
   */
  public register(moduleId: string, modulePath: string) {
    this.modules[moduleId] = !modulePath.endsWith('/') ? `${modulePath}/` : modulePath;
  }

  /**
   * Executes a request with the runtime
   * @param {string} body
   * @param {Headers} headers
   * @returns {Promise<RuntimeResponse>}
   */
  public async execute(
    body: string,
    headers: Headers = {},
  ): Promise<RuntimeResponse> {
    try {
      // Check signature and auth headers
      this.authorize(body, headers);

      // Parse body
      const request = this.parseBody(body);

      // Check if module exists
      if (!this.modules.hasOwnProperty(request.module)) {
        throw new Error(`Module "${request.module}" is not registered in runtime`);
      }

      let handler;
      try {
        handler = require(`${this.modules[request.module]}${request.handler}`);

        // Check if we have exported object
        if (typeof handler === 'object') {
          handler = handler.default;
        }
        if (typeof handler !== 'function') {
          throw new Error(`Expected a function to be exported, got ${typeof handler}`);
        }
      } catch (e) {
        throw new Error(`Error loading handler "${request.handler}": ${e.message}`);
      }

      try {
        // Execute actual handler
        const result = handler(request.payload || null, request.context);

        // Allow promises and synchronous results
        return toPromise(result)
          .then((data: any) => {
            return {
              data,
            };
          })
          .catch((err: Error) => {
            // Errors in user code are considered valid output, so just pass success = false and the message
            console.error(err); // tslint:disable-line no-console
            return {
              data: null as any,
              error: {
                message: err.message,
              },
            };
          });
      } catch (e) {
        // Errors in user code are considered valid output, so just pass success = false and the message
        console.error(e); // tslint:disable-line no-console
        return {
          data: null,
          error: {
            message: e.message,
          },
        };
      }
    } catch (e) {
      console.error(e); // tslint:disable-line no-console
      return {
        data: null,
        error: {
          message: e.message,
        },
      };
    }
  }

  /**
   * Parses the request body into a RuntimeRequest object
   *
   * @param {string} body
   * @returns {RuntimeRequest}
   */
  private parseBody(body: string): RuntimeRequest {
    try {
      const data = JSON.parse(body);

      // Basic payload validation
      assert(typeof data === 'object', 'Data is not an object');
      assert(typeof data.module === 'string', 'No module provided');
      assert(typeof data.handler === 'string', 'No handler provided');
      assert(typeof data.context === 'object', 'No context provided');
      assert(data.hasOwnProperty('payload'), 'No payload provided');

      return data;
    } catch (e) {
      throw new Error(`Invalid request body: ${e.message}`);
    }
  }

  private authorize(body: string, headers: Headers) {
    try {
      const secret = this.options.secret || process.env.SLICKNODE_SECRET;
      if (!secret) {
        // tslint:disable-next-line no-console
        console.warn(
          'WARNING: No secret set in runtime. Authorization is skipped and server is insecure. ' +
          'Set the environment variable SLICKNODE_SECRET or pass the secret to the runtime.',
        );
        return;
      }

      // Extract auth headers case insensitive
      const lcHeaders: Headers = Object.keys(headers).reduce((h: Headers, name: string) => {
        return {
          [name.toLowerCase()]: headers[name],
          ...h,
        };
      }, {});

      // Check if auth header exists
      if (!lcHeaders.hasOwnProperty('authorization')) {
        throw new Error('No authorization header found');
      }

      // Check if timestamp is set
      if (!lcHeaders.hasOwnProperty('x-slicknode-timestamp')) {
        throw new Error('Header x-slicknode-timestamp is missing');
      }
      const timestamp = parseInt(lcHeaders['x-slicknode-timestamp'], 10);

      // Check if timestamp is within allowed clock drift range
      const clockDrift = this.options.maxClockDrift;
      if (!timestamp || Math.abs(Date.now() / 1000 - timestamp) > clockDrift) {
        throw new Error(
          'The difference of the timestamp for the signature and the local server time exceed ' +
          `the maximum allowed clock drift of ${clockDrift} seconds`,
        );
      }

      // Validate authorization token
      const regex = new RegExp('^SN1-HMAC-SHA256 Signature=([a-f0-9]+)$');
      const match = lcHeaders.authorization.match(regex);
      if (!match || match.length < 2) {
        throw new Error('Invalid authorization header format');
      }

      // Calculate signature
      const signedString = [
        String(timestamp),
        body,
      ].join('\n');

      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(signedString);
      const calculatedSignature = hmac.digest('hex');
      if (calculatedSignature !== match[1]) {
        throw new Error('Provided signature does not match the calculated signature for the request');
      }
    } catch (e) {
      throw new Error(`Authorization failed: ${e.message}`);
    }
  }
}
