import Store from '../../utils/store';
import plainObject from '../../utils/plain';

/**
 * 用户对象在本地存储中存储键值前缀
 * @private
 * @type {string}
 */
const KEY_USER_PREFIX = 'USER::';

/**
 * 用户标识字符串清单在本地存储中存储键值前缀
 * @private
 * @type {string}
 */
const KEY_USER_LIST = 'USER_LIST';

/**
 * 获取本地存储中保存的所有用户标识字符串清单
 * @return {string[]} 所有用户标识字符串清单
 */
export const getAllUsersFromStore = () => {
    return Store.get(KEY_USER_LIST, {});
};

/**
 * 根据用户标识字符串获取本地存储中保存的用户对象
 * @param {string} identify 用户标识字符串
 * @returns {Object} 保存的用户对象
 */
export const getUserFromStore = (identify) => {
    if (identify) {
        const user = Store.get(`${KEY_USER_PREFIX}${identify}`);
        if (user) {
            user.identify = identify;
            if (user.rememberPassword === undefined) {
                user.rememberPassword = true;
            }
        }
        return user;
    }
    const users = getAllUsersFromStore();
    if (!users) {
        return null;
    }
    let maxTime = 0;
    let maxTimeIndentify = null;
    Object.keys(users).forEach(identify => {
        const time = users[identify];
        if (time > maxTime) {
            maxTime = time;
            maxTimeIndentify = identify;
        }
    });
    return maxTimeIndentify ? getUserFromStore(maxTimeIndentify) : null;
};

/**
 * 获取本地存储中保存的所有用户
 * @return {Object[]} 保存的用户列表
 */
export const getUserListFromStore = () => {
    const users = getAllUsersFromStore();
    return Object.keys(users).map(getUserFromStore).sort((x, y) => y.lastLoginTime - x.lastLoginTime);
};

/**
 * 将用户对象报错到本地存储
 * @param {Object} user 要保存的用户对象
 * @return {void}
 */
export const saveUserToStore = (user) => {
    const {identify} = user;
    if (!identify) {
        throw new Error('Cannot save user, because user.indentify property is not defined.');
    }

    const userData = typeof user.plain === 'function' ? user.plain() : plainObject(user);
    if (!userData.rememberPassword) {
        delete userData.password;
    }

    Store.set(`${KEY_USER_PREFIX}${identify}`, userData);

    const users = getAllUsersFromStore();
    users[identify] = new Date().getTime();
    Store.set(KEY_USER_LIST, users);
};

/**
 * 从本地存储移除指定的用户
 * @param {string|{identify: string}} user 要移除的用户标识字符串或者用户对象
 * @return {void}
 */
export const removeUserFromStore = (user) => {
    const identify = typeof user === 'object' ? user.identify : user;

    if (!identify) {
        throw new Error('Cannot remove user, because user.indentify property is not defined.');
    }

    Store.remove(`${KEY_USER_PREFIX}${identify}`);

    const users = getAllUsersFromStore();
    if (users[identify]) {
        delete users[identify];
        Store.set(KEY_USER_LIST, users);
    }
};

export default {
    allUsers: getAllUsersFromStore,
    getUser: getUserFromStore,
    userList: getUserListFromStore,
    saveUser: saveUserToStore,
    removeUser: removeUserFromStore,
};
