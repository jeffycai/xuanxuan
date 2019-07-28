import Entity from './entity';
import Pinyin from '../../utils/pinyin';
import Status from '../../utils/status';
import {matchScore} from '../../utils/search-score';
import Lang, {isJustLangSwitched} from '../lang';

/**
 * 搜索匹配分值表
 * @type {Object[]}
 * @private
 */
const MATCH_SCORE_MAP = [
    {name: 'namePinyin', equal: 100, include: 50},
    {name: 'displayName', equal: 100, include: 50},
    {name: 'account', equal: 100, include: 50},
    {name: 'email', equal: 70, include: 30},
    {name: 'phone', equal: 70, include: 30},
    {name: 'site', equal: 50, include: 25},
];

/**
 * 成员状态管理器
 * @type {Status}
 * @private
 */
export const STATUS = new Status({
    unverified: 0, // 未登录
    disconnect: 1, // 登录过，但掉线了
    logined: 2, // 登录成功
    online: 3, // 在线
    busy: 4, // 忙碌
    away: 5, // 离开
}, 0);

/**
 * 成员类
 *
 * @export
 * @class Member
 * @extends {Entity}
 */
export default class Member extends Entity {
    /**
     * 实体名称
     * @type {string}
     * @memberof Member
     */
    static NAME = 'Member';

    /**
     * 成员状态管理器
     *
     * @static
     * @memberof Member
     * @type {Status}
     */
    static STATUS = STATUS;

    /**
     * 数据库存储实体属性结构管理器
     *
     * @type {EntitySchema}
     * @static
     * @memberof Member
     */
    static SCHEMA = Entity.SCHEMA.extend({
        account: {type: 'string', unique: true},
        email: {type: 'string', indexed: true},
        phone: {type: 'string', indexed: true},
        mobile: {type: 'string', indexed: true},
        realname: {type: 'string', indexed: true},
        realnames: {type: 'json'},
        site: {type: 'string'},
        avatar: {type: 'string', indexed: true},
        role: {type: 'string'},
        gender: {type: 'string'},
        dept: {type: 'int', indexed: true},
        admin: {type: 'string'},
        deleted: {type: 'boolean'},
    });

    /**
     * 创建一个成员类实例
     * @param {Object<string, any>} data 成员属性对象
     * @param {string} [entityType=Member.NAME] 实体类型名称
     * @memberof Member
     */
    constructor(data, entityType = Member.NAME) {
        super(data, entityType);
        /**
         * 成员状态
         * @type {Status}
         * @private
         */
        this._status = STATUS.create(this.$.status);
    }

    /**
     * 获取数据库存储实体属性结构管理器
     *
     * @readonly
     * @memberof Member
     * @type {EntitySchema}
     */
    // eslint-disable-next-line class-methods-use-this
    get schema() {
        return Member.SCHEMA;
    }

    /**
     * 获取是否已经删除
     * @memberof Member
     * @type {boolean}
     */
    get isDeleted() {
        return this.$get('deleted');
    }

    /**
     * 获取状态值
     * @memberof Member
     * @type {number}
     */
    get status() {
        return this._status.value;
    }

    /**
     * 获取状态名称
     * @memberof Member
     * @type {string}
     * @readonly
     */
    get statusName() {
        return this._status.name;
    }

    /**
     * 设置成员状态
     * @param {string|number} newStatus 成员状态值或名称
     * @memberof Member
     */
    set status(newStatus) {
        this._status.change(newStatus);
        this.renewUpdateId();
    }

    /**
     * 获取是否状态为在线
     * @memberof Member
     * @type {boolean}
     * @readonly
     */
    get isOnline() {
        return this.status >= STATUS.logined;
    }

    /**
     * 获取是否状态是否为离线
     * @memberof Member
     * @type {boolean}
     * @readonly
     */
    get isOffline() {
        return !this.isOnline;
    }

    /**
     * 获取是否状态是否为忙碌
     * @memberof Member
     * @type {boolean}
     * @readonly
     */
    get isBusy() {
        return this._status.is(STATUS.busy);
    }

    /**
     * 判断当前状态是否是给定的状态
     * @memberof Member
     * @param {number|string} status 要判断的状态值或状态名称
     * @return {boolean} 如果为 `true` 则为给定的状态，否则不是
     */
    isStatus(status) {
        return this._status.is(status);
    }

    /**
     * 判断成员账号是否为给定的值
     *
     * @param {string} account 要判断的用户名
     * @return {boolean} 如果为 `true` 则为给定的值，否则不是
     * @memberof Member
     */
    isMember(account) {
        return this.account === account;
    }

    /**
     * 获取性别
     * @memberof Member
     * @type {string}
     */
    get gender() {
        return this.$get('gender');
    }

    /**
     * 获取部门编号
     * @memberof Member
     * @type {number}
     */
    get dept() {
        return this.$get('dept');
    }

    /**
     * 从系统获取部门信息
     * @param {{members: {getDept: function(dept: number):Object}}} app 用于获取系统部门信息的辅助对象
     * @return {Object} 部门信息对象
     * @memberof Member
     */
    getDept(app) {
        const {dept} = this;
        if (dept && !this._dept) {
            this._dept = app.members.getDept(dept);
        }
        return this._dept;
    }

    /**
     * 获取部门名称
     *
     * @param {{members: {getDept: function(dept: number):Object}}} app 用于获取系统部门信息的辅助对象
     * @return {string} 部门名称
     * @memberof Member
     */
    getDeptName(app) {
        const dept = this.getDept(app);
        return dept && dept.name;
    }

    /**
     * 获取部门完整名称
     *
     * @param {{members: {getDept: function(dept: number):Object}}} app 用于获取系统部门信息的辅助对象
     * @returns {string} 部门完整名称
     * @memberof Member
     */
    getDeptFullName(app) {
        const dept = this.getDept(app);
        return dept && dept.fullName;
    }

    /**
     * 获取是否为超级管理员
     * @memberof Member
     * @type {boolean}
     * @readonly
     */
    get isSuperAdmin() {
        return this.$get('admin') === 'super';
    }

    /**
     * 获取是否为管理员
     * @memberof Member
     * @type {boolean}
     * @readonly
     */
    get isAdmin() {
        return this.$get('admin') !== 'no';
    }

    /**
     * 获取用户真实姓名的多语言配置
     *
     * @readonly
     * @memberof Member
     */
    get realnames() {
        return this.$get('realnames');
    }

    /**
     * 获取用户用户真实姓名
     * @memberof Member
     * @type {string}
     */
    get realname() {
        const {realnames} = this;
        if (realnames) {
            if (realnames.cn && !realnames['zh-cn']) {
                realnames['zh-cn'] = realnames.cn;
            }
            if (realnames.tw && !realnames['zh-tw']) {
                realnames['zh-tw'] = realnames.tw;
            }
            const realname = realnames[Lang.name];
            if (realname) {
                return realname;
            }
        }
        return this.$get('realname');
    }

    /**
     * 设置用户真实姓名
     * @param {string} realname 用户真实姓名
     * @memberof Member
     */
    set realname(realname) {
        this.$set('realname', realname);
    }

    /**
     * 获取用户账号
     * @memberof Member
     * @type {string}
     * @readonly
     */
    get account() {
        return this.$get('account');
    }

    /**
     * 获取用户头像图片地址
     * @memberof Member
     * @type {string}
     * @readonly
     */
    get avatar() {
        return this.$get('avatar');
    }

    /**
     * 获取用户电话号码
     * @memberof Member
     * @type {string}
     * @readonly
     */
    get phone() {
        return this.$get('phone');
    }

    /**
     * 获取用户移动电话
     * @memberof Member
     * @type {string}
     * @readonly
     */
    get mobile() {
        return this.$get('mobile');
    }

    /**
     * 获取用户电子邮件地址
     * @memberof Member
     * @type {string}
     * @readonly
     */
    get email() {
        return this.$get('email');
    }

    /**
     * 从系统获取用户头像图片地址
     *
     * @param {string} serverUrl 服务器地址
     * @return {string} 用户头像图片地址
     * @memberof Member
     */
    getAvatar(serverUrl) {
        let {avatar} = this;
        if (avatar && avatar.startsWith('$')) {
            avatar = avatar.substr(1);
        } else if (serverUrl && avatar && !avatar.startsWith('https://') && !avatar.startsWith('http://') && !avatar.startsWith('file://')) {
            if (!(serverUrl instanceof URL)) {
                serverUrl = new URL(serverUrl);
            }
            const serverUrlRoot = `${serverUrl.protocol}//${serverUrl.hostname}/`;
            avatar = serverUrlRoot + avatar;
        }
        return avatar;
    }

    /**
     * 获取用户角色代号
     * @memberof Member
     * @type {string}
     * @readonly
     */
    get role() {
        return this.$get('role');
    }

    /**
     * 从系统获取角色名称
     *
     * @param {{members: {getRoleName: function(role: string):string}}} app 用于获取系统部门信息的辅助对象
     * @return {string} 角色名称
     * @memberof Member
     */
    getRoleName(app) {
        const {role} = this;
        if (role && (isJustLangSwitched() || !this._role)) {
            this._role = app.members.getRoleName(role);
        }
        return this._role;
    }

    /**
     * 获取限时名称
     * @memberof Member
     * @type {string}
     * @readonly
     */
    get displayName() {
        let name = this.$get('realname', `[${this.account}]`);
        if (!name) {
            name = `User-${this.id}`;
        }
        return name;
    }

    /**
     * 获取用户显示名称的拼音字符串（通常用于检索和排序）
     * @readonly
     * @memberof Member
     * @type {string}
     */
    get namePinyin() {
        if (!this._namePinyin) {
            this._namePinyin = Pinyin(this.displayName);
        }
        return this._namePinyin;
    }

    /**
     * 获取成员与给定的关键字匹配分值
     * @memberof Member
     * @param {string[]} keys 关键字列表
     * @return {number} 匹配的分值
     */
    getMatchScore(keys) {
        return matchScore(MATCH_SCORE_MAP, this, keys);
    }

    /**
     * 创建一个成员实例
     *
     * @static
     * @param {Objec|Member} member 成员属性对象
     * @return {Member} 成员实例
     * @memberof Member
     */
    static create(member) {
        if (member instanceof Member) {
            return member;
        }
        return new Member(member);
    }

    /**
     * 对成员列表进行排序，排序规则 `orders` 可以为以下值：
     * - `function(m1: Member, m2: Member):number`，自定义排序函数；
     * - 一个用逗号分隔的根据属性排序的属性名称表；
     * - 根据属性排序的属性名称表数组。
     * 默认的排序规则为：`['me', 'status', '-namePinyin', '-id']`。
     * @param  {Member[]} members 要排序的成员列表
     * @param  {array|string|function(m1: Member, m2: Member):number}  orders 排序规则
     * @param  {{id: number}|number} userMe 当前登录的用户 ID 或者用户对象
     * @return {Member[]} 排序后的成员列表
     * @static
     * @memberof Member
     */
    static sort(members, orders, userMe) {
        if (members.length < 2) {
            return members;
        }
        if (typeof orders === 'function') {
            return members.sort(orders);
        }
        if (!orders || orders === 'default' || orders === true) {
            orders = ['me', 'status', '-namePinyin', '-id'];
        } else if (typeof orders === 'string') {
            orders = orders.split(' ');
        }
        let isFinalInverse = false;
        if (orders[0] === '-' || orders[0] === -1) {
            isFinalInverse = true;
            orders.shift();
        }
        const userMeId = (typeof userMe === 'object') ? userMe.id : userMe;
        return members.sort((y, x) => {
            let result = 0;
            for (let order of orders) {
                if (result !== 0) break;
                if (typeof order === 'function') {
                    result = order(y, x);
                } else {
                    const isInverse = order[0] === '-';
                    if (isInverse) order = order.substr(1);
                    let xStatus = x.status;
                    let yStatus = y.status;
                    let xValue;
                    let yValue;
                    switch (order) {
                    case 'me':
                        if (userMe) {
                            if (userMeId === x.id) result = 1;
                            else if (userMeId === y.id) result = -1;
                        }
                        break;
                    case 'status':
                        if (xStatus === STATUS.online) xStatus = 100;
                        if (yStatus === STATUS.online) yStatus = 100;
                        // eslint-disable-next-line no-nested-ternary
                        result = xStatus > yStatus ? 1 : (xStatus === yStatus ? 0 : -1);
                        break;
                    default:
                        xValue = x[order];
                        yValue = y[order];
                        if (xValue === undefined || xValue === null) xValue = 0;
                        if (yValue === undefined || yValue === null) yValue = 0;
                        // eslint-disable-next-line no-nested-ternary
                        result = xValue > yValue ? 1 : (xValue === yValue ? 0 : -1);
                    }
                    result *= isInverse ? (-1) : 1;
                }
            }
            return result * (isFinalInverse ? (-1) : 1);
        });
    }
}
