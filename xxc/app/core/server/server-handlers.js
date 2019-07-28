import members from '../members';
import Lang from '../lang';
import Member from '../models/member';
import events from '../events';

/**
 * 事件表
 * @type {Object<string, string>}
 * @private
 */
const EVENT = {
    showMessage: 'ui.showMessage',
};

/**
 * 处理服务器用户登录推送消息
 * @param {SocketMessage} msg Socket 消息对象
 * @param {Socket} socket Socket 连接实例
 * @return {any} 如果返回 `false`，表示此消息处理失败或者无法处理，如果为 `true` 或其他数据则表示已经处理
 * @private
 */
const chatLogin = (msg, socket) => {
    if (msg.isSuccess) {
        const {user} = socket;
        if (user.isLogging || msg.data.id === user.id) {
            user.$set(msg.data);
            return true;
        }
        const member = members.get(msg.data.id);
        if (member) {
            member.$set(msg.data);
            member.status = msg.data.status;
            members.update(member);
        } else {
            members.update(msg.data);
        }
    }
    return false;
};

/**
 * 处理服务器用户退出登录推送消息
 * @param {SocketMessage} msg Socket 消息对象
 * @param {Socket} socket Socket 连接实例
 * @return {any} 如果返回 `false`，表示此消息处理失败或者无法处理，如果为 `true` 或其他数据则表示已经处理
 * @private
 */
const chatLogout = (msg, socket) => {
    if (msg.isSuccess) {
        const {user} = socket;
        if (msg.data.id === user.id && socket.isConnecting) {
            user.markUnverified();
            socket.close();
        } else {
            const member = members.get(msg.data.id);
            if (member) {
                member.status = Member.STATUS.unverified;
                members.update(member);
            }
        }
    }
};

/**
 * 处理服务器提示错误推送消息
 * @param {SocketMessage} msg Socket 消息对象
 * @param {Socket} socket Socket 连接实例
 * @return {any} 如果返回 `false`，表示此消息处理失败或者无法处理，如果为 `true` 或其他数据则表示已经处理
 * @private
 */
const chatError = (msg, socket) => {
    const message = Lang.error(msg);
    if (message) {
        events.emit(EVENT.showMessage, message);
    }
};

/**
 * 处理服务器返回用户个人配置推送消息
 * @param {SocketMessage} msg Socket 消息对象
 * @param {Socket} socket Socket 连接实例
 * @return {any} 如果返回 `false`，表示此消息处理失败或者无法处理，如果为 `true` 或其他数据则表示已经处理
 * @private
 */
const chatSettings = (msg, socket) => {
    if (msg.isSuccess) {
        const {user} = socket;
        if (msg.data && msg.data.lastSaveTime > user.config.lastSaveTime && user.config.hash !== msg.data.hash) {
            user.config.reset(msg.data);
        }
    }
};

/**
 * 处理服务器通知变更用户状态推送消息
 * @param {SocketMessage} msg Socket 消息对象
 * @param {Socket} socket Socket 连接实例
 * @return {any} 如果返回 `false`，表示此消息处理失败或者无法处理，如果为 `true` 或其他数据则表示已经处理
 * @private
 */
const chatUserChangeStatus = (msg, socket) => {
    if (msg.isSuccess) {
        const {user} = socket;
        if (!msg.data.id || msg.data.id === user.id) {
            user.status = msg.data.status;
        }

        if (msg.data.id) {
            const member = members.get(msg.data.id);
            if (member) {
                member.status = msg.data.status;
                members.update(member);
            }
        }
    }
};

/**
 * 处理服务器用户信息变更推送消息
 * @param {SocketMessage} msg Socket 消息对象
 * @param {Socket} socket Socket 连接实例
 * @return {any} 如果返回 `false`，表示此消息处理失败或者无法处理，如果为 `true` 或其他数据则表示已经处理
 * @private
 */
const chatUserchange = (msg, socket) => {
    if (msg.isSuccess && msg.data) {
        const {user} = socket;
        if (!msg.data.id || msg.data.id === user.id) {
            user.$set(msg.data);
            if (msg.data.status) {
                user.status = msg.data.status;
            }
        }

        if (msg.data.id) {
            const member = members.get(msg.data.id);
            if (member) {
                member.$set(msg.data);
                if (msg.data.status) {
                    member.status = msg.data.status;
                }
                members.update(member);
                return member;
            }
        }
    }
};

/**
 * 处理服务器当前用户被踢出推送消息（通常因为用户在其他地方登录）
 * @param {SocketMessage} msg Socket 消息对象
 * @param {Socket} socket Socket 连接实例
 * @return {any} 如果返回 `false`，表示此消息处理失败或者无法处理，如果为 `true` 或其他数据则表示已经处理
 * @private
 */
const chatKickoff = (msg, socket) => {
    socket.close(null, 'KICKOFF');
};

/**
 * 处理服务器推送系统用户列表消息
 * @param {SocketMessage} msg Socket 消息对象
 * @param {Socket} socket Socket 连接实例
 * @return {any} 如果返回 `false`，表示此消息处理失败或者无法处理，如果为 `true` 或其他数据则表示已经处理
 * @private
 */
const chatUsergetlist = (msg, socket) => {
    if (msg.isSuccess) {
        if (msg.partial) {
            members.update(msg.data);
        } else {
            members.init(msg.data, msg.roles, msg.depts);
        }
    }
};

/**
 * 处理服务器推送当前用户 SessionID 消息
 * SessionID 用于发起 http 请求时免登录
 * @param {SocketMessage} msg Socket 消息对象
 * @param {Socket} socket Socket 连接实例
 * @return {any} 如果返回 `false`，表示此消息处理失败或者无法处理，如果为 `true` 或其他数据则表示已经处理
 * @private
 */
const chatSessionID = (msg, socket) => {
    if (msg.isSuccess || msg.sessionID) {
        const {user} = socket;
        user.sessionID = msg.data || msg.sessionID;
    }
};

/**
 * Socket 服务器推送消息处理函数
 * @type {Object<string, Function(msg: SocketMessage, socket: Socket)>}
 */
export default {
    'chat/login': chatLogin,
    'chat/logout': chatLogout,
    'chat/error': chatError,
    'chat/settings': chatSettings,
    'chat/userchangestatus': chatUserChangeStatus,
    'chat/userchange': chatUserchange,
    'chat/kickoff': chatKickoff,
    'chat/usergetlist': chatUsergetlist,
    'chat/sessionid': chatSessionID,
};
