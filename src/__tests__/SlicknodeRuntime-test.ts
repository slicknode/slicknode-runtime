import {expect} from 'chai';
import path from 'path';
import {SlicknodeRuntime} from '../SlicknodeRuntime';
import {getAuthHeaders} from '../utils';

const DUMMY_CONTEXT = {
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
});
