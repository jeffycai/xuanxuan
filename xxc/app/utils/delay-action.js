/**
 * 延时操作类
 *
 * @class DelayAction
 */
export default class DelayAction {
    /**
     * 创建一个延时操作类实例
     * @param {!function} action 延时操作函数
     * @param {number} [delay=100] 延迟时间，单位毫秒
     * @param {?function(result:any)} [callback=null] 操作完成时的回调函数
     * @constructor
     */
    constructor(action, delay = 100, callback = null) {
        /**
         * 操作函数
         * @type {function}
         * @memberof DelayAction
         */
        this.action = action;

        /**
         * 延迟时间，单位毫秒
         * @type {number}
         * @memberof DelayAction
         */
        this.delay = delay;

        /**
         * 操作完成时的回调函数
         * @type {function}
         * @memberof DelayAction
         */
        this.callback = callback;

        /**
         * 操作是否完成
         * @type {boolean}
         * @memberof DelayAction
         */
        this.done = true;
    }

    /**
     * 开始执行延时操作
     * @param {...any} params 操作函数参数
     * @memberof DelayAction
     * @return {void}
     */
    do(...params) {
        this.done = false;
        if (this.actionCallTask) {
            clearTimeout(this.actionCallTask);
        }
        this.actionCallTask = setTimeout(() => {
            this.doIm(...params);
        }, this.delay);
    }

    /**
     * 立即执行操作（没有延时）
     * @param {...any} params 操作函数参数
     * @return {void}
     * @memberof DelayAction
     */
    doIm(...params) {
        const actionResult = this.action(...params);
        this.actionCallTask = null;
        if (typeof this.callback === 'function') {
            this.callback(actionResult);
        }
        this.done = true;
    }

    /**
     * 操作是否已经完成
     * @type {boolean}
     * @readonly
     * @memberof DelayAction
     */
    get isDone() {
        return this.done;
    }

    /**
     * 销毁延时任务，取消计划中的任务操作
     *
     * @memberof DelayAction
     * @return {void}
     */
    destroy() {
        clearTimeout(this.actionCallTask);
    }
}
