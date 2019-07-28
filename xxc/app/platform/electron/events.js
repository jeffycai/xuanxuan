import EventEmitter from './event-emitter';

/**
 * Electron 事件管理类
 *
 * @class Events
 * @extends {EventEmitter}
 */
class Events extends EventEmitter {
    /**
     * 创建一个Electron 事件管理类实例
     * @memberof Events
     */
    constructor() {
        super();
        this.eventsMap = {};
        this.isMainProcess = !process.browser && process.type !== 'renderer';
        if (this.setMaxListeners) {
            this.setMaxListeners(20);
        }
    }

    /**
     * 绑定事件并返回一个 {Sysmbo} 作为事件绑定 ID 用于取消事件
     * @param  {string} event 事件名称
     * @param  {Function} listener 事件回调函数
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
                console.groupEnd();
            }
        }
    }
}

/**
 * 全局事件触发器
 * @type {Events}
 */
const events = new Events();

export default events;
