/** biome-ignore-all lint/suspicious/noExplicitAny: 特殊情况下仅判断是不是函数 */
export type AnyFunction = (...args: any[]) => any;

export type Prettier<T> = T extends any ? { [key in keyof T]: T[key] } : never;
