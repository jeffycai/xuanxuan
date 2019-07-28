import Dexie from 'dexie';
import Message from '../models/chat-message';

/**
 * 数据库版本
 * @type {number}
 * @private
 */
const DB_VERSION = 1;

/**
 * 上次创建的数据库实例
 * @type {Database}
 * @private
 */
let lastCreateDb = null;

if (DEBUG) {
    global.$.Dexie = Dexie;
}

/**
 * 数据库管理类
 * @class Database
 */
export default class Database {
    /**
     * 数据库版本
     *
     * @static
     * @memberof Database
     */
    static VERSION = DB_VERSION;

    /**
     * 创建数据库实例
     *
     * @static
     * @param {string} userIdentify 数据库标识
     * @returns {Database}
     * @memberof Database
     */
    static create(userIdentify) {
        if (typeof userIdentify === 'object') {
            userIdentify = userIdentify.identify;
        }
        if (!lastCreateDb) {
            lastCreateDb = new Database(userIdentify);
        } else if (lastCreateDb.identify !== userIdentify) {
            lastCreateDb.destroy();
            lastCreateDb = new Database(userIdentify);
        }
        return lastCreateDb;
    }

    /**
     * 创建一个数据库管理类实例
     * @param {string} userIdentify 数据库标识
     * @constructor
     * @memberof Database
     */
    constructor(userIdentify) {
        if (typeof userIdentify === 'object') {
            userIdentify = userIdentify.identify;
        }

        /**
         * 数据库标识
         * @private
         * @type {string}
         */
        this._userIdentify = userIdentify;

        // 判断数据库是否存在
        Dexie.exists(userIdentify).then(exists => {
            this._exists = exists;
            return exists;
        }).catch(error => {
            if (DEBUG) {
                console.warn('Dexie error', error);
            }
        });

        /**
         * 当前数据库实例
         * @type {Dexie}
         * @private
         */
        this._db = new Dexie(userIdentify);
        this._db.version(DB_VERSION).stores({
            // [Entity.NAME]: Entity.SCHEMA.dexieFormat,
            // [Member.NAME]: Member.SCHEMA.dexieFormat,
            // [Chat.NAME]: Chat.SCHEMA.dexieFormat,
            [Message.NAME]: Message.SCHEMA.dexieFormat,
        });
    }

    /**
     * 获取当前数据库是否存在
     *
     * @readonly
     * @memberof Database
     * @type {boolean}
     */
    get isExists() {
        return this._exists;
    }

    /**
     * 获取当前数据库标识
     *
     * @readonly
     * @memberof Database
     * @type {string}
     */
    get identify() {
        return this._userIdentify;
    }

    // get members() {
    //     return this._db[Member.NAME];
    // }

    // get chats() {
    //     return this._db[Chat.NAME];
    // }

    /**
     * 获取数据库 ChatMessage 表
     *
     * @readonly
     * @memberof Database
     * @type {Dexie.Table}
     */
    get chatMessages() {
        return this._db[Message.NAME];
    }

    /**
     * 获取 Dexie 数据库实例
     *
     * @readonly
     * @memberof Database
     * @type {Dexie}
     */
    get all() {
        return this._db;
    }

    /**
     * 关闭并销毁数据库实例
     *
     * @memberof Database
     * @return {void}
     */
    destroy() {
        this._db.close();
    }
}
