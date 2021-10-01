import { Worker } from 'worker_threads';
import * as path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type HandlerFunction = (...args: any) => Promise<any>;

export async function createHandler(params: {
  modulePath: string;
  watch?: boolean;
}): Promise<HandlerFunction> {
  const { watch = false, modulePath } = params;

  if (watch) {
    // Execut handler in service worker so imports are automatically invalidated on each request
    return (...args) => {
      return new Promise((resolve, reject) => {
        const worker = new Worker(
          path.resolve(__dirname, 'handlerExecutionWorker.mjs'),
          {
            workerData: { modulePath, args },
            execArgv: [
              '--experimental-modules',
              '--es-module-specifier-resolution=node',
            ],
          }
        );

        worker.once('message', (result) => {
          if (result.data) {
            resolve(result.data);
          } else {
            reject(result.error);
          }
        });

        worker.once('error', (error) => {
          reject(error);
        });
      });
    };
  } else {
    // Directly return imported function
    const importedModule = await import(pathToFileURL(modulePath).href);
    let exportedHandler =
      typeof importedModule === 'function'
        ? importedModule
        : importedModule.default;

    if (typeof exportedHandler === 'object') {
      exportedHandler = exportedHandler.default;
    }
    if (typeof exportedHandler !== 'function') {
      throw new Error(
        `Expected a function to be exported, got ${typeof exportedHandler}`
      );
    }
    return (...args) => {
      return exportedHandler(...args);
    };
  }
}
