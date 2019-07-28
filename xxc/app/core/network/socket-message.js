import Config from '../../config';
import Lang from '../lang';

/**
 * Socket 服务消息类
 *
 * @export
 * @class SocketMessage
 */
export default class SocketMessage {
    /**
     * 创建一个 Socket 服务消息类
     * @param {Object<string, any>} data 属性数据对象
     * @memberof SocketMessage
     */
    constructor(data) {
        /**
         * 操作模块名称
         * @type {string}
         */
        this.module; // eslint-disable-line

        /**
         * 操作方法名称
         * @type {string}
         */
        this.method; // eslint-disable-line

        /**
         * 操作方法的参数
         * @type {Array}
         */
        this.params; // eslint-disable-line

        /**
         * 操作数据
         * @type {any}
         */
        this.data; // eslint-disable-line

        /**
         * 操作结果
         * @type {string}
         */
        this.result; // eslint-disable-line

        /**
         * 版本号
         * @type {string}
         */
        this.v; // eslint-disable-line

        Object.assign(this, {
            module: 'chat',
            v: Config.pkg.version,
            lang: Lang.name
        }, data);
    }

    /**
     * 获取路径名称
     *
     * @type {string}
     * @readonly
     * @memberof SocketMessage
     */
    get pathname() {
        const pathnames = [this.module];
        if (this.method !== undefined) {
            pathnames.push(this.method);
        }
        return pathnames.join('/').toLowerCase();
    }

    /**
     * 获取 JSON 字符串形式
     *
     * @memberof SocketMessage
     * @type {string}
     * @readonly
     */
    get json() {
        return JSON.stringify(this);
    }

    /**
     * 获取此消息待办的操作是否成功
     *
     * @memberof SocketMessage
     * @type {string}
     * @readonly
     */
    get isSuccess() {
        return this.result === 'success' || (this.result === undefined);
    }

    /**
     * 从 JSON 字符串创建 SocketMessage 类实例，如果 JSON 内容是一个数组，则返回一个 SocketMessage 实例数组
     * @param  {string} json JSON 字符串
     * @static
     * @return {ScoketMessage|ScoketMessage[]} SocketMessage 类实例或 SocketMessage 实例数组
     */
    static fromJSON(json) {
        try {
            if (Array.isArray(json)) {
                if (DEBUG) {
                    console.groupCollapsed('%cBuild socket message from buffer array.', 'display: inline-block; font-size: 10px; color: #673AB7; background: #D1C4E9; border: 1px solid #D1C4E9; padding: 1px 5px; border-radius: 2px;');
                    console.log('buffer', json);
                    console.groupEnd();
                }
                json = json.map(x => x.toString()).join('');
            }
            if (typeof json !== 'string') json = json.toString();
            json = json.trim();
            while (json.length && (json[json.length - 1] === '\n' || json.charCodeAt(json.length - 1) === 8)) {
                json = json.substring(0, json.length - 1);
            }
            const firstEOF = json.indexOf('\n');
            if (firstEOF > 0 && firstEOF < json.length) {
                const objArray = [];
                json.split('\n').forEach(str => {
                    str = str.trim();
                    if (str.length && str.startsWith('{')) {
                        objArray.push(str);
                    }
                });
                json = (objArray.length > 1) ? (`[${objArray.join(',')}]`) : (objArray[0] || '');
                if (DEBUG) {
                    console.groupCollapsed('%cSocket message contains "\\n", make it as json array.', 'display: inline-block; font-size: 10px; color: #673AB7; background: #D1C4E9; border: 1px solid #D1C4E9; padding: 1px 5px; border-radius: 2px;');
                    console.log('json', json);
                    console.groupEnd();
                }
            }
            const data = JSON.parse(json);
            if (Array.isArray(data)) {
                const msgs = [];
                data.forEach(x => {
                    if (Array.isArray(x)) {
                        msgs.push(...x.map(y => new SocketMessage(y)));
                    } else {
                        msgs.push(new SocketMessage(x));
                    }
                });
                return msgs;
            }
            return new SocketMessage(data);
        } catch (error) {
            if (DEBUG) {
                console.groupCollapsed('%cError: SocketMessage from json', 'color:red', error);
                console.log('raw', json);
                console.log('raw string', json && json.toString());
                console.groupEnd();
            }
        }
    }

    /**
     * 创建一个 SocketMessage 实例
     *
     * @static
     * @param {Object|SocketMessage} msg 一个 SocketMessage 实例或者用于创建实例的属性对象
     * @return {SocketMessage} SocketMessage 实例
     * @memberof SocketMessage
     */
    static create(msg) {
        if (typeof msg === 'string') {
            msg = {method: msg};
        } else if (msg instanceof SocketMessage) {
            return msg;
        }
        return new SocketMessage(msg);
    }
}
