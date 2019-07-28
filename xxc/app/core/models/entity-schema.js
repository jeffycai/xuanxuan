import {isNotEmptyString} from '../../utils/string-helper';

/**
 * 默认类型表
 * @type {Object<string, string>}
 * @private
 */
const TYPES = {
    int: 'int',
    float: 'float',
    string: 'string',
    any: 'any',
    boolean: 'boolean',
    object: 'object',
    array: 'array',
    timestamp: 'timestamp',
    datetime: 'datetime',
    set: 'set',
    json: 'json',
};

/**
 * 默认值转换器
 * @type {Object<string, function(val: any):any>}
 * @private
 */
const defaultValuesConveter = {
    int: val => {
        if (typeof val !== 'number') {
            val = Number.parseInt(val, 10);
        }
        return val;
    },
    float: val => {
        if (typeof val !== 'number') {
            val = Number.parseFloat(val);
        }
        return val;
    },
    timestamp: val => {
        if (typeof val === 'string') {
            val = new Date(val).getTime();
        }
        if (val < 10000000000) {
            val *= 1000;
        }
        return val;
    },
    string: val => {
        if (val !== null && val !== undefined && typeof val !== 'string') {
            return `${val}`;
        }
        return val;
    },
    boolean: val => {
        if (typeof val === 'string') {
            return val === '1' || val === 'true' || val === 'yes';
        }
        return !!val;
    },
    set: val => {
        if (val instanceof Set) {
            return val;
        }
        if (Array.isArray(val)) {
            return new Set(val);
        }
        const valType = typeof val;
        if (valType === 'string') {
            const set = new Set();
            val.split(',').forEach(x => {
                if (x !== '') set.add(x);
            });
            return set;
        }
        return new Set(val);
    },
    array: val => {
        if (Array.isArray(val)) {
            return val;
        }
        if (typeof val === 'string') {
            return val.split(',');
        }
        return [val];
    },
    datetime: val => {
        if (val instanceof Date) {
            return val;
        }
        return new Date(val);
    },
    json: json => {
        if (typeof val === 'string') {
            if (isNotEmptyString(json)) {
                return JSON.parse(json);
            }
            return null;
        }
        return json;
    }
};

/**
 * 数据库存储实体属性结构管理类，用于定义实体内所有属性的定义
 *
 * @export
 * @class EntitySchema
 */
export default class EntitySchema {
    /**
     * 创建一个数据库存储实体属性结构管理类
     * @param {Object<string,Object<string, any>>} schema 属性结构管理对象
     * @memberof EntitySchema
     */
    constructor(schema) {
        let primaryKeyNumber = 0;
        Object.keys(schema).forEach(name => {
            const meta = schema[name];
            if (meta.type && !TYPES[meta.type]) {
                throw new Error(`Cannot create scheam, because the type(${meta.type}) is not a valid type.`);
            }
            if (meta.primaryKey) {
                primaryKeyNumber += 1;
                this.primaryKey = name;
            }
        });
        if (primaryKeyNumber !== 1) {
            if (DEBUG) {
                console.trace('schema', schema);
            }
            throw new Error(`Cannot create scheam, because there has ${primaryKeyNumber} primary key(s).`);
        }

        /**
         * 属性定义表
         * @type {Object<string, {type: string, unique: boolean, indexed: boolean, convertGetterValue: function(key: string, val: any, entity: Entity):any, convertSetterValue: function(key: string, val: any, entity: Entity):any}>}
         */
        this.schema = schema;
    }

    /**
     * 获取指定名称的属性定义对象
     *
     * @param {string} name 属性名称
     * @param {boolean} [useDefault=false] 如果没有找定义是否使用默认定义
     * @return {{type: string, unique: boolean, indexed: boolean, convertGetterValue: function(key: string, val: any, entity: Entity):any, convertSetterValue: function(key: string, val: any, entity: Entity):any}} 属性定义对象
     * @memberof EntitySchema
     */
    of(name, useDefault = false) {
        const scheam = this.schema[name];
        if (scheam) {
            return Object.assign({
                type: TYPES.any,
                indexed: false,
            }, this.schema[name]);
        }
        if (useDefault) {
            if (typeof useDefault === 'object') {
                return useDefault;
            }
            return {
                type: TYPES.any,
                indexed: false,
            };
        }
        return null;
    }

    /**
     * 转换属性值
     *
     * @param {string} name 属性名称
     * @param {any} value 属性值
     * @param {?{type: string, unique: boolean, indexed: boolean, convertGetterValue: function(key: string, val: any, entity: Entity):any, convertSetterValue: function(key: string, val: any, entity: Entity):any}} meta 属性定义对象
     * @return {any} 转换后的值
     * @memberof EntitySchema
     */
    convertValue(name, value, meta) {
        meta = meta || this.of(name);
        if (meta) {
            if (meta.type && defaultValuesConveter[meta.type]) {
                return defaultValuesConveter[meta.type](value);
            }
            if (value === undefined && meta.defaultValue !== undefined) {
                value = meta.defaultValue;
            }
        }
        return value;
    }

    /**
     * 转换用于读取的属性值
     *
     * @param {string} name 属性名称
     * @param {any} value 属性值
     * @param {Entity} thisObj 要转换的实体对象
     * @return {any} 转换后的值
     * @memberof EntitySchema
     */
    convertGetterValue(name, value, thisObj) {
        const meta = this.of(name);
        if (meta) {
            if (meta.getter) {
                return meta.getter.call(thisObj, value, thisObj);
            }
            if (meta.type && defaultValuesConveter[meta.type]) {
                return defaultValuesConveter[meta.type](value);
            }
            if (value === undefined && meta.defaultValue !== undefined) {
                value = meta.defaultValue;
            }
        }
        return value;
    }

    /**
     * 转换用于存储的属性值
     *
     * @param {string} name 属性名称
     * @param {any} value 属性值
     * @param {Entity} thisObj 要转换的实体对象
     * @return {any} 转换后的值
     * @memberof EntitySchema
     */
    convertSetterValue(name, value, thisObj) {
        const meta = this.of(name);
        if (meta) {
            if (meta.setter) {
                return meta.setter.call(thisObj, value, thisObj);
            }
            if (meta.type && defaultValuesConveter[meta.type]) {
                return defaultValuesConveter[meta.type](value);
            }
            if (value === undefined && meta.defaultValue !== undefined) {
                value = meta.defaultValue;
            }
        }
        return value;
    }

    /**
     * 扩展更多属性定义并返回一个新的属性结构管理类实例
     *
     * @param {Object<string,Object<string, any>>} newSchema 新的数学定义表
     * @returns {EntitySchema} 新的属性结构管理类实例
     * @memberof EntitySchema
     */
    extend(newSchema) {
        return EntitySchema.extend(this, newSchema);
    }

    /**
     * 获取用于定义 Dexie 表的格式字符串
     * @memberof EntitySchema
     * @type {string}
     */
    get dexieFormat() {
        const formats = [this.primaryKey];
        Object.keys(this.schema).forEach(name => {
            const meta = this.schema[name];
            if (meta.indexed !== false) {
                if (meta.unique) {
                    formats.push(`&${name}`);
                } else if (meta.multiValued) {
                    formats.push(`*${name}`);
                } else if (meta.indexed) {
                    formats.push(name);
                }
            }
        });
        return formats.join(',');
    }

    /**
     * 扩展一个属性结构管理器并返回一个新的属性结构管理类实例
     *
     * @static
     * @param {EntitySchema} parent 要扩展的属性结构管理器实例
     * @param {Object<string,Object<string, any>>} newSchema 新的数学定义表
     * @returns {EntitySchema} 新的属性结构管理类实例
     * @memberof EntitySchema
     */
    static extend(parent, newSchema) {
        return new EntitySchema(Object.assign({}, parent.schema, newSchema));
    }
}
