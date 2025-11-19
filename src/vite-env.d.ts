/// <reference types="vite/client" />

type Maybe<T> = null | undefined | T;

type ValueOf<T extends any> = T[keyof T];
