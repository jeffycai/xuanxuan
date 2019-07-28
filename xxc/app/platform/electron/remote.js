import {ipcRenderer} from 'electron';
import EVENT from './remote-events';

if (process.type !== 'renderer') {
    if (DEBUG) console.error('\n>> Can not send event with ipc in main process, you can use AppRemote.sendToWindows method instead.');
}

/**
 * 已绑定的事件清单
 * @type {Object}
 * @private
 */
const eventsMap = {};

/**
 *  事件 ID 递增变量
 * @type {number}
 * @private
 */
let idSeed = new Date().getTime() + Math.floor(Math.random() * 100000);

/**
 * 调用远程（主进程）方法或获取属性值
 * @param {string} method 远程（主进程）方法或属性
 * @param  {...any} args 调用方法时的参数
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const callRemote = (method, ...args) => {
    return new Promise((resolve, reject) => {
        const callBackEventName = `${EVENT.remote}.${idSeed++}`;
        ipcRenderer.once(callBackEventName, (e, remoteResult) => {
            resolve(remoteResult);
        });
        ipcRenderer.send(EVENT.remote, method, callBackEventName, ...args);
    });
};

/**
 * 使用 IPC 向 Electron 主进程发送事件消息
 * @param  {string}    eventName 事件名称
 * @param  {...any} args 事件参数
 * @return {void}
 */
export const ipcSend = (eventName, ...args) => {
    ipcRenderer.send(eventName, ...args);
};

/**
 * 使用 IPC 绑定进程间事件
 * @param  {string} event 事件名称
 * @param  {function} listener 事件回调函数
 * @return {Symbol} 事件 ID
 */
export const ipcOn = (event, listener) => {
    ipcRenderer.on(event, listener);
    const name = Symbol(event);
    eventsMap[name] = {listener, name: event, ipc: true};
    if (DEBUG) {
        console.collapse('ON IPC EVENT', 'orangeBg', event, 'orangePale');
        console.trace('event', eventsMap[name]);
        console.groupEnd();
    }
    return name;
};

/**
 * 使用 IPC 绑定进程间一次性事件
 * @param  {string} event 事件名称
 * @param  {function} listener 事件回调函数
 * @return {Symbol} 事件 ID
 */
export const ipcOnce = (event, listener) => {
    const name = Symbol(event);
    const bindedListener = (...args) => {
        remoteOff(name);
        listener(...args);
    };
    ipcRenderer.once(event, bindedListener);
    eventsMap[name] = {listener: bindedListener, name: event, ipc: true};
    if (DEBUG) {
        console.collapse('ON IPC ONCE EVENT', 'orangeBg', event, 'orangePale');
        console.trace('event', eventsMap[name]);
        console.groupEnd();
    }
    return name;
};

/**
 * 使用 IPC 在渲染进程绑定主进程上的普通事件
 * @param  {string} event 事件名称
 * @param  {function} listener 事件回调函数
 * @return {string} 事件 ID
 */
export const remoteOn = (event, listener) => {
    const eventId = `${EVENT.remote_on}.${event}.${idSeed++}`;
    const ipcEventName = ipcOn(eventId, (e, ...args) => {
        if (DEBUG) {
            console.collapse('COMMING REMOTE EVENT', 'orangeBg', event, 'orangePale');
            console.trace('event', eventsMap[eventId]);
            let argIdx = 0;
            for (const arg of args) {
                console.log(`arg:${argIdx++}`, arg);
            }
            console.groupEnd();
        }
        listener(...args, e);
    });
    eventsMap[eventId] = {remote: true, id: ipcEventName};
    ipcRenderer.send(EVENT.remote_on, eventId, event);
    if (DEBUG) {
        console.collapse('ON REMOTE EVENT', 'orangeBg', event, 'orangePale');
        console.trace('event', eventsMap[eventId]);
        console.groupEnd();
    }
    return eventId;
};

/**
 * 使用 IPC 在渲染进程触发主进程上的普通事件
 * @param  {string} event 事件名称
 * @param  {...any} args 事件参数
 * @return {string} 事件 ID
 */
export const remoteEmit = (event, ...args) => {
    ipcRenderer.send(EVENT.remote_emit, event, ...args);
    if (DEBUG) {
        console.collapse('cEMIT REMOTE EVENT', 'orangeBg', event, 'orangePale');
        let argIdx = 0;
        for (const arg of args) {
            console.log(`arg:${argIdx++}`, arg);
        }
        console.groupEnd();
    }
};

/**
 * 在当前应用窗口对应的渲染进程向其他应用窗口渲染进程发送消息
 * @param {string} windowName 窗口名称
 * @param {string} eventName 消息事件名称
 * @param  {...any} args 事件参数
 * @return {void}
 */
export const sendToWindow = (windowName, eventName, ...args) => {
    ipcRenderer.send(EVENT.remote_send, windowName, eventName, ...args);
};

/**
 * 在当前应用窗口对应的渲染进程向主窗口渲染进程发送消息
 * @param {string} eventName 消息事件名称
 * @param  {...any} args 事件参数
 * @return {void}
 */
export const sendToMainWindow = (eventName, ...args) => {
    return sendToWindow('main', eventName, ...args);
};

/**
 * 使用 IPC 在渲染进程取消绑定主进程上的普通事件
 * @param  {...string} names 事件名称
 * @return {void}
 */
export const remoteOff = (...names) => {
    names.forEach(name => {
        const event = eventsMap[name];
        if (event) {
            if (event.remote) {
                remoteOff(event.id);
                ipcSend(EVENT.remote_off, name);
            } else if (event.ipc) {
                ipcRenderer.removeListener(event.name, event.listener);
            }
            delete eventsMap[name];
            if (DEBUG) {
                console.collapse('OFF EVENT', 'orangeBg', event.name, 'orangePale');
                if (event.ipc) console.log('ipc', true);
                if (event.remote) console.log('remote', true);
                console.trace('event', event);
                console.groupEnd();
            }
        }
    });
};

/**
 * 绑定主进程通知将要关闭应用程序事件
 * @param {function} listener 事件回调函数
 * @return {Symbol} 事件 ID
 */
export const onRequestQuit = listener => ipcOn(EVENT.remote_app_quit, listener);

/**
 * 绑定主进程通知要打开网址事件
 * @param {function} listener 事件回调函数
 * @return {Symbol} 事件 ID
 */
export const onRequestOpenUrl = listener => ipcOn(EVENT.open_url, listener);

export default {
    EVENT,
    call: callRemote,
    on: remoteOn,
    emit: remoteEmit,
    off: remoteOff,
    ipcOn,
    ipcSend,
    ipcOnce,
    sendToWindow,
    sendToMainWindow,
    onRequestQuit
};
