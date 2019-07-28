import Entity from './entity';
import Status from '../../utils/status';
import Lang from '../lang';
import Pinyin from '../../utils/pinyin';
import ChatMessage from './chat-message';

/**
 * 聊天状态管理器
 *
 * @private
 * @type {Status}
 */
const STATUS = new Status({
    local: 0,
    sending: 1,
    fail: 2,
    ok: 3,
}, 0);

/**
 * 聊天类型表
 * @type {Object<string,string>}
 * @private
 */
const TYPES = {
    one2one: 'one2one',
    group: 'group',
    system: 'system',
    robot: 'robot'
};

/**
 * 白名单类型表
 * @type {Object<string,string>}
 * @private
 */
const COMMITTERS_TYPES = {
    admins: 'admins',
    whitelist: 'whitelist',
    all: 'all'
};


/**
 * 将被删除聊天标记为隐藏的过期时间，单位毫秒
 * @type {number}
 * @private
 */
const DISMISS_VISIBLE_TIME = 1000 * 60 * 60 * 24 * 90;

/**
 * 聊天类
 *
 * @class Chat
 * @extends {Entity}
 */
export default class Chat extends Entity {
    /**
     * 实体名称
     * @type {string}
     * @memberof Chat
     */
    static NAME = 'Chat';

    /**
     * 成员状态管理器
     *
     * @static
     * @memberof Chat
     * @type {Status}
     */
    static STATUS = STATUS;

    /**
     * 聊天类型表
     * @type {Object<string,string>}
     * @memberof Chat
     * @static
     */
    static TYPES = TYPES;

    /**
     * 白名单类型表
     * @type {Object<string,string>}
     * @memberof Chat
     * @static
     */
    static COMMITTERS_TYPES = COMMITTERS_TYPES;

    /**
     * 数据库存储实体属性结构管理器
     *
     * @type {EntitySchema}
     * @static
     * @memberof Chat
     */
    static SCHEMA = Entity.SCHEMA.extend({
        user: {type: 'int', indexed: true},
        type: {type: 'string', indexed: true},
        name: {type: 'string', indexed: true},
        createdDate: {type: 'timestamp', indexed: true},
        createdBy: {type: 'string', indexed: true},
        editedDate: {type: 'timestamp'},
        lastActiveTime: {type: 'timestamp', indexed: true},
        dismissDate: {type: 'timestamp', indexed: true},
        star: {type: 'boolean', indexed: true},
        mute: {type: 'boolean', indexed: true},
        public: {type: 'boolean', indexed: true},
        admins: {type: 'set'},
        members: {
            type: 'set',
            setter: (val, obj) => {
                obj._membersSet = null;
                return val;
            }
        },
        committers: {type: 'string'},
        category: {type: 'string'},
    });

    /**
     * 创建一个聊天类实例
     * @param {Object<string,any>} data 聊天属性对象
     * @param {string} [entityType=Chat.NAME] 实体类型名称
     * @memberof Chat
     */
    constructor(data, entityType = Chat.NAME) {
        super(data, entityType);

        /**
         * 聊天状态
         * @type {Status}
         * @private
         */
        this._status = STATUS.create(this.$.status);
        this._status.onChange = newStatus => {
            this.$.status = newStatus;
            if (typeof this.onStatusChange === 'function') {
                this.onStatusChange(newStatus, this);
            }
        };

        /**
         * 最大聊天消息排序编号
         * @type {number}
         * @private
         */
        this._maxMsgOrder = 0;
    }

    /**
     * 获取最大聊天消息排序编号
     * @memberof Chat
     * @type {number}
     */
    get maxMsgOrder() {
        return this._maxMsgOrder;
    }

    /**
     * 递增最大聊天消息排序编号
     * @memberof Chat
     * @return {number} 最大聊天消息排序编号
     */
    newMsgOrder() {
        this._maxMsgOrder += 1;
        return this._maxMsgOrder;
    }

    /**
     * 调用此方法确保实体拥有合适的 GID 属性
     *
     * @memberof Entity
     * @return {void}
     * @override
     */
    ensureGid() {
        if (this.isOne2One) {
            this.$.gid = Array.from(this.members).sort().join('&');
        } else {
            super.ensureGid();
        }
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
        return Chat.SCHEMA;
    }

    /**
     * 设置 ID 属性
     * @param {number} remoteId  ID 属性
     * @memberof Chat
     */
    set id(remoteId) {
        super.id = remoteId;
        this._status.change(remoteId ? STATUS.ok : STATUS.fail);
    }

    /**
     * 获取 ID 属性值
     * @memberof Chat
     * @type {number}
     */
    get id() {
        return this.$get('id');
    }

    /**
     * 获取状态值
     * @memberof Chat
     * @readonly
     * @type {number}
     */
    get status() {
        return this._status.value;
    }

    /**
     * 获取状态名称
     * @memberof Chat
     * @readonly
     * @type {string}
     */
    get statusName() {
        return this._status.name;
    }

    /**
     * 判断当前状态是否是给定的状态
     * @memberof Chat
     * @param {number|string} status 要判断的状态值或状态名称
     * @return {boolean} 如果为 `true` 则为给定的状态，否则不是
     */
    isStatus(status) {
        return this._status.is(status);
    }

    /**
     * 判断当前状态是否是正常状态
     * @memberof Chat
     * @return {boolean} 如果为 `true` 则为正常状态，否则不是
     */
    get isOK() {
        return this.isStatus(STATUS.ok);
    }

    /**
     * 获取聊天类型
     * @memberof Chat
     * @type {string}
     */
    get type() {
        let type = this.$get('type');
        if (!type) {
            const {members} = this;
            type = (members && members.size === 2) ? TYPES.one2one : TYPES.group;
        }
        return type;
    }

    /**
     * 获取是否为机器人聊天类型
     * @memberof Chat
     * @type {boolean}
     */
    get isRobot() {
        return this.type === TYPES.robot;
    }

    /**
     * 设置聊天类型
     * @param {string} type 聊天类型
     * @memberof Chat
     */
    set type(type) {
        this.$set('type', type);
    }

    /**
     * 获取是否一对一聊天类型
     * @memberof Chat
     * @type {boolean}
     */
    get isOne2One() {
        return this.type === TYPES.one2one;
    }

    /**
     * 获取是否为已删除的一对一聊天
     * @memberof Chat
     * @type {boolean}
     */
    get isDeleteOne2One() {
        return this.isOne2One && this._isDeleteOne2One;
    }

    /**
     * 设置是否为已删除的一对一聊天
     * @param {boolean} flag 为已删除的一对一聊天
     * @memberof Chat
     */
    set isDeleteOne2One(flag) {
        if (this.isOne2One) {
            this._isDeleteOne2One = flag;
        }
    }

    /**
     * 获取是否讨论组
     * @memberof Chat
     * @type {boolean}
     */
    get isGroup() {
        return this.type === TYPES.group;
    }

    /**
     * 获取聊天分组
     * @memberof Chat
     * @type {string}
     */
    get category() {
        return this.$get('category');
    }

    /**
     * 设置聊天分组
     * @param {string} name 聊天分组
     * @memberof Chat
     */
    set category(name) {
        return this.$set('category', name);
    }

    /**
     * 获取聊天名称
     * @memberof Chat
     * @type {string}
     */
    get name() {
        return this.$get('name', `[Chat-${this.id}]`);
    }

    /**
     * 设置聊天名称
     * @param {string} newName 聊天名称
     * @memberof Chat
     */
    set name(newName) {
        this.$set('name', newName);
    }

    /**
     * 获取聊天显示名称，如果是一对一聊天则返回对方成员名称，否则返回聊天 `name` 属性值
     * @param {{members: {get: function(id: number):Member}}} app 用于获取系统成员的辅助对象
     * @param {boolean} [includeMemberCount=false] 是否包含聊天成员数目
     * @return {string} 聊天名称
     * @memberof Chat
     */
    getDisplayName(app, includeMemberCount = false) {
        const {name} = this;
        if (this.isRobot) {
            includeMemberCount = false;
        }
        if (this.isOne2One) {
            const otherOne = this.getTheOtherOne(app);
            return otherOne ? otherOne.displayName : Lang.string('chat.tempChat.name');
        }
        if (this.isSystem) {
            if (includeMemberCount) {
                return Lang.format('chat.groupName.format', name || Lang.string('chat.systemGroup.name'), Lang.string('chat.all'));
            }
            return name || Lang.string('chat.systemGroup.name');
        }
        if (name !== undefined && name !== '') {
            if (includeMemberCount) {
                return Lang.format('chat.groupName.format', name, this.getMembersCount(app.members));
            }
            return name;
        }
        return `${Lang.string('chat.group.name')}${this.id || `(${Lang.string('chat.tempChat.name')})`}`;
    }

    /**
     * 获取聊天名称的拼音字符串（用于排序或搜索）
     *
     * @param {{members: {get: function(id: number):Member}}} app 用于获取系统成员的辅助对象
     * @return {string} 拼音字符串
     * @memberof Chat
     */
    getPinYin(app) {
        if (!this._pinyin) {
            const str = app ? this.getDisplayName(app, false) : this.name;
            this._pinyin = Pinyin(str);
        }
        return this._pinyin;
    }

    /**
     * 获取是否已收藏此聊天
     * @memberof Chat
     * @type {boolean}
     */
    get star() {
        return this.$get('star');
    }

    /**
     * 设置是否已收藏此聊天
     * @param {boolean} star 已收藏此聊天
     * @memberof Chat
     */
    set star(star) {
        this.$set('star', star);
    }

    /**
     * 获取是否已设置为免打扰
     * @memberof Chat
     * @type {boolean}
     */
    get mute() {
        return this.$get('mute');
    }

    /**
     * 设置是否已设置为免打扰
     * @param {boolean} mute 已设置为免打扰
     * @memberof Chat
     */
    set mute(mute) {
        this.$set('mute', mute);
    }

    /**
     * 获取是否已经隐藏（存档）此聊天，相当于读取 `hide` 属性
     * @memberof Chat
     * @type {string}
     */
    get hidden() {
        return this.hide;
    }

    /**
     * 设置是否已经隐藏（存档）此聊天，相当于设置 `hide` 属性
     * @param {boolean} hide 已经隐藏（存档）此聊天
     * @memberof Chat
     */
    set hidden(hide) {
        this.hide = hide;
    }

    /**
     * 获取是否已经隐藏（存档）此聊天
     * @memberof Chat
     * @type {string}
     */
    get hide() {
        return this.$get('hide');
    }

    /**
     * 设置是否已经隐藏（存档）此聊天
     * @param {boolean} hide 已经隐藏（存档）此聊天
     * @memberof Chat
     */
    set hide(hide) {
        this.$set('hide', hide);
    }

    /**
     * 获取是否已设为公开聊天
     * @memberof Chat
     * @type {boolean}
     */
    get public() {
        return this.$get('public');
    }

    /**
     * 设置是否已设为公开聊天
     * @param {boolean} flag 已设为公开聊天
     * @memberof Chat
     */
    set public(flag) {
        this.$set('public', flag);
    }

    /**
     * 获取聊天创建时间戳
     * @memberof Chat
     * @type {number}
     */
    get createdDate() {
        return this.$get('createdDate');
    }

    /**
     * 设置聊天创建时间戳
     * @param {number} createdDate 聊天创建时间戳
     * @memberof Chat
     */
    set createdDate(createdDate) {
        this.$set('createdDate', createdDate);
    }

    /**
     * 获取聊天解散时间戳
     * @memberof Chat
     * @type {number}
     */
    get dismissDate() {
        return this.$get('dismissDate');
    }

    /**
     * 设置聊天解散时间戳
     * @param {number} dismissDate 聊天解散时间戳
     * @memberof Chat
     */
    set dismissDate(dismissDate) {
        this.$set('dismissDate', dismissDate);
    }

    /**
     * 获取是否已经解散此聊天
     * @memberof Chat
     * @type {boolean}
     */
    get isDismissed() {
        return !!this.dismissDate;
    }

    /**
     * 判断指定的用户是否能够解散此聊天
     *
     * @param {Member|{id: number}|{account: string}} user 成员对象
     * @returns {boolean} 如果返回 `true` 则可以解散，否则为不是
     * @memberof Chat
     */
    canDismiss(user) {
        return !this.isDismissed && this.isGroup && this.isAdmin(user);
    }

    /**
     * 获取聊天管理员集合
     * @memberof Chat
     * @type {Set<string|number>}
     */
    get admins() {
        return this.$get('admins');
    }

    /**
     * 设置聊天管理员
     * @param {Set<string|number>} admins 聊天管理员
     * @memberof Chat
     */
    set admins(admins) {
        this.$set('admins', admins);
    }

    /**
     * 判断给定的成员是否是此聊天的管理员
     *
     * @param {Member|{id: number}|{account: string}} member 成员对象
     * @returns {boolean} 如果为 `true` 则为是此聊天管理员，否则为不是
     * @memberof Chat
     */
    isAdmin(member) {
        if (typeof member !== 'object') {
            member = {id: member, account: member};
        }
        if (this.isSystem && member.isSuperAdmin) {
            return true;
        }
        if (this.isOwner(member)) {
            return true;
        }
        const {admins} = this;
        if (admins && admins.size) {
            return admins.has(member.id) || admins.has(member.account);
        }
        return false;
    }

    /**
     * 向此聊天添加一个新的管理员
     *
     * @param {number} memberId 要做为新管理员的 ID
     * @memberof Chat
     * @return {void}
     */
    addAdmin(memberId) {
        const {admins} = this;
        if (typeof memberId === 'object') {
            memberId = memberId.id;
        }
        admins.add(memberId);
        this.admins = admins;
    }

    /**
     * 获取白名单设置
     * @memberof Chat
     * @type {Set<string>}
     */
    get committers() {
        const committers = this.$get('committers');
        if (!committers || committers === '$ADMINS') {
            return [];
        }
        return new Set(committers.split(','));
    }

    /**
     * 设置白名单配置
     * @param {string|Set<string>} committers 白名单
     * @memberof Chat
     */
    set committers(committers) {
        this.$set('committers', committers);
    }

    /**
     * 获取白名单类型
     * @memberof Chat
     * @type {string}
     */
    get committersType() {
        const committers = this.$get('committers');
        if ((this.isSystem || this.isGroup) && committers && committers !== '$ALL') {
            if (committers === '$ADMINS') {
                return COMMITTERS_TYPES.admins;
            }
            return COMMITTERS_TYPES.whitelist;
        }
        return COMMITTERS_TYPES.all;
    }

    /**
     * 判断给定的用户是否在白名单中
     *
     * @param {number|{id: number}} member 用户 ID 或者用户对象
     * @returns {boolean} 如果返回 `true` 则为在白名单中，否则为不在
     * @memberof Chat
     */
    isCommitter(member) {
        switch (this.committersType) {
        case COMMITTERS_TYPES.admins:
            return this.isAdmin(member);
        case COMMITTERS_TYPES.whitelist:
            if (typeof member === 'object') {
                member = member.id;
            }
            return this.isInWhitelist(member);
        default:
            return true;
        }
    }

    /**
     * 判断给定的成员是否是能够重命名此聊天
     *
     * @param {Member|{id: number}|{account: string}} user 成员对象
     * @returns {boolean} 如果为 `true` 则能够重命名此聊天，否则为不能
     * @memberof Chat
     */
    canRename(user) {
        return !this.isRobot && !this.isDismissed && this.isCommitter(user) && !this.isOne2One;
    }

    /**
     * 判断给定的成员是否是能够邀请其他成员参与此聊天
     *
     * @param {Member|{id: number}|{account: string}} user 成员对象
     * @returns {boolean} 如果为 `true` 则能够邀请其他成员参与此聊天，否则为不能
     * @memberof Chat
     */
    canInvite(user) {
        return !this.isRobot && !this.isDismissed && (this.isAdmin(user) || this.isCommitter(user)) && (!this.isSystem);
    }

    /**
     * 判断给定的成员是否是能够将聊天内成员移除此聊天
     *
     * @param {!(Member|{id: number}|{account: string})} user 成员对象
     * @param {!(Member|{id: number}|{account: string})} kickOfWho 要移除的成员对象
     * @returns {boolean} 如果为 `true` 则能够将聊天内成员移除此聊天，否则为不能
     * @memberof Chat
     */
    canKickOff(user, kickOfWho) {
        return !this.isRobot && this.isGroup && !this.isSystem && (!kickOfWho || kickOfWho.id !== user.id) && this.isAdmin(user);
    }

    /**
     * 判断给定的成员是否是能够将聊天设置为公开或者取消公开设置
     *
     * @param {Member|{id: number}|{account: string}} user 成员对象
     * @returns {boolean} 如果为 `true` 则能够将聊天设置为公开或者取消公开设置，否则为不能
     * @memberof Chat
     */
    canMakePublic(user) {
        return !this.isRobot && !this.isDismissed && this.isAdmin(user) && this.isGroup;
    }

    /**
     * 判断给定的成员是否是能够修改此聊天的白名单
     *
     * @param {Member|{id: number}|{account: string}} user 成员对象
     * @returns {boolean} 如果为 `true` 则能够修改此聊天的白名单，否则为不能
     * @memberof Chat
     */
    canSetCommitters(user) {
        return !this.isRobot && !this.isDismissed && this.isAdmin(user) && !this.isOne2One;
    }

    /**
     * 判断此聊天对于指定的用户是否只读（无法发送消息）
     *
     * @param {Member|{id: number}|{account: string}} member 成员对象
     * @returns {boolean} 如果为 `true` 则为只读，否则不是
     * @memberof Chat
     */
    isReadonly(member) {
        return this.isRobot || this.isDeleteOne2One || this.isDismissed || !this.isCommitter(member);
    }

    get visible() {
        if (this._visible === undefined) {
            const {dismissDate} = this;
            if (dismissDate) {
                const now = new Date().getTime();
                this._visible = now <= (dismissDate + DISMISS_VISIBLE_TIME);
            } else {
                this._visible = true;
            }
        }
        return this._visible;
    }

    get visibleDate() {
        const {dismissDate} = this;
        return dismissDate ? (dismissDate + DISMISS_VISIBLE_TIME) : 0;
    }

    /**
     * 获取是否设置有白名单
     * @memberof Chat
     * @type {boolean}
     */
    get hasWhitelist() {
        return this.committersType === COMMITTERS_TYPES.whitelist;
    }

    /**
     * 获取此聊天的白名单
     * @memberof Chat
     * @type {string}
     */
    get whitelist() {
        if (this.hasWhitelist) {
            const set = new Set();
            this.committers.forEach(x => {
                x = Number.parseInt(x, 10);
                if (!Number.isNaN(x)) {
                    set.add(x);
                }
            });
            return set;
        }
        return null;
    }

    /**
     * 设置此聊天的白名单
     *
     * @memberof Chat
     * @param {Set<string>} value 白名单
     */
    set whitelist(value) {
        if (!this.isGroupOrSystem) {
            value = '';
        }
        this.$set('committers', value);
    }

    /**
     * 判断给定的用户 ID 是否在白名单中
     *
     * @param {number} memberId 用户 ID
     * @param {?Set<number>} whitelist 白名单
     * @returns {boolean} 如果返回 `true` 则为在白名单中，否则为不在
     * @memberof Chat
     */
    isInWhitelist(memberId, whitelist) {
        if (typeof memberId === 'object') {
            memberId = memberId.id;
        }
        whitelist = whitelist || this.whitelist;
        if (whitelist) {
            return whitelist.has(memberId);
        }
        return false;
    }

    /**
     * 将给定的用户 ID 添加到白名单中
     *
     * @param {number} memberId 用户 ID
     * @returns {boolean} 如果返回 `true` 则为添加成功，否则为添加失败
     * @memberof Chat
     */
    addToWhitelist(memberId) {
        const {whitelist} = this;
        if (whitelist) {
            if (typeof memberId === 'object') {
                memberId = memberId.id;
            }
            if (!whitelist.has(memberId)) {
                whitelist.add(memberId);
                this.whitelist = whitelist;
                return true;
            }
        }
        return false;
    }

    /**
     * 将给定的用户 ID 从白名单中移除
     *
     * @param {number} memberId 用户 ID
     * @returns {boolean} 如果返回 `true` 则为移除成功，否则为移除失败
     * @memberof Chat
     */
    removeFromWhitelist(memberId) {
        const {whitelist} = this;
        if (whitelist) {
            if (typeof memberId === 'object') {
                memberId = memberId.id;
            }
            if (whitelist.has(memberId)) {
                whitelist.delete(memberId);
                this.whitelist = whitelist;
                return true;
            }
        }
        return false;
    }

    /**
     * 获取聊天的创建者用户名
     * @memberof Chat
     * @type {string}
     */
    get createdBy() {
        return this.$get('createdBy');
    }

    /**
     * 设置聊天的创建者用户名
     * @param {string} createdBy 聊天的创建者用户名
     * @memberof Chat
     */
    set createdBy(createdBy) {
        this.$set('createdBy', createdBy);
    }

    /**
     * 获取聊天成员 ID 集合
     * @memberof Chat
     * @type {Set<number>}
     */
    get members() {
        return this.$get('members');
    }

    /**
     * 设置聊天成员
     * @param {number[]|Member[]} newMembers 聊天成员
     * @memberof Chat
     */
    set members(newMembers) {
        if (newMembers.length) {
            if (typeof newMembers[0] === 'object') {
                this.resetMembers(newMembers);
            } else {
                this.$set('members', new Set(newMembers));
                this._membersSet = null;
            }
        } else {
            this._membersSet = [];
        }
    }

    /**
     * 判断给定的成员 ID 是否在此聊天成员集合中
     *
     * @param {number|{id: number}} memberId 聊天成员对象或者成员 ID
     * @returns {boolean} 如果返回 `true` 则为在此聊天成员集合中，否则为不在
     * @memberof Chat
     */
    isMember(memberId) {
        if (typeof memberId === 'object') {
            memberId = memberId.id;
        }
        const {members} = this;
        return members && members.has(memberId);
    }

    /**
     * 设置聊天成员
     * @param {Member[]} members 聊天成员
     * @return {void}
     */
    resetMembers(members) {
        this._membersSet = members;
        this.$set('members', new Set(members.map(member => member.id)));
    }

    /**
     * 将成员添加到聊天中
     *
     * @param {...Member} newMembers 新到成员
     * @memberof Chat
     * @return {void}
     */
    addMember(...newMembers) {
        const {members} = this;
        if (!members.size) {
            this._membersSet = [];
        }
        newMembers.forEach(member => {
            if (!members.has(member.id)) {
                members.add(member.id);
                if (this._membersSet) {
                    this._membersSet.push(member);
                }
            }
        });
        this.$set('members', members);
    }

    /**
     * 从系统更新聊天成员列表
     *
     * @param {{get: function(id: number):Member}} appMembers 用于从系统获取成员信息的辅助对象
     * @return {void}
     * @memberof Chat
     */
    updateMembersSet(appMembers) {
        this._membersSet = Array.from(this.members).map(memberId => (appMembers.get(memberId)));
        if (this.isGroupOrSystem) {
            this._membersSet = this._membersSet.filter(m => !m.temp && !m.isDeleted);
        }
    }

    /**
     * 获取聊天成员数目
     *
     * @param {{get: function(id: number):Member}} appMembers 用于从系统获取成员信息的辅助对象
     * @return {number} 成员数目
     * @memberof Chat
     */
    getMembersCount(appMembers) {
        return this.getMembersSet(appMembers).length;
    }

    /**
     * 从系统获取聊天成员列表
     *
     * @param {{get: function(id: number):Member}} appMembers 用于从系统获取成员信息的辅助对象
     * @return {Member[]} 聊天成员列表
     * @memberof Chat
     */
    getMembersSet(appMembers) {
        // if (this.type === TYPES.system) {
        //     return appMembers.all.filter(x => !x.isDeleted);
        // }
        if (!this._membersSet || this._membersSetUpdateId !== this.updateId) {
            this.updateMembersSet(appMembers);
            this._membersSetUpdateId = this.updateId;
        }
        return this._membersSet;
    }

    /**
     * 获取一对一聊天对方成员
     *
     * @param {{members: {get: function(id: number):Member}}} app 用于获取系统成员的辅助对象
     * @return {Member} 对方成员对象
     * @memberof Chat
     */
    getTheOtherOne(app) {
        if (this.isOne2One) {
            const appMembers = app.members;
            const currentUserId = app.user.id;
            if (!this._theOtherOneId) {
                this._theOtherOneId = Array.from(this.members).find(x => x !== currentUserId);
            }
            if (this._theOtherOneId) {
                const member = appMembers.get(this._theOtherOneId);
                if (member && member.temp) {
                    this._membersSet = null;
                }
                return member;
            }
            return this._theOtherOne;
        }
        return null;
    }

    /**
     * 判断聊天是否在线，如果是一对一聊天则判断对方成员状态是否在线，如果是其他聊天则直接判定为在线
     *
     * @param {{members: {get: function(id: number):Member}}} app 用于获取系统成员的辅助对象
     * @returns {boolean} 如果为 `true` 则为在线，否则为不在线
     * @memberof Chat
     */
    isOnline(app) {
        if (this.isOne2One) {
            const otherOne = this.getTheOtherOne(app);
            return otherOne && otherOne.isOnline;
        }
        return true;
    }

    /**
     * 判断给定的用户是否是聊天的创建者
     *
     * @param {Member|{id: number}|{account: string}} user 聊天成员对象
     * @returns {boolean} 如果返回 `true` 则为是聊天的创建者，否则为不是聊天的创建者
     * @memberof Chat
     */
    isOwner(user) {
        return user.id === this.createdBy || user.account === this.createdBy;
    }

    /**
     * 获取是否能够让其他成员自由加入
     * @memberof Chat
     * @readonly
     * @type {boolean}
     */
    get canJoin() {
        return !this.isDismissed && this.public && this.isGroup;
    }

    /**
     * 判断给定的用户是否能够退出讨论组
     *
     * @param {Member|{id: number}|{account: string}} user 聊天成员对象
     * @returns {boolean} 如果返回 `true` 则为能够退出讨论组，否则为不能够退出讨论组
     * @memberof Chat
     */
    canExit(user) {
        return this.isGroup && !this.isOwner(user);
    }

    /**
     * 获取是否隐藏此聊天
     * @memberof Chat
     * @readonly
     * @type {boolean}
     */
    get canHide() {
        return this.isGroup;
    }

    /**
     * 获取是否是系统聊天
     * @memberof Chat
     * @type {boolean}
     */
    get isSystem() {
        return this.type === TYPES.system || this.type === TYPES.robot;
    }

    /**
     * 获取是否是讨论组或系统聊天
     * @memberof Chat
     * @type {boolean}
     */
    get isGroupOrSystem() {
        return this.isGroup || this.isSystem;
    }

    /**
     * 获取此聊天的未读消息数目
     * @memberof Chat
     * @type {number}
     */
    get noticeCount() {
        return this._noticeCount || 0;
    }

    /**
     * 设置此聊天的未读消息数目
     * @param {number} count 此聊天的未读消息数目
     * @memberof Chat
     */
    set noticeCount(count) {
        this._noticeCount = count;
    }

    /**
     * 清除此聊天的未读消息数目
     *
     * @return {ChatMessage[]} 已新标记为已读的消息清单
     * @memberof Chat
     */
    muteNotice() {
        this._noticeCount = 0;
        const mutedMessages = [];
        this._messages.forEach(message => {
            if (message.unread) {
                message.unread = false;
                mutedMessages.push(message);
            }
        });
        this.renewUpdateId();
        return mutedMessages;
    }

    /**
     * 获取此聊天是否已被设置为免打扰或者隐藏（已存档）
     * @memberof Chat
     * @readonly
     * @type {boolean}
     */
    get isMuteOrHidden() {
        return this.mute || this.hidden;
    }

    /**
     * 获取此聊天缓存的消息列表
     * @memberof Chat
     * @readonly
     * @type {ChatMessage[]}
     */
    get messages() {
        return this._messages || [];
    }

    /**
     * 获取上次在界面上激活的时间戳
     * @memberof Chat
     * @type {number}
     */
    get lastActiveTime() {
        let lastActiveTime = this.$get('lastActiveTime');
        if (!lastActiveTime) {
            lastActiveTime = this.createdDate;
        }
        return lastActiveTime || 0;
    }

    /**
     * 设置上次在界面上激活的时间戳
     * @param {number} time 上次在界面上激活的时间戳
     * @memberof Chat
     */
    set lastActiveTime(time) {
        this.$set('lastActiveTime', time);
    }

    /**
     * 将聊天设置已激活
     * @return {void}
     * @memberof Chat
     */
    makeActive() {
        this.lastActiveTime = new Date().getTime();
    }

    /**
     * 获取是否有缓存消息
     * @memberof Chat
     * @type {boolean}
     */
    get hasSetMessages() {
        return !!this._messages;
    }

    /**
     * 将聊天消息添加到缓存
     *
     * @param {ChatMessage[]} messages 要缓存的聊天列表
     * @param {number} userId 用户 ID
     * @param {boolean} [localMessage=false] 是否来源于本地数据消息
     * @param {boolean} [skipOld=false] 是否忽略已缓存的消息
     * @returns {Chat} 返回自身用于链式调用
     * @memberof Chat
     */
    addMessages(messages, userId, localMessage = false, skipOld = false) {
        if (!Array.isArray(messages)) {
            messages = [messages];
        }
        if (!this._messages) {
            this._messages = [];
        }

        if (!messages.length) {
            return;
        }

        let {noticeCount, lastActiveTime} = this;
        const now = skipOld ? (new Date().getTime()) : 0;
        messages.forEach(message => {
            if (message.date) {
                const checkMessage = this._messages.find(x => x.gid === message.gid);
                if (checkMessage) {
                    checkMessage.reset(message);
                } else if (skipOld && (now - message.date) > skipOld) {
                    return;
                } else {
                    this._messages.push(message);
                    if (!localMessage && userId !== message.senderId) {
                        message.unread = true;
                        noticeCount += 1;
                    } else {
                        message.unread = false;
                    }
                }
                if (lastActiveTime < message.date) {
                    lastActiveTime = message.date;
                }
                if (message.order) {
                    this._maxMsgOrder = Math.max(this._maxMsgOrder, message.order);
                }
            } else if (DEBUG) {
                console.warn('The message date is not defined.', message);
            }
        });
        this.lastActiveTime = lastActiveTime;
        this.noticeCount = noticeCount;

        this._messages = ChatMessage.sort(this._messages);

        this.renewUpdateId();

        return this;
    }

    /**
     * 获取缓存中最新的一个聊天消息
     * @memberof Chat
     * @type {ChatMessage}
     */
    get lastMessage() {
        return this._messages && this._messages[this._messages.length - 1];
    }

    /**
     * 从缓存中移除指定 GID 的聊天消息
     *
     * @param {string} messageGid 聊天消息 GID
     * @returns {boolean} 如果返回 `true` 则移除成功，否则为移除失败（可能是未找到指定的聊天消息）
     * @memberof Chat
     */
    removeMessage(messageGid) {
        const {messages} = this;
        if (messages.length) {
            const findIndex = messages.findIndex(x => (x.id === messageGid || x.gid === messageGid));
            if (findIndex > -1) {
                this._messages.splice(findIndex, 1);
                return true;
            }
        }
        return false;
    }

    /**
     * 获取是否已经从数据库加载完所有消息到缓存
     * @memberof Chat
     * @type {boolean}
     */
    get isLoadingOver() {
        return this.loadingOffset === true;
    }

    /**
     * 获取是否是第一次从数据库加载消息
     * @memberof Chat
     * @type {boolean}
     */
    get isFirstLoaded() {
        return this.loadingOffset !== undefined;
    }

    /**
     * 创建一个聊天类实例
     *
     * @static
     * @param {Object<string,any>|Chat} chat 聊天属性对象或者聊天实例
     * @return {Chat} 聊天类实例
     * @memberof Chat
     */
    static create(chat) {
        if (chat instanceof Chat) {
            return chat;
        }
        return new Chat(chat);
    }

    /**
     * 对聊天列表进行排序，排序规则 `orders` 可以为以下值：
     * - `function(c1: Member, c2: Member):number`，自定义排序函数；
     * - 一个用逗号分隔的根据属性排序的属性名称表；
     * - 根据属性排序的属性名称表数组。
     * 默认的排序规则为：`['star', 'notice', 'hide', 'mute', 'lastActiveTime', 'online', 'createDate', 'name', 'id']`。
     * @param  {Chat[]} chats 要排序的聊天列表
     * @param  {array|string|function(c1: Chat, c2: Chat):number}  orders 排序规则
     * @param  {{members: {get: function(id: number):Member}}} app 用于获取系统成员的辅助对象
     * @return {Chat[]} 排序后的聊天列表
     */
    static sort(chats, orders, app) {
        if (chats.length < 2) {
            return chats;
        }
        if (typeof orders === 'function') {
            return chats.sort(orders);
        }
        if (!orders || orders === 'default' || orders === true) {
            orders = ['star', 'notice', 'hide', 'lastActiveTime', 'mute', 'online', 'createDate', 'name', 'id'];
        } else if (orders === 'onlineFirst') {
            orders = ['star', 'notice', 'hide', 'online', 'lastActiveTime', 'mute', 'createDate', 'name', 'id'];
        } else if (typeof orders === 'string') {
            orders = orders.split(' ');
        }
        let isFinalInverse = false;
        if (orders[0] === '-' || orders[0] === -1) {
            isFinalInverse = true;
            orders.shift();
        }
        return chats.sort((y, x) => {
            let result = 0;
            for (let order of orders) {
                if (result !== 0) break;
                if (typeof order === 'function') {
                    result = order(y, x);
                } else {
                    const isInverse = order[0] === '-';
                    if (isInverse) order = order.substr(1);
                    let xValue;
                    let yValue;
                    switch (order) {
                    case 'notice':
                        result = (x.noticeCount ? 1 : 0) - (y.noticeCount ? 1 : 0);
                        break;
                    case 'hide':
                    case 'mute':
                        result = (x[order] ? 0 : 1) - (y[order] ? 0 : 1);
                        break;
                    case 'isSystem':
                    case 'star':
                        result = (x[order] ? 1 : 0) - (y[order] ? 1 : 0);
                        break;
                    case 'online':
                        if (app) {
                            result = (x.isOnline(app) ? 1 : 0) - (y.isOnline(app) ? 1 : 0);
                        }
                        break;
                    default:
                        if (order === 'name' && app) {
                            xValue = x.getDisplayName(app, false);
                            yValue = y.getDisplayName(app, false);
                        } else if (order === 'namePinyin') {
                            xValue = x.getPinYin(app);
                            yValue = y.getPinYin(app);
                        } else {
                            xValue = x[order];
                            yValue = y[order];
                        }
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
