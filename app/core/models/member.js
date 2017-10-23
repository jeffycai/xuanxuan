import Entity from './entity';
import Pinyin from '../../utils/pinyin';
import Status from '../../utils/status';

const STATUS = new Status({
    unverified: 0, // 未登录
    disconnect: 1, // 登录过，但掉线了
    logined: 2, // 登录成功
    online: 3, // 在线
    busy: 4, // 忙碌
    away: 5, // 离开
}, 0);

class Member extends Entity {
    static NAME = 'Member';
    static STATUS = STATUS;
    static SCHEMA = Entity.SCHEMA.extend({
        account: {type: 'string', unique: true},
        email: {type: 'string', indexed: true},
        phone: {type: 'string', indexed: true},
        mobile: {type: 'string', indexed: true},
        realname: {type: 'string', indexed: true},
        site: {type: 'string'},
        avatar: {type: 'string', indexed: true},
        role: {type: 'string'},
        gender: {type: 'string'},
        dept: {type: 'int', indexed: true},
        admin: {type: 'string'},
    });

    constructor(data, entityType = Member.NAME) {
        super(data, entityType);
        this._status = STATUS.create(this.$.status);
    }

    get schema() {
        return Member.SCHEMA;
    }

    // Member status

    get status() {
        return this._status.value;
    }

    get statusName() {
        return this._status.name;
    }

    set status(newStatus) {
        this._status.change(newStatus);
        this.$set('status', this._status.value);
    }

    get isOnline() {
        return this.status >= STATUS.logined;
    }

    get isOffline() {
        return !this.isOnline;
    }

    get isBusy() {
        return this._status.is(STATUS.busy);
    }

    isStatus(status) {
        return this._status.is(status);
    }

    // Name or account

    isMember(account) {
        return this.account === account;
    }

    get gender() {
        return this.$get('gender');
    }

    get isSuperAdmin() {
        return this.$get('admin') === 'super';
    }

    get isAdmin() {
        return this.$get('admin') !== 'no';
    }

    get realname() {
        return this.$get('realname');
    }

    get account() {
        return this.$get('account');
    }

    get avatar() {
        return this.$get('avatar');
    }

    get phone() {
        return this.$get('phone');
    }

    get mobile() {
        return this.$get('mobile');
    }

    get email() {
        return this.$get('email');
    }

    getAvatar(serverUrl) {
        let avatar = this.avatar;
        if (serverUrl && avatar && !avatar.startsWith('https://') && !avatar.startsWith('http://')) {
            if (!(serverUrl instanceof URL)) {
                serverUrl = new URL(serverUrl);
            }
            const serverUrlRoot = `${serverUrl.protocol}//${serverUrl.hostname}/`;
            avatar = serverUrlRoot + avatar;
        }
        return avatar;
    }

    get role() {
        return this.$get('role');
    }

    get displayName() {
        let name = this.$get('realname', `[${this.account}]`);
        if (!name) {
            name = `User-${this.id}`;
        }
        return name;
    }

    get namePinyin() {
        if (!this._namePinyin) {
            this._namePinyin = Pinyin(this.displayName);
        }
        return this._namePinyin;
    }


    // Static methods

    static create(member) {
        if (member instanceof Member) {
            return member;
        }
        return new Member(member);
    }

    /**
     * Sort members
     * @param  {array}         members
     * @param  {array|string}  orders
     * @param  {object}        app
     * @return {array}
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
                    continue;
                }
                const isInverse = order[0] === '-';
                if (isInverse) order = order.substr(1);
                switch (order) {
                case 'me':
                    if (userMe) {
                        if (userMeId === x.id) result = 1;
                        else if (userMeId === y.id) result = -1;
                    }
                    break;
                case 'status':
                    let xStatus = x.status,
                        yStatus = y.status;
                    if (xStatus === STATUS.online) xStatus = 100;
                    if (yStatus === STATUS.online) yStatus = 100;
                    result = xStatus > yStatus ? 1 : (xStatus == yStatus ? 0 : -1);
                    break;
                default:
                    let xValue = x[order], yValue = y[order];
                    if (xValue === undefined || xValue === null) xValue = 0;
                    if (yValue === undefined || yValue === null) yValue = 0;
                    result = xValue > yValue ? 1 : (xValue == yValue ? 0 : -1);
                }
                result *= isInverse ? (-1) : 1;
            }
            return result * (isFinalInverse ? (-1) : 1);
        });
    }
}

export default Member;
