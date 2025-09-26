class TrieNode {
  constructor() {
    this.children = new Map();
    this.isEnd = false;
  }
}

export class Trie {
  initialized = false;

  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let node = this.root;
    for (const char of word) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char);
    }
    node.isEnd = true;
  }

  findByPrefix(prefix) {
    let node = this.root;
    const result = [];

    // 遍历前缀
    for (const char of prefix) {
      if (!node.children.has(char)) return result;
      node = node.children.get(char);
    }

    // 收集所有以当前节点为根的单词
    this._collectWords(node, prefix, result);
    return result;
  }

  _collectWords(node, current, result) {
    if (node.isEnd) result.push(current);

    for (const [char, childNode] of node.children.entries()) {
      this._collectWords(childNode, current + char, result);
    }
  }
}
