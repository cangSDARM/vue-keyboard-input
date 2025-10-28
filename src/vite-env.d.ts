/// <reference types="vite/client" />

type MayBe<T> = null | undefined | T;

type ValueOf<T extends any> = T[keyof T];
