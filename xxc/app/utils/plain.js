/** @module plain */

/**
 * 将一个 Object 值转换为简单化形式
 * 简单化是指移除所有函数以及 Getter 或 Setter，忽略以属性名称 `$` 开头的属性，便于持久化存储
 * @param {any} obj 要操作的值
 * @return {any}
 * @ignore
 */
const plain = (obj) => {
    if (obj === undefined) obj = this;
    if (Array.isArray(obj)) {
        return obj.map(plain);
    }
    const objType = typeof obj;
    if (obj !== null && objType === 'object') {
        const plainObj = {};
        Object.keys(obj).forEach(key => {
            const val = obj[key];
            const typeVal = typeof val;
            if (key && key[0] !== '$' && typeVal !== 'function') {
                plainObj[key] = typeVal === 'object' ? plain(val) : val;
            }
        });
        return plainObj;
    }
    if (objType === 'function') return;
    return obj;
};

/**
 * 将一个 Object 值转换为简单化形式
 * 简单化是指移除所有函数以及 Getter 或 Setter，忽略以属性名称 '$' 开头的属性，便于持久化存储
 * @param {any} obj 要操作的值
 * @return {any}
 * @function
 */
export default plain;
