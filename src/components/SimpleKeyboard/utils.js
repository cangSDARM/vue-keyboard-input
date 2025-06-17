import { IndexDB, dumpLargeJSON } from '../../utils/indexdb';
import cnchar from 'cnchar';
import { bindCnChar, input, setDictionary } from './input-engine';
import singleCharPinyin from './pinyin.simple.json';
import wordsPinyin from './pinyin.words.json';

/** 必须要在每次页面实例化前调用。
 * 以现在词汇量，第一次 init 大约需要 3s
 */
export async function initDictionary() {
  const db = new IndexDB();
  await db.open('dictionaries', ['dict-single-pinyin', 'dict-associated-pinyin']);

  const spellStore = await db.openStore('dict-single-pinyin');
  const associationStore = await db.openStore('dict-associated-pinyin');

  console.log("initial dictionaries...");
  const promises = [];
  if (await spellStore.count() <= 0) promises.push(dumpLargeJSON(singleCharPinyin, spellStore))
  if (await associationStore.count() <= 0) promises.push(dumpLargeJSON(wordsPinyin, associationStore))

  await Promise.all(promises);

  setDictionary({
    spell: { get: spellStore.get.bind(spellStore) },
    association: { get: associationStore.get.bind(associationStore) },
  });
  bindCnChar(cnchar);
  console.log('dictionaries initialed');
}

export const useKeyPress = () => {
  const keyMap = new Map();

  const bindKeyPress = (key, fn) => {
    keyMap.set(key, fn);
  };

  return {
    onKeyPress: (button, e) => {
      e.preventDefault();
      e.stopImmediatePropagation();

      const fn = keyMap.get(button);
      if (typeof fn === 'function') {
        fn(e);
      }
    },
    bindKeyPress,
  };
};

export async function wordBreak(rawInput = '') {
  const results = await input(rawInput, { associate: true, type: 'spell' });
  let maxCompactedResult = {
    split: [],
    assoc: [],
    words: [],
  };

  console.log(rawInput, results);

  // 优先选择最为复杂的字词
  for (const result of results) {
    if (
      maxCompactedResult.split.length === 0 ||
      result.split.length < maxCompactedResult.split.length
    ) {
      maxCompactedResult.split = result.split;
      maxCompactedResult.assoc = result.association[0]?.split(' ') || [];
      maxCompactedResult.words = result.words[0].split('');
    }
  }

  // cnchar 对于拼音中不存在的开头的字符(如 i,n等)的不是很能处理
  if (
    rawInput === maxCompactedResult.split[0] &&
    rawInput.length === maxCompactedResult.words.length
  ) {
    maxCompactedResult.split = rawInput.split('');
    maxCompactedResult.words = rawInput[0];
  }

  return [maxCompactedResult.split, maxCompactedResult.assoc.concat(maxCompactedResult.words)];
}
