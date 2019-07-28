import Database from './database';
import {onSwapUser} from '../profile';

/**
 * 当前数据库实例
 * @private
 * @type {Database}
 */
let db = null;

// 当登录用户变更时重新创建数据库实例
onSwapUser(user => {
    db = Database.create(user.identify);
});

export default {
    /**
     * 获取当前数据库实例
     * @type {Database}
     */
    get database() {
        return db;
    }
};
