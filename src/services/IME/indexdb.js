import { IndexDB } from "../../utils/indexdb";

const HASH = "hash";
const CONTENT = "content";

class ImeDB {
  #db = new IndexDB();
  dbPromise;

  constructor(name) {
    this.dbPromise = this.#db.open(name, [HASH, CONTENT]);
  }

  async getDBStore(store) {
    await this.dbPromise;
    return this.#db.openStore(store);
  }

  async get(key, hash, url) {
    const hashStore = await this.getDBStore(HASH);
    const contentStore = await this.getDBStore(CONTENT);

    const storedHash = await hashStore.get(key);
    if (storedHash === hash) {
      return contentStore.get(key);
    }
    const response = await fetch(url);
    const meme = response?.headers?.get("Content-Type");
    if (!response.ok || meme.includes('html') || meme.includes('javascript')) {
      throw new Error(`Fail to download ${key}`);
    }
    const buffer = await response.arrayBuffer();
    contentStore.set(buffer, key);
    hashStore.set(hash, key);
    return buffer;
  }

  async invalidate() {
    const store = await this.getDBStore(HASH);
    return store.clear();
  }
}

export { CONTENT, HASH, ImeDB };
