import { DictMap } from "./map";

/** @type {DictMap|null} */
let spellDict = null;

export function setSpellDict(option) {
  if (spellDict === null) {
    spellDict = new DictMap(option);
  }
}

export function getSpellDict() {
  return spellDict;
}

export function splitString(str, index) {
  return [str.substring(0, index), str.substring(index)];
}

export const mapJson = (key, value, cb) => {
  if (typeof key === 'object') {
    for (const k in key) {
      cb(k, key[k]);
    }
    return;
  }
  cb(key, value);
};

/** see: https://zhuanlan.zhihu.com/p/33335629 */
export const HanziRegex = /\p{Unified_Ideograph}/ug;
