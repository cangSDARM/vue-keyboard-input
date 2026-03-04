import { type IDBPDatabase, openDB } from "idb";

class IndexDBObjectStore {
  instance: IDBPDatabase<unknown>;
  name = "";

  constructor(dbInstance: IDBPDatabase<unknown>, storeName: string) {
    this.instance = dbInstance;
    this.name = storeName;
  }

  async setMany(entries: [string, any][] = []) {
    const tx = this.instance.transaction(this.name, "readwrite");

    return Promise.all(
      entries
        .map((entry) => tx.store.put(entry[1], entry[0]))
        .concat(tx.done as any),
    );
  }

  async set<V>(value: V, key?: IDBValidKey) {
    return this.instance.put(this.name, value, key);
  }

  async get(key: IDBValidKey) {
    return this.instance.get(this.name, key);
  }

  async del(key: IDBValidKey) {
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
  dbName = "";
  newCreated = false;
  instance: IDBPDatabase<any> = null!;

  constructor() {}

  /** you have to send all storeName, then openStore!!
   *
   * see: https://developer.mozilla.org/zh-CN/docs/Web/API/IDBDatabase/createObjectStore
   */
  async open(
    dbName = "idb",
    stores: string[] = [],
    storeOptions: Record<string, IDBObjectStoreParameters> = {},
  ) {
    this.dbName = dbName;
    this.instance = await openDB(this.dbName, 1, {
      upgrade: (db) => {
        stores.forEach((storeName) => {
          db.createObjectStore(storeName, storeOptions[storeName]);
        });
        this.newCreated = true;
      },
    });
  }

  async openStore(storeName = "keyval") {
    return new IndexDBObjectStore(this.instance, storeName);
  }
}

export async function dumpLargeJSON(jsonData: any, store: IndexDBObjectStore) {
  const batchSize = 500;
  const entries = Object.entries(jsonData);

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);

    await store.setMany(batch);
  }
}
