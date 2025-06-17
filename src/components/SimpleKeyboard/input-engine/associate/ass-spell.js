import { getCnChar } from '../cnchar';
import { getAllSubsets, getAssociates } from './common';

export async function associateSpell(result, option = {}) {
  if (!option.associate || result.length === 0) return result;

  const cnchar = getCnChar();
  if (!cnchar) {
    console.warn('associateSpell: cnchar is not installed');
    return result;
  }

  const associates = getAssociates();

  let subsets = [];
  for (let i = 0; i < result.length; i++) {
    subsets = getAllSubsets(result[i].split);

    for (const [subset] of subsets) {
      const associated = await associates.get(subset);
      if (associated) {
        result[i].association.push(associated);
      }
    }
  }

  return result;
}
