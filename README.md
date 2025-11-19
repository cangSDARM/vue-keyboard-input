Vue + SimpleKeyboard

1. 支持屏幕键盘、保持单个键盘实例
2. 支持 i18n
3. 键盘扩展事件、按键触发支持
4. 支持中文大字库
5. 支持自定义词库
6. 支持 rime 词库导入
7. 支持 indexdb/remote 词库的获取
8. 支持高平面的汉字输入、显示，如 𰻝
9. 支持手写输入

## cnchar 绑定

### Start

- 生成 rime 词库/字库(未编译的 .dict.yaml)
- 将对应文件放于 `src/assets/dictionary` 下
- npm run dev
- npm run gen:dicts
  - 转换 rime 词库/字库供前端使用

## rime 绑定

### Start

> !NOTE:<br/>
> 
> 1. 暂不支持需要额外 lua 扩展的词库，如 rime-ice。如果需要，请移步 [my-rime](https://github.com/LibreService/my_rime) 手动编译 wasm，并修改 rime.js 删除 Moudle 声明、导出 IDBFS<br/>
> 2. worker 暂时只支持本地词库加载，远程加载请自定义 worker.ts

- 生成 rime 词库(`rime 用户文件夹/build`，包含: `.schema.yaml/.prism.bin/.reverse.bin` 文件)
- 将对应文件放于 `src/assets/ime` 下
- npm run gen:rime-configs
  - 生成 metadata 供前端使用
