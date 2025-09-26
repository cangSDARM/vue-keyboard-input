/**
 * Wraps file system operations in worker thread.
 * Use it with `expose`.
 */
function fsOperate(operation, ...args) {
  const result = Module.FS[operation](...args);
  if (operation === 'mkdir') {
    return; // result not serializable
  }
  return result;
}

/**
 * Proxy file system operations in main thread.
 *
 * @param worker - The lambda worker
 * @returns An object similar to Module.FS but has async functions
 */
function asyncFS(worker) {
  const fsOperate = worker.register('fsOperate');
  return new Proxy(
    {},
    {
      get(target, prop) {
        return (...args) => fsOperate(prop, ...args);
      },
    },
  );
}

export { asyncFS, fsOperate };

