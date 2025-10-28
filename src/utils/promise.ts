export const pipe = async <I>(
  input: I,
  ...promiseFns: ((result: any, input: I) => Promise<any>)[]
) => {
  let result = input;
  for (const fn of promiseFns) {
    try {
      result = await fn(result, input); // 等待当前 Promise 完成
    } catch (e) {
      console.error(e);
    }
  }
};
