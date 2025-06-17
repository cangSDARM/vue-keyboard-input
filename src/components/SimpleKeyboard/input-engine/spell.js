import { associateSpell } from './associate/ass-spell';
import { distinctArray } from './associate/common';
import { getCnChar } from './cnchar';
import { DictMap } from './map';
import { getSpellDict, HanziRegex, splitString } from './util';

export function spellInput(input, { associate = true }) {
  if (!getSpellDict()) {
    console.warn('spellInput: cnchar is not installed');
    return [];
  }

  return spellInputBase(input).then(r => associateSpell(r, { associate }));
}

function spellInputBase(input) {
  return traverse(input, getSpellDict());
}

function buildSpellReg() {
  return HanziRegex;
}

/**
 * @param {string} input
 * @param {DictMap} map
 */
async function traverse(input, map, path = [], spellPath = [], result = []) {
  let matched = false;
  for (let length = 1; length <= 7; length++) {
    // 拼音最长6+1个音调长度

    if (input.length < length) {
      break;
    }

    // eslint-disable-next-line prefer-const
    let [spell, rest] =  splitString(input, length); // 分割输入
    const wordString = await map.get(spell);

    const onSpellMatched = async (matchWords) => {
      let pathValue = '';
      if (matchWords) {
        pathValue = distinctArray(matchWords).join('');
      }
      const newPath = [...path, pathValue];
      const newSpellPath = [...spellPath, spell];
      if (rest) {
        await traverse(rest, map, newPath, newSpellPath, result);
      } else {
        result.push({
          split: newSpellPath,
          words: newPath,
          association: [],
        });
      }
    };

    if (wordString && spell !== 'n') {
      // 匹配到拼音
      matched = true;

      const reg = buildSpellReg();
      const matchWords = wordString.match(reg); // 筛选出音调匹配到的汉字

      await onSpellMatched(matchWords);
    } else {
      if (!matched) {
        if (rest.length === 0) {
          result.push({
            split: [...spellPath, spell],
            words: [...path, spell],
            association: [],
          });
        } else {
          if (spell.length <= 2) {
            if (isInitial(spell) && isInitial(rest[0]) && !isInitial(spell + rest[0])) {
              matched = true;
              const reg = buildSpellReg();

              const matchWords = findWordsStartWithInitial(spell, map).match(reg); // 筛选出音调匹配到的汉字
             await onSpellMatched(matchWords);
            }
          }
        }
      }
    }
  }

  return result;
}

const WordsStartWithInitialMap = {};
function findWordsStartWithInitial(spell, map) {
  if (WordsStartWithInitialMap[spell]) return WordsStartWithInitialMap[spell];

  let str = '';
  for (const k in map) {
    if (k.indexOf(spell) === 0) {
      str += map[k];
    }
  }
  WordsStartWithInitialMap[spell] = str;
  return str;
}

function isInitial(n) {
  if (n.length > 1) n = n.replace(/[0-4]/, '');
  return getCnChar()?.spellInfo.initials.includes(n) || false;
}
