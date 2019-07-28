import platform from '../platform';

/**
 * 事件名称表
 * @type {Object<string, string>}
 * @const
 * @private
 */
export const EVENT = {
    data_change: 'data.change',
};

/**
 * 事件 `data_change` 触发延迟，单位毫秒
 * @type {number}
 * @const
 * @private
 */
const DATA_CHANGE_DELAY = 110;

/**
 * 从平台模块获取 EventEmitter 类
 */
const EventEmitter = platform.access('EventEmitter');

/**
 * 事件管理类
 * （能够同时在 Electron 主进程和渲染进程中工作）
 *
 * @class Events
 * @extends {EventEmitter}
 */
export class Events extends EventEmitter {
    /**
     * 事件名称表
     * @type {Object<string, string>}
     * @const
     * @static
     */
    static EVENT = EVENT;

    /**
     * 创建一个事件触发器类实例
     * @constructor
     */
    constructor() {
        super();
        this.eventsMap = {};
        this.isMainProcess = !process.browser && process.type !== 'renderer';
        if (this.setMaxListeners) {
            this.setMaxListeners(0);
        }
    }

    /**
     * 绑定事件并返回一个 {Sysmbo} 作为事件绑定 ID 用于取消事件
     * @param  {string} event 事件名称
     * @param  {function} listener 事件回调函数
     * @return {Symbol} 事件绑定 ID
     * @memberof Events
     */
    on(event, listener) {
        super.on(event, listener);
        const name = Symbol(event);
        this.eventsMap[name] = {listener, name: event};
        if (DEBUG) {
            if (this.isMainProcess) {
                console.log('\n>> ON EVENT', event);
            } else {
                console.collapse('ON EVENT', 'orangeBg', event, 'orangePale');
                console.trace('event', this.eventsMap[name]);
                console.groupEnd();
            }
        }
        return name;
    }

    /**
     * 绑定一个一次性事件，触发后会自动取消绑定，只会触发一次
     * @param  {string} event 事件名称
     * @param  {Function} listener 事件回调函数
     * @return {Symbol} 事件绑定 ID
     * @memberof Events
     */
    once(event, listener) {
        const name = Symbol(event);
        const listenerBinder = (...args) => {
            this.off(name);
            listener(...args);
        };
        super.once(event, listenerBinder);
        this.eventsMap[name] = {listener: listenerBinder, name: event};
        if (DEBUG) {
            if (this.isMainProcess) {
                console.log('\n>> ON ONCE EVENT', event);
            } else {
                console.collapse('ON ONCE EVENT', 'orangeBg', event, 'orangePale');
                console.trace('event', this.eventsMap[name]);
                console.groupEnd();
            }
        }
        return name;
    }

    /**
     * 取消绑定事件
     * @param  {...Symbol} names 要取消的事件 ID
     * @return {void}
     * @memberof Events
     */
    off(...names) {
        if (this.eventsMap) {
            names.forEach(name => {
                const event = this.eventsMap[name];
                if (event) {
                    this.removeListener(event.name, event.listener);
                    delete this.eventsMap[name];
                    if (DEBUG) {
                        if (this.isMainProcess) {
                            console.log('OFF EVENT', event.name);
                        } else {
                            console.collapse('OFF EVENT', 'orangeBg', event.name, 'orangePale');
                            console.trace('event', event);
                            console.groupEnd();
                        }
                    }
                }
            });
        }
    }

    /**
     * 触发一个事件
     *
     * @param {string} names 要触发的事件名称
     * @param {...any} args 事件参数
     * @memberof Events
     * @return {void}
     */
    emit(names, ...args) {
        super.emit(names, ...args);
        if (DEBUG) {
            if (this.isMainProcess) {
                console.log('\n>> EMIT EVENT', names);
            } else {
                console.collapse('EMIT EVENT', 'orangeBg', names, 'orangePale');
                args.forEach((arg, argIdx) => {
                    console.log(`arg: ${argIdx}`, arg);
                });
                console.trace('stacktrace');
                console.groupEnd();
            }
        }
    }

    /**
     * 监听通用数据变更事件
     *
     * @param {Function} listener 事件回调函数
     * @return {Symbol} 事件绑定 ID
     * @memberof Events
     */
    onDataChange(listener) {
        return this.on(EVENT.data_change, listener);
    }

    /**
     * 触发通用数据变更事件
     *
     * @param {Object<string, any>} data 变更数据表
     * @param {number} delay 事件触发最小延迟时间，单位毫秒
     * @return {void}
     * @memberof Events
     */
    emitDataChange(data, delay = DATA_CHANGE_DELAY) {
        if (typeof data === 'object') {
            if (this.delayEmitData && data) {
                Object.keys(data).forEach(dataKey => {
                    this.delayEmitData[dataKey] = Object.assign(this.delayEmitData[dataKey] || {}, data[dataKey]);
                });
            } else {
                this.delayEmitData = data;
            }
        } else if (DEBUG) {
            console.warn('Events.emitDataChange error, because the data param is not object.');
        }
        if (this.delayEmitDataChangeEventTimer) {
            clearTimeout(this.delayEmitDataChangeEventTimer);
        }
        this.delayEmitDataChangeEventTimer = setTimeout(() => {
            if (this.delayEmitData && Object.keys(this.delayEmitData).length) {
                const changedData = Object.assign({}, this.delayEmitData);
                this.emit(EVENT.data_change, changedData);
            }
            this.delayEmitData = null;
            this.delayEmitDataChangeEventTimer = null;
        }, delay);
    }
}

/**
 * 全局事件管理类实例
 * @type {Events}
 * @private
 */
const events = new Events();

/**
 * 全局事件触发器
 * @type {Events}
 */
export default events;
