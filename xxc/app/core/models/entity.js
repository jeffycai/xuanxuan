import UUID from 'uuid/v4';
import Schema from './entity-schema';
import timeSequence from '../../utils/time-sequence';

/**
 * 集成实体存储类
 *
 * @export
 * @class Entity
 * @abstract
 */
export default class Entity {
    /**
     * 实体名称
     * @type {string}
     * @memberof Entity
     */
    static NAME = 'Entity';

    /**
     * 数据库存储实体属性结构管理器
     *
     * @type {EntitySchema}
     * @static
     * @memberof Entity
     */
    static SCHEMA = new Schema({
        gid: {type: 'string', primaryKey: true},
        id: {type: 'int', indexed: true},
    });

    /**
     * 创建一个基础实体类实例
     * @param {!Object<string, any>} data 实体属性对象
     * @param {!string} entityType 实体类型名称
     * @memberof Entity
     */
    constructor(data, entityType) {
        /**
         * 内部数据存储对象
         * @type {Object<string, any>}
         * @private
         */
        this.$ = {};

        if (typeof data === 'object') {
            this.$set(data);
        }

        this.ensureGid();

        /**
         * 实体类型名称
         * @type {string}
         * @private
         */
        this._entityType = entityType;

        /**
         * 跟踪实体属性变更的 ID，每次更新需要更高此值为一个全局唯一的数字
         * @type {number}
         * @private
         */
        this._updateId = timeSequence();
    }

    /**
     * 从属性对象更新此实体属性
     *
     * @param {...Object<string, any>} data 属性对象
     * @return {Entity} 返回自身用于链式调用
     * @memberof Entity
     */
    assign(...data) {
        Object.assign(this, ...data);
        return this;
    }

    /**
     * 调用此方法确保实体拥有合适的 GID 属性
     *
     * @memberof Entity
     * @return {void}
     */
    ensureGid() {
        if (!this.$.gid) {
            this.$.gid = UUID();
        }
    }

    /**
     * 获取用于数据存储的简单对象
     *
     * @return {Object<string, any>} 用于的存储对象
     * @memberof Entity
     */
    plain() {
        this.ensureGid();
        return this.$;
    }

    /**
     * 获取跟踪实体属性变更的 ID，每次更新需要更高此值为一个全局唯一的数字
     * @memberof Entity
     * @type {number}
     */
    get updateId() {
        return this._updateId;
    }

    /**
     * 调用此方法将会更新用于跟踪实体属性变更 ID
     *
     * @memberof Entity
     * @return {void}
     */
    renewUpdateId() {
        this._updateId = timeSequence();
    }

    /**
     * 获取实体类型
     * @memberof Entity
     * @type {string}
     * @readonly
     */
    get entityType() {
        return this._entityType || Entity.name;
    }

    /**
     * 获取 GID 属性（全局唯一编号）
     * @memberof Entity
     * @type {string}
     * @readonly
     */
    get gid() {
        return this.$get('gid');
    }

    /**
     * 获取 ID 属性
     * @memberof Entity
     * @type {number}
     */
    get id() {
        return this.$get('id', 0);
    }

    /**
     * 设置 ID 属性
     * @param {number} newId  ID 属性
     * @memberof Entity
     */
    set id(newId) {
        this.$set('id', newId);
    }

    /**
     * 获取数据库存储实体属性结构管理器
     *
     * @readonly
     * @memberof Entity
     * @type {EntitySchema}
     */
    // eslint-disable-next-line class-methods-use-this
    get schema() {
        return Entity.SCHEMA;
    }

    /**
     * 设置内部数据属性
     * @param {String|Object<string, any>} key 如果为 `string` 则作为要设置的属性名称，如果为 `Object<string, any>` 则作为属性对象批量设置属性值，此时 `val` 参数将会被忽略
     * @param {any} val 当 `key` 如果为 `string` 时要设置的属性值
     * @param {boolean} [ignoreUpdateId=false] 不更新用于跟踪实体属性变更 ID
     * @returns {Entity} 返回自身用于链式调用
     */
    $set(key, val, ignoreUpdateId = false) {
        if (typeof key === 'object') {
            Object.keys(key).forEach(k => {
                this.$set(k, key[k], true);
            });
        } else {
            const {schema} = this;
            if (schema) {
                const meta = schema.of(key);
                if (meta && meta.aliasFor) {
                    key = meta.aliasFor;
                }
                val = schema.convertSetterValue(key, val, this);
            }
            this.$[key] = val;
        }
        if (!ignoreUpdateId) {
            this.renewUpdateId();
        }
        return this;
    }

    /**
     * 获取内部数据属性的值
     * @param  {string} key 属性名称
     * @param  {string} defaultValue 默认值
     * @return {any} 内部数据属性值
     */
    $get(key, defaultValue) {
        let value = this.$[key];
        const {schema} = this;
        if (schema) {
            const meta = schema.of(key);
            if (meta && meta.aliasFor) {
                key = meta.aliasFor;
            }
            value = schema.convertGetterValue(key, value, this);
        }
        if (value === undefined) {
            value = defaultValue;
        }
        return value;
    }
}
