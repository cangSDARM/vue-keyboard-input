import { openDB } from 'idb';

class IndexDBObjectStore {
  /** @type {IDBPObjectStore<any, [string], string, "readwrite">} */
  instance = null;
  name = '';

  /**
   * @param {IDBPDatabase} dbInstance
   * @param {string} storeName
   */
  constructor(dbInstance, storeName) {
    this.instance = dbInstance;
    this.name = storeName;
  }

  async setMany(entries = []) {
    const tx = this.instance.transaction(this.name, 'readwrite');

    return Promise.all(entries.map((entry) => tx.store.put(entry[1], entry[0])).concat(tx.done));
  }

  async get(key) {
    return this.instance.get(this.name, key);
  }

  async del(key) {
    return this.instance.delete(this.name, key);
  }

  async clear() {
    return this.instance.clear(this.name);
  }

  async keys() {
    return this.instance.getAllKeys(this.name);
  }

  async count() {
    return this.instance.count(this.name);
  }
}

export class IndexDB {
  dbName = '';
  newCreated = false;
  /** @type {IDBPDatabase} */
  instance;

  constructor() {}

  /** you have to send all storeName, then openStore!!
   *
   * see: https://developer.mozilla.org/zh-CN/docs/Web/API/IDBDatabase/createObjectStore
   */
  async open(dbName = 'idb', stores = []) {
    this.dbName = dbName;
    this.instance = await openDB(this.dbName, 1, {
      upgrade: (db) => {
        stores.forEach((storeName) => {
          db.createObjectStore(storeName);
        });
        this.newCreated = true;
      },
    });
  }

  async openStore(storeName = 'keyval') {
    return new IndexDBObjectStore(this.instance, storeName);
  }
}

/**
 * @param {any} jsonData
 * @param {IndexDBObjectStore} store
 */
export async function dumpLargeJSON(jsonData, store) {
  const batchSize = 500;
  const entries = Object.entries(jsonData);

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);

    await store.setMany(batch);
  }
}
