import type { MessageData } from './type';

/**
 * Exposes worker functions.
 *
 * @param functions - Map of name to function
 * @param readyPromise - A promise that must be resolved before any worker function calls
 */
function expose<T>(
  functions: { [key: string]: (...args: any[]) => any },
  readyPromise: Promise<T>,
) {
  self.onmessage = async (
    msg: MessageEvent<{
      name: string;
      args: any[];
      transferableIndices: number[];
    }>,
  ) => {
    await readyPromise;
    const { name, args, transferableIndices } = msg.data;
    const transferables: ArrayBuffer[] = [];
    let data: MessageData;
    try {
      const workerFunction = functions[name];
      if (typeof workerFunction !== 'function') {
        console.error(`${name} is not an exposed worker function`);
        self.close();
        return; // close doesn't immediately kill the worker
      }
      const result = await workerFunction(...args);
      args.forEach((arg, i) => transferableIndices.includes(i) && transferables.push(arg));
      data = { type: 'success', result, transferables };
    } catch (error: any) {
      const { message, name } = error;
      data = {
        type: 'error',
        error: {
          message,
          name,
        },
      };
    }
    self.postMessage(data, { transfer: transferables });
  };
}

/**
 * Creates a control function to send signal to main thread.
 *
 * @param name - The function name
 * @returns A control function
 */
function control<T extends (...args: any[]) => void>(name: string) {
  return ((...args) => {
    const data = {
      type: 'control',
      name,
      args,
    };
    self.postMessage(data);
  }) as T;
}

export { control, expose };
