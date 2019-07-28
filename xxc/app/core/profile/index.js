// eslint-disable-next-line import/no-unresolved
import events from '../events';
import User from './user';
import Lang from '../lang';
import notice from '../notice';
import {getUserFromStore} from './user-store';

/**
 * 事件表
 * @type {Object<string, string>}
 * @private
 */
const EVENT = {
    swap: 'profile.user.swap',
};

/**
 * 存储当前登录的用户实例
 * @type {User}
 * @private
 */
let user = null;

/**
 * 创建用户实例
 * @param {Object} userData 用户存储数据对象
 * @return {User}
 */
export const createUser = userData => {
    if (!(userData instanceof User)) {
        const newUser = new User(userData);
        newUser.$set(Object.assign({}, getUserFromStore(newUser.identify), userData));
        if (userData.password) {
            newUser.password = userData.password;
        }
        return newUser;
    }
    return userData;
};

/**
 * 设置当前登录的用户实例
 * @param {!User} newUser 新的用户实例
 * @return {User} 用户对象
 */
export const setCurrentUser = newUser => {
    if (!(newUser instanceof User)) {
        throw new Error('Cannot set user for profile, because the user param is not User instance.');
    }

    const oldUser = user;
    if (oldUser) {
        oldUser.destroy();
    }
    user = newUser;
    user.enableEvents();

    if (DEBUG) {
        console.collapse('Profile.setUser', 'tealBg', user.identify, 'tealPale');
        console.log('user', user);
        console.groupEnd();
    }
    if (!oldUser || oldUser.identify !== user.identify) {
        notice.update();
        events.emit(EVENT.swap, user);
    }
    return user;
};

/**
 * 绑定切换当前用户事件
 * @param {Funcion} listener 事件回调函数
 * @return {Symbol} 使用 `Symbol` 存储的事件 ID，用于取消事件
 */
export const onSwapUser = listener => (events.on(EVENT.swap, listener));

/**
 * 绑定用户状态变更事件
 * @param {Funcion} listener 事件回调函数
 * @return {Symbol} 使用 `Symbol` 存储的事件 ID，用于取消事件
 */
export const onUserStatusChange = listener => (events.on(User.EVENT.status_change, listener));

/**
 * 绑定用户配置变更事件
 * @param {Funcion} listener 事件回调函数
 * @return {Symbol} 使用 `Symbol` 存储的事件 ID，用于取消事件
 */
export const onUserConfigChange = listener => (events.on(User.EVENT.config_change, listener));

/**
 * 获取上次保存的用户数据
 * @return {Object}
 */
export const getLastSavedUser = () => getUserFromStore();

/**
 * 判定给定的用户或成员是否是当前登录用户
 * @param {User|Member} theUser 要判断的用户或成员实例
 * @return {boolean}
 */
export const isCurrentUser = theUser => (theUser && user && user.id === theUser.id);

/**
 * 获取当前登录的用户
 * @return {User}
 */
export const getCurrentUser = () => user;

/**
 * 获取当前登录的用户状态
 * @return {number}
 */
export const getUserStatus = () => user && user.status;

/**
 * 检查当前登录的用户是否验证通过过
 * @returns {boolean} 如果为 `true` 则验证通过，否则为没有验证通过
 */
export const isUserVertified = () => user && user.isVertified;

/**
 * 检查当前登录的用户是否在线
 * @returns {boolean}  如果为 `true` 则用户在线，否则为不在线
 */
export const isUserOnline = () => user && user.isOnline;

export default {
    EVENT,
    createUser,
    setUser: setCurrentUser,
    onSwapUser,
    onUserStatusChange,
    onUserConfigChange,
    getLastSavedUser,
    isCurrentUser,

    /**
     * 获取当前登录的用户实例
     * @type {User}
     */
    get user() {
        return user;
    },

    /**
     * 获取当前登录的用户 ID
     * @type {number}
     */
    get userId() {
        return user && user.id;
    },

    /**
     * 检查当前登录的用户是否在线
     * @type {boolean}
     */
    get isUserOnline() {
        return user && user.isOnline;
    },

    /**
     * 检查当前登录的用户是否验证通过过
     * @type {boolean}
     */
    get isUserVertified() {
        return user && user.isVertified;
    },

    /**
     * 获取当前登录的用户状态编号
     * @type {number}
     */
    get userStatus() {
        return user && user.status;
    },

    /**
     * 获取当前用户状态描述文本
     * @type {string}
     */
    get summaryText() {
        if (user) {
            return `${user.displayName} [${Lang.string(`member.status.${user.statusName}`)}]`;
        }
        return '';
    },

    /**
     * 获取当前用户配置对象
     */
    get userConfig() {
        return user ? user.config : {};
    },

    /**
     * 获取当前用户用户名
     */
    get userAccount() {
        return user ? user.account : '';
    }
};
