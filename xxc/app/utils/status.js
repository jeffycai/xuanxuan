/**
 * 状态存储类
 *
 * @class StatusKeeper
 */
export class StatusKeeper {
    /**
     * 创建一个状态存储类实例
     * @param {number|string} status 当前状态
     * @param {Status} mapper 状态表对象
     * @constructor
     */
    constructor(status, mapper) {
        this.mapper = mapper;
        this.status = mapper.getValue(status);
        if (this.status === undefined) {
            this.status = mapper.defaultValue;
        }
    }

    /**
     * 获取当前状态名称
     * @type {string}
     * @readonly
     * @memberof StatusKeeper
     */
    get name() {
        return this.mapper.getName(this.status);
    }

    /**
     * 获取当前状态值
     * @type {number}
     * @readonly
     * @memberof StatusKeeper
     */
    get value() {
        return this.mapper.getValue(this.status);
    }

    /**
     * 获取当前状态变更事件回调函数
     * @type {Function}
     * @memberof StatusKeeper
     */
    get onChange() {
        return this._onChange;
    }

    /**
     * 设置当前状态变更事件回调函数
     * @param {Function} callback 事件回调函数
     * @memberof StatusKeeper
     */
    set onChange(callback) {
        this._onChange = callback;
    }

    /**
     * 获取检查状态是否允许变更回调函数
     * @type {Function}
     * @memberof StatusKeeper
     */
    get canChange() {
        return this._canChange;
    }

    /**
     * 设置检查状态是否允许变更回调函数
     * @param {Function} callback 事件回调函数
     * @memberof StatusKeeper
     */
    set canChange(callback) {
        this._canChange = callback;
    }

    /**
     * 变更状态
     *
     * @param {string|number} nameOrValue 新的状态值或名称
     * @memberof StatusKeeper
     * @return {void}
     */
    change(nameOrValue) {
        const value = this.mapper.getValue(nameOrValue);
        const oldValue = this.value;
        if (value !== undefined && oldValue !== value) {
            if (!this._canChange || this._canChange(value, oldValue)) {
                this.status = value;
                if (typeof this._onChange === 'function') {
                    this._onChange(value, oldValue, this);
                }
            } else if (DEBUG) {
                console.error(`Status '${oldValue}' cannot change to ${nameOrValue} with the rule.`);
            }
        }
    }

    /**
     * 检查当前状态是否为给定的状态
     * @param {string|number} nameOrValue
     * @return {boolean}
     * @memberof StatusKeeper
     */
    is(nameOrValue) {
        const value = this.mapper.getValue(nameOrValue);
        return value !== undefined && value === this.status;
    }
}

/**
 * 状态管理类（状态表）
 *
 * @class Status
 */
export default class Status {
    /**
     * 创建一个状态管理类
     * @param {Object.<string, number>} statuses 状态表对象
     * @param {string|number} defaultStatus 默认状态
     * @constructor
     */
    constructor(statuses, defaultStatus) {
        /**
         * 按状态值顺序依次存储状态名称
         * @type {Object}
         * @private
         */
        this.$values = {};

        Object.keys(statuses).forEach(name => {
            if (typeof this[name] !== 'undefined') {
                throw new Error(`Cannot create status object, the name '${name}' is not a valid status name.`);
            }
            const value = statuses[name];
            if (typeof value !== 'number') {
                throw new Error(`Cannot create status object, the status value(${value}) must be a number.`);
            }
            this.$values[value] = name;
            this[name] = value;
        });

        if (defaultStatus !== undefined) {
            /**
             * 默认状态
             * @type {number}
             */
            this.defaultStatus = this.getValue(defaultStatus);
        }
        if (this.defaultStatus === undefined) {
            // eslint-disable-next-line prefer-destructuring
            this.defaultStatus = this.values[0];
        }
    }

    /**
     * 获取所有状态名称
     * @type {Array.<string>}
     * @readonly
     * @memberof Status
     */
    get names() {
        return Object.values(this.$values);
    }

    /**
     * 获取所有状态值
     * @type {Array.<number>}
     * @readonly
     * @memberof Status
     */
    get values() {
        return Object.keys(this.$values);
    }

    /**
     * 获取默认状态名称
     * @type {string}
     * @readonly
     * @memberof Status
     */
    get defaultName() {
        return this.getName(this.defaultStatus);
    }

    /**
     * 获取默认状态值
     * @type {number}
     * @readonly
     * @memberof Status
     */
    get defaultValue() {
        return this.getValue(this.defaultStatus);
    }

    /**
     * 获取指定状态的名称
     * @param {string|number} valueOrName 状态值或名称
     * @param {string} defaultName 默认状态名称
     * @return {string}
     * @memberof Status
     */
    getName(valueOrName, defaultName) {
        let name;
        if (typeof valueOrName === 'number') {
            name = this.$values[valueOrName];
        } else if (this[valueOrName] !== undefined) {
            name = valueOrName;
        }
        return name === undefined ? defaultName : name;
    }

    /**
     * 获取指定状态的值
     * @param {string|number} valueOrName 状态值或值
     * @param {number} defaultName 默认状态值
     * @return {number}
     * @memberof Status
     */
    getValue(valueOrName, defaultValue) {
        let value;
        if (typeof valueOrName === 'string') {
            value = this[valueOrName];
        } else if (this.$values[valueOrName] !== undefined) {
            value = valueOrName;
        }
        return value === undefined ? defaultValue : value;
    }

    /**
     * 判断两个状态是否相同
     * @param {string|number} status1 状态1
     * @param {string|number} status2 状态2
     * @return {boolean}
     * @memberof Status
     */
    isSame(status1, status2) {
        return this.getValue(status1) === this.getValue(status2);
    }

    /**
     * 创建一个状态存储类实例
     *
     * @param {string|number} status 状态值或名称
     * @returns {StatusKeeper}
     * @memberof Status
     */
    create(status) {
        if (status === undefined) {
            status = this.defaultValue;
        }
        return new StatusKeeper(status, this);
    }

    /**
     * 状态存储类
     *
     * @constructor StatusKeeper
     * @static
     * @memberof Status
     */
    static Keeper = StatusKeeper;
}
