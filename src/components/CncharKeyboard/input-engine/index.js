import { setAssociates } from './associate/common';
import { setCnchar } from './cnchar';
import { input as core } from './input';
import { setSpellDict } from './util';

export const bindCnChar = (cnchar) => setCnchar(cnchar);

export const input = core;

export const setDictionary = (option) => {
  setSpellDict(option.spell);
  setAssociates(option.association);
};
