import { workerData, parentPort } from 'worker_threads';
import { importDynamic } from './utils';

// Prevent direct execution
if (!workerData) {
  throw new Error('Script can only be executed in worker thread');
}

async function handlerExecutionWorker({ modulePath, args }) {
  let handler = (await importDynamic(modulePath)).default;
  if (typeof handler === 'object') {
    handler = handler.default;
  }

  let result;
  console.log('Modules', modulePath, handler, 'args', args);
  if (typeof handler !== 'function') {
    throw new Error(
      `Runtime expectes module "${modulePath}" to export a function as default export, got "${typeof handler}"`
    );
  } else {
    result = await handler(...args);
  }
  console.log('Worker result', result);
  // if (mod.constructor.name === 'AsyncFunction') {
  //   result = await mod(args);
  // } else {
  //   result = mod(args);
  // }

  parentPort.postMessage({ data: result });
}

handlerExecutionWorker(workerData).catch((error) =>
  parentPort.postMessage({ error })
);
