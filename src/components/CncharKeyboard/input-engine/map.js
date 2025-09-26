export class DictMap {
  dict = {};

  constructor(option) {
    if (option.dict) {
      this.dict = option.dict;
    }

    if (option.get) {
      this.get = option.get;
    }
  }

  get(key = '') {
    return this.dict[key];
  }

  set() {
    throw "method is not implemented";
  }
}
