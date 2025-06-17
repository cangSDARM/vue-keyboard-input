import { DictMap } from '../map';

/** @type {DictMap|null} */
let associateWords = null;

export function setAssociates(option) {
  if (!associateWords) {
    associateWords = new DictMap(option);
  }
}

export function getAssociates() {
  return associateWords;
}

export function getAllSubsets(arr, splitter = "'") {
  const pairs = [];
  const n = arr.length;

  // 遍历所有可能的分割点（1到n-1）
  for (let i = 2; i < n; i++) {
    const left = arr.slice(0, i).join(splitter);
    const right = arr.slice(i).join(splitter);
    pairs.push([left, right]);
  }

  // 添加父集和空集的分割 [[1,2,3], []]
  pairs.push([arr.join(splitter), '']);

  return pairs;
}

// 数组去重 会返回新数组
export function distinctArray(arr) {
  if ('undefined' !== typeof window && window.Set) {
    return Array.from(new Set(arr));
  }
  const newArr = [];
  arr.forEach((item) => {
    if (!newArr.includes(item)) newArr.push(item);
  });
  return newArr;
}

// 根据权重排序原数组
export function sortArrayWithWeights(result, weights) {
  const newResult = [];
  const sortWeight = [];
  for (let i = 0; i < result.length; i++) {
    const weight = weights[i];

    let sorted = false;
    for (let j = 0; j < sortWeight.length; j++) {
      if (weight >= sortWeight[j]) {
        sortWeight.splice(j, 0, weight);
        newResult.splice(j, 0, result[i]);
        sorted = true;
        break;
      }
    }
    if (!sorted) {
      sortWeight.push(weight);
      newResult.push(result[i]);
    }
  }

  return newResult;
}
