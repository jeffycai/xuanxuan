/**
 * 创建一个限时 Promise，超过一定的时间，如果传入的 Promise 仍然未能执行成功则返回的 Promise 直接失败
 *
 * @param {Promise} promise 要执行的 Promise
 * @param {number} [timeout=15000] 限时，单位毫秒
 * @param {string|Error} timeoutError 超时出错信息
 * @return {Promise} 返回一个新的 Promise
 */
export default (promise, timeout = 15000, timeoutError = 'TIMEOUT') => {
    const timeoutPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
            reject(timeoutError);
        }, timeout);
    });

    return Promise.race([promise, timeoutPromise]);
};
