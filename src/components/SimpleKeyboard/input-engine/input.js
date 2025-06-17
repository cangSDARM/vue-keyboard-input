import { spellInput } from './spell';

// 待选数组
export const input = (input, options = {}) => {
  const type = options.type || 'spell';
  if (type === 'spell') {
    return spellInput(input.toLowerCase(), options);
  } {
    console.warn('input: 暂不支持该类型 - ' + type);
  }
  return [];
};
