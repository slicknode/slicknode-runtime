import { workerData, parentPort } from 'worker_threads';

// Prevent direct execution
if (!workerData) {
  throw new Error('Script can only be executed in worker thread');
}

async function handlerExecutionWorker({ modulePath, args }) {
  let handler = (await import(modulePath)).default;
  if (typeof handler === 'object') {
    handler = handler.default;
  }

  let result;
  if (typeof handler !== 'function') {
    throw new Error(
      `Runtime expects module "${modulePath}" to export a function as default export, got "${typeof handler}"`
    );
  } else {
    result = await handler(...args);
  }

  parentPort.postMessage({ data: result });
}

handlerExecutionWorker(workerData).catch((error) =>
  parentPort.postMessage({ error })
);
