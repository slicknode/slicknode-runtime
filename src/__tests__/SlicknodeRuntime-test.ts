import {expect} from 'chai';
import path from 'path';
import {SlicknodeRuntime} from '../SlicknodeRuntime';
import {RuntimeContext} from '../types';
import {getAuthHeaders} from '../utils';

const DUMMY_CONTEXT: RuntimeContext = {
  api: {
    endpoint: 'http://localhost',
    accessToken: 'xyz123',
  },
  request: {
    ip: '127.0.0.1',
    id: '1234xyz',
  },
  project: {
    alias: 'test-project',
  },
  settings: {},
};

describe('SlicknodeRuntime', () => {
  it('creates runtime with default options without crashing', () => {
    const runtime = new SlicknodeRuntime();
    expect(runtime).to.not.equal(undefined);
  });

  it('executes code in asynchronous module handler', async () => {
    const moduleId = 'test-module';
    const handler = 'async-handler1';
    const payload = {args: {name: 'myname'}};
    const secret = 'somesecret';
    const body = JSON.stringify({
      module: moduleId,
      handler,
      payload,
      context: DUMMY_CONTEXT,
    });

    const runtime = new SlicknodeRuntime({secret});
    runtime.register(moduleId, path.resolve(__dirname, './testmodules/module-a'));
    const result = await runtime.execute(body, getAuthHeaders({body, secret}));
    expect(result).to.deep.equal({
      data: {
        data: 'Hello myname',
      },
    });
  });

  it('executes code in synchronous module handler', async () => {
    const moduleId = 'test-module';
    const handler = 'sync-handler1';
    const payload = {args: {name: 'myname'}};
    const secret = 'somesecret';
    const body = JSON.stringify({
      module: moduleId,
      handler,
      payload,
      context: DUMMY_CONTEXT,
    });

    const runtime = new SlicknodeRuntime({secret});
    runtime.register(moduleId, path.resolve(__dirname, './testmodules/module-a'));
    const result = await runtime.execute(body, getAuthHeaders({body, secret}));
    expect(result).to.deep.equal({
      data: {
        data: 'Hello myname',
      },
    });
  });

  it('throws auth error for invalid signature', async () => {
    const moduleId = 'test-module';
    const handler = 'sync-handler1';
    const payload = {args: {name: 'myname'}};
    const secret = 'somesecret';
    const body = JSON.stringify({
      module: moduleId,
      handler,
      payload,
      context: DUMMY_CONTEXT,
    });

    const runtime = new SlicknodeRuntime({secret});
    runtime.register(moduleId, path.resolve(__dirname, './testmodules/module-a'));
    const result = await runtime.execute(body, {
      ...getAuthHeaders({body: 'changed body', secret}),
    });
    expect(result).to.deep.equal({
      data: null,
      error: {
        message: 'Authorization failed: Provided signature does not match the calculated signature for the request',
      },
    });
  });

  it('throws auth error for invalid auth header format', async () => {
    const moduleId = 'test-module';
    const handler = 'sync-handler1';
    const payload = {args: {name: 'myname'}};
    const secret = 'somesecret';
    const body = JSON.stringify({
      module: moduleId,
      handler,
      payload,
      context: DUMMY_CONTEXT,
    });

    const runtime = new SlicknodeRuntime({secret});
    runtime.register(moduleId, path.resolve(__dirname, './testmodules/module-a'));
    const result = await runtime.execute(body, {
      ...getAuthHeaders({body: 'changed body', secret}),
      Authorization: 'INVALID AUTH HEADER FORMAT',
    });
    expect(result).to.deep.equal({
      data: null,
      error: {
        message: 'Authorization failed: Invalid authorization header format',
      },
    });
  });

  it('throws auth error for missing auth header', async () => {
    const moduleId = 'test-module';
    const handler = 'sync-handler1';
    const payload = {args: {name: 'myname'}};
    const secret = 'somesecret';
    const body = JSON.stringify({
      module: moduleId,
      handler,
      payload,
      context: DUMMY_CONTEXT,
    });

    const runtime = new SlicknodeRuntime({secret});
    runtime.register(moduleId, path.resolve(__dirname, './testmodules/module-a'));
    const result = await runtime.execute(body, {
      'X-Slicknode-Timestamp': '23458765',
    });
    expect(result).to.deep.equal({
      data: null,
      error: {
        message: 'Authorization failed: No authorization header found',
      },
    });
  });

  it('throws auth error for missing auth header', async () => {
    const moduleId = 'test-module';
    const handler = 'sync-handler1';
    const payload = {args: {name: 'myname'}};
    const secret = 'somesecret';
    const body = JSON.stringify({
      module: moduleId,
      handler,
      payload,
      context: DUMMY_CONTEXT,
    });

    const runtime = new SlicknodeRuntime({secret});
    runtime.register(moduleId, path.resolve(__dirname, './testmodules/module-a'));
    const result = await runtime.execute(body, {
      Authorization: getAuthHeaders({body, secret}).Authorization,
    });
    expect(result).to.deep.equal({
      data: null,
      error: {
        message: 'Authorization failed: Header x-slicknode-timestamp is missing',
      },
    });
  });

  it('checks clock drift in the future', async () => {
    const moduleId = 'test-module';
    const handler = 'sync-handler1';
    const payload = {args: {name: 'myname'}};
    const secret = 'somesecret';
    const body = JSON.stringify({
      module: moduleId,
      handler,
      payload,
      context: DUMMY_CONTEXT,
    });

    const runtime = new SlicknodeRuntime({secret});
    runtime.register(moduleId, path.resolve(__dirname, './testmodules/module-a'));
    const result = await runtime.execute(body, getAuthHeaders({
      body,
      secret,
      timestamp: Math.floor(Date.now() / 1000) + 150,
    }));
    expect(result).to.deep.equal({
      data: null,
      error: {
        message: 'Authorization failed: The difference of the timestamp for the signature and the local server' +
          ' time exceed the maximum allowed clock drift of 120 seconds',
      },
    });
  });

  it('checks clock drift in the past', async () => {
    const moduleId = 'test-module';
    const handler = 'sync-handler1';
    const payload = {args: {name: 'myname'}};
    const secret = 'somesecret';
    const body = JSON.stringify({
      module: moduleId,
      handler,
      payload,
      context: DUMMY_CONTEXT,
    });

    const runtime = new SlicknodeRuntime({secret});
    runtime.register(moduleId, path.resolve(__dirname, './testmodules/module-a'));
    const result = await runtime.execute(body, getAuthHeaders({
      body,
      secret,
      timestamp: Math.floor(Date.now() / 1000) - 150,
    }));
    expect(result).to.deep.equal({
      data: null,
      error: {
        message: 'Authorization failed: The difference of the timestamp for the signature and the local server' +
          ' time exceed the maximum allowed clock drift of 120 seconds',
      },
    });
  });

  it('uses options for clock drift setting', async () => {
    const moduleId = 'test-module';
    const handler = 'sync-handler1';
    const payload = {args: {name: 'myname'}};
    const secret = 'somesecret';
    const body = JSON.stringify({
      module: moduleId,
      handler,
      payload,
      context: DUMMY_CONTEXT,
    });

    const runtime = new SlicknodeRuntime({
      secret,
      maxClockDrift: 200,
    });
    runtime.register(moduleId, path.resolve(__dirname, './testmodules/module-a'));
    const result = await runtime.execute(body, getAuthHeaders({
      body,
      secret,
      timestamp: Math.floor(Date.now() / 1000) - 150,
    }));
    expect(result).to.deep.equal({
      data: {
        data: 'Hello myname',
      },
    });
  });

  it('catches errors in synchronous module handler', async () => {
    const moduleId = 'test-module';
    const handler = 'sync-exception-handler1';
    const payload = {args: {name: 'myname'}};
    const secret = 'somesecret';
    const body = JSON.stringify({
      module: moduleId,
      handler,
      payload,
      context: DUMMY_CONTEXT,
    });

    const runtime = new SlicknodeRuntime({secret});
    runtime.register(moduleId, path.resolve(__dirname, './testmodules/module-a'));
    const result = await runtime.execute(body, getAuthHeaders({body, secret}));
    expect(result).to.deep.equal({
      data: null,
      error: {
        message: 'Failing handler',
      },
    });
  });

  it('catches errors in asynchronous module handler', async () => {
    const moduleId = 'test-module';
    const handler = 'async-exception-handler1';
    const payload = {args: {name: 'myname'}};
    const secret = 'somesecret';
    const body = JSON.stringify({
      module: moduleId,
      handler,
      payload,
      context: DUMMY_CONTEXT,
    });

    const runtime = new SlicknodeRuntime({secret});
    runtime.register(moduleId, path.resolve(__dirname, './testmodules/module-a'));
    const result = await runtime.execute(body, getAuthHeaders({body, secret}));
    expect(result).to.deep.equal({
      data: null,
      error: {
        message: 'Failing handler',
      },
    });
  });

  it('catches errors outside of handler function', async () => {
    const moduleId = 'test-module';
    const handler = 'error-handler';
    const payload = {args: {name: 'myname'}};
    const secret = 'somesecret';
    const body = JSON.stringify({
      module: moduleId,
      handler,
      payload,
      context: DUMMY_CONTEXT,
    });

    const runtime = new SlicknodeRuntime({secret});
    runtime.register(moduleId, path.resolve(__dirname, './testmodules/module-a'));
    const result = await runtime.execute(body, getAuthHeaders({body, secret}));
    expect(result).to.deep.equal({
      data: null,
      error: {
        message: 'Error loading handler "error-handler": Root level error',
      },
    });
  });

  it('catches syntax errors in required file', async () => {
    const moduleId = 'test-module';
    const handler = 'syntax-error';
    const payload = {args: {name: 'myname'}};
    const secret = 'somesecret';
    const body = JSON.stringify({
      module: moduleId,
      handler,
      payload,
      context: DUMMY_CONTEXT,
    });

    const runtime = new SlicknodeRuntime({secret});
    runtime.register(moduleId, path.resolve(__dirname, './testmodules/module-a'));
    const result = await runtime.execute(body, getAuthHeaders({body, secret}));
    expect(result).to.deep.equal({
      data: null,
      error: {
        message: 'Error loading handler "syntax-error": Unexpected identifier',
      },
    });
  });

  it('validates if module is provided', async () => {
    const moduleId = 'test-module';
    const handler = 'sync-handler1';
    const payload = {args: {name: 'myname'}};
    const secret = 'somesecret';
    const body = JSON.stringify({
      handler,
      payload,
      context: DUMMY_CONTEXT,
    });

    const runtime = new SlicknodeRuntime({secret});
    runtime.register(moduleId, path.resolve(__dirname, './testmodules/module-a'));
    const result = await runtime.execute(body, getAuthHeaders({body, secret}));
    expect(result).to.deep.equal({
      data: null,
      error: {
        message: 'Invalid request body: No module provided',
      },
    });
  });

  it('validates if handler is provided', async () => {
    const moduleId = 'test-module';
    const payload = {args: {name: 'myname'}};
    const secret = 'somesecret';
    const body = JSON.stringify({
      module: moduleId,
      payload,
      context: DUMMY_CONTEXT,
    });

    const runtime = new SlicknodeRuntime({secret});
    runtime.register(moduleId, path.resolve(__dirname, './testmodules/module-a'));
    const result = await runtime.execute(body, getAuthHeaders({body, secret}));
    expect(result).to.deep.equal({
      data: null,
      error: {
        message: 'Invalid request body: No handler provided',
      },
    });
  });

  it('returns error for not found handler', async () => {
    const moduleId = 'test-module';
    const handler = 'unknown-handler1';
    const payload = {args: {name: 'myname'}};
    const secret = 'somesecret';
    const body = JSON.stringify({
      module: moduleId,
      handler,
      payload,
      context: DUMMY_CONTEXT,
    });

    const runtime = new SlicknodeRuntime({secret});
    runtime.register(moduleId, path.resolve(__dirname, './testmodules/module-a'));
    const result = await runtime.execute(body, getAuthHeaders({body, secret}));
    expect(result.error.message).to.include(
      'Error loading handler "unknown-handler1": Cannot find module ',
    );
  });

  it('handles error for unregistered module', async () => {
    const moduleId = 'unregistered-module';
    const handler = 'async-handler1';
    const payload = {args: {name: 'myname'}};
    const secret = 'somesecret';
    const body = JSON.stringify({
      module: moduleId,
      handler,
      payload,
      context: DUMMY_CONTEXT,
    });

    const runtime = new SlicknodeRuntime({secret});
    const result = await runtime.execute(body, getAuthHeaders({body, secret}));
    expect(result).to.deep.equal({
      data: null,
      error: {
        message: 'Module "unregistered-module" is not registered in runtime',
      },
    });
  });

  it('usses SLICKNODE_SECRET from process.env', async () => {
    const moduleId = 'test-module';
    const handler = 'sync-handler1';
    const payload = {args: {name: 'myname'}};
    const secret = 'somesecret';
    process.env.SLICKNODE_SECRET = secret;
    const body = JSON.stringify({
      module: moduleId,
      handler,
      payload,
      context: DUMMY_CONTEXT,
    });

    const runtime = new SlicknodeRuntime();
    runtime.register(moduleId, path.resolve(__dirname, './testmodules/module-a'));
    const result = await runtime.execute(body, getAuthHeaders({body, secret}));
    expect(result).to.deep.equal({
      data: {
        data: 'Hello myname',
      },
    });
  });

  it('skips authorization if no secret is provided', async () => {
    const moduleId = 'test-module';
    const handler = 'sync-handler1';
    const payload = {args: {name: 'myname'}};
    const secret = 'somesecret';
    delete process.env.SLICKNODE_SECRET;
    const body = JSON.stringify({
      module: moduleId,
      handler,
      payload,
      context: DUMMY_CONTEXT,
    });

    const runtime = new SlicknodeRuntime();
    runtime.register(moduleId, path.resolve(__dirname, './testmodules/module-a'));
    const result = await runtime.execute(body, getAuthHeaders({body, secret}));
    expect(result).to.deep.equal({
      data: {
        data: 'Hello myname',
      },
    });
  });

  it('executes code in synchronous module handler with exports.default', async () => {
    const moduleId = 'test-module';
    const handler = 'exports-default';
    const payload = {args: {name: 'myname'}};
    const secret = 'somesecret';
    const body = JSON.stringify({
      module: moduleId,
      handler,
      payload,
      context: DUMMY_CONTEXT,
    });

    const runtime = new SlicknodeRuntime({secret});
    runtime.register(moduleId, path.resolve(__dirname, './testmodules/module-a'));
    const result = await runtime.execute(body, getAuthHeaders({body, secret}));
    expect(result).to.deep.equal({
      data: {
        data: 'Hello myname',
      },
    });
  });

  it('throws error for missing export', async () => {
    const moduleId = 'test-module';
    const handler = 'missing-export';
    const payload = {args: {name: 'myname'}};
    const secret = 'somesecret';
    const body = JSON.stringify({
      module: moduleId,
      handler,
      payload,
      context: DUMMY_CONTEXT,
    });

    const runtime = new SlicknodeRuntime({secret});
    runtime.register(moduleId, path.resolve(__dirname, './testmodules/module-a'));
    const result = await runtime.execute(body, getAuthHeaders({body, secret}));
    expect(result).to.deep.equal({
      data: null,
      error: {
        message: 'Error loading handler \"missing-export\": Expected a function to be exported, got undefined',
      },
    });
  });
});
