export const CapState = {
  Off: 0,
  Always: 1,
};

export const Layouts = {
  // 默认布局
  default: [
    '1 2 3 4 5 6 7 8 9 0',
    'q w e r t y u i o p',
    '{NONE} a s d f g h j k l {NONE}',
    'z x c v b n m {bksp}',
    '{num} {symbol} {caps} {space} {lang} {enter}',
  ],
  // 大小写
  shift: [
    '~ ! @ # $ % ^ & * ( ) _ +',
    'Q W E R T Y U I O P',
    '{NONE} A S D F G H J K L {NONE}',
    'Z X C V B N M {bksp}',
    '{num} {symbol} {caps} {space} {lang} {enter}',
  ],
  symbols: [
    '~ ! @ # $ % ^ & * ( ) {bksp}',
    '- _ = + [ ] { } | \\ {enter}',
    ': ; \' " < > , . / ?',
    '` · ￥ ！ ， 。 《 》 ～ {abc}',
  ],
  numbers: ['+ 1 2 3 {bksp}', '- 4 5 6 {space}', '* 7 8 9 {enter}', '/ , 0 . {abc}'],
};
