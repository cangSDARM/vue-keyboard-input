Vue + SimpleKeyboard + cnchar

## Feature

1. 支持屏幕键盘、保持单个键盘实例
2. 支持 i18n
3. 键盘扩展事件、按键触发支持
4. 支持中文大字库
5. 支持自定义词库
6. 支持 rime 词库导入
7. 支持 indexdb/remote 词库的获取
8. 支持高平面的汉字输入、显示，如 𰻝

## TODO

- [ ] 字体有些字形不支持，如 𰻝
- [ ] fix style，如 Candidate 宽度
- [ ] fix input-engine associate 多字的词语支持(如成语等，暂时最长 3 个字符哪怕字典里有)
- [ ] fix input-engine，移除 cnchar 的绑定
- [ ] 优化分词逻辑
- [ ] 优化动态词库支持
- [ ] 扩展 Composite 的语言
- [ ] 扩展用户常用词库
- [ ] 扩展输入方法，如 5 笔、双拼支持
- [ ] 扩展快捷键 1,2,3,4,5 选词
- [ ] 扩展单词、单字输入
- [ ] webworker

## Start

- npm run dev
- npm run gen:dicts
  - 转换 rime 词库/字库 到可支持格式
