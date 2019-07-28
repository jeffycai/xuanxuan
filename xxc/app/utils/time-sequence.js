/**
 * 存储下次生成的运行时序列号
 * @type {number}
 * @private
 */
let start = Math.floor((new Date().getTime() - 1504504705755) / 1000);

/**
 * 每次调用获取一个运行时递增的唯一的整数序列号
 * @return {number}
 */
export default () => (start++);
