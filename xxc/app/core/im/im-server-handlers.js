import {
    updateChatMessages, getChat, updateChats, updatePublicChats, removeChat,
} from './im-chats';
import Chat from '../models/chat';
import profile from '../profile';
import members from '../members';
import imServer, {handleReceiveChatMessages, handleInitChats, updateChatHistory} from './im-server';
import imUI from './im-ui';
import Config from '../../config';

/**
 * 处理服务器推送修改聊天名称消息
 * @param {SocketMessage} msg Socket 消息对象
 * @param {Socket} socket Socket 连接实例
 * @return {Chat} 如果处理成功则返回修改名称后的聊天实例
 * @private
 */
const chatChangeName = (msg, socket) => {
    if (msg.isSuccess) {
        const chat = getChat(msg.data.gid);
        if (chat) {
            chat.name = msg.data.name;
            updateChats(chat);
            return chat;
        }
    }
};

/**
 * 处理服务器推送修改聊天白名单信息
 * @param {SocketMessage} msg Socket 消息对象
 * @param {Socket} socket Socket 连接实例
 * @return {Chat} 如果处理成功则返回修改后的聊天实例
 * @private
 */
const chatSetcomitters = (msg, socket) => {
    if (msg.isSuccess) {
        const chat = getChat(msg.data.gid);
        if (chat) {
            chat.committers = msg.data.committers;
            updateChats(chat);
            return chat;
        }
    }
};

/**
 * 处理服务器推送修改聊天添加成员消息
 * @param {SocketMessage} msg Socket 消息对象
 * @param {Socket} socket Socket 连接实例
 * @return {Chat} 如果处理成功则返回修改后的聊天实例
 * @private
 */
const chatAddmember = (msg, socket) => {
    if (!msg.isSuccess) {
        return;
    }
    let chat = getChat(msg.data.gid);
    if (chat) {
        const serverChatMembers = Chat.create(msg.data).members;
        chat.resetMembers(Array.from(serverChatMembers).map(x => members.get(x)));
        updateChats(chat);
        return chat;
    }
    chat = new Chat(msg.data);
    updateChats(chat);
    return chat;
};

/**
 * 处理服务器推送聊天列表消息
 * @param {SocketMessage} msg Socket 消息对象
 * @param {Socket} socket Socket 连接实例
 * @return {boolean} 处理结果
 * @private
 */
const chatGetlist = (msg, socket) => {
    if (msg.isSuccess) {
        let newChats = null;
        if (typeof msg.data === 'object') {
            newChats = Object.keys(msg.data).map(x => msg.data[x]);
        } else {
            newChats = msg.data;
        }
        handleInitChats(newChats);
        return true;
    }
};

/**
 * 处理服务器推送创建聊天消息
 * @param {SocketMessage} msg Socket 消息对象
 * @param {Socket} socket Socket 连接实例
 * @return {Chat} 如果处理成功则返回创建的聊天实例
 * @private
 */
const chatCreate = (msg, socket) => {
    if (msg.isSuccess) {
        const chat = new Chat(msg.data);
        updateChats(chat);
        return chat;
    }
};

/**
 * 处理服务器推送接收到的聊天消息
 * @param {SocketMessage} msg Socket 消息对象
 * @param {Socket} socket Socket 连接实例
 * @return {boolean} 处理结果
 * @private
 */
const chatMessage = (msg, socket) => {
    if (msg.isSuccess) {
        let messages = msg.data;
        if (!Array.isArray(messages)) {
            if (messages.cgid && messages.content) {
                messages = [messages];
            } else {
                messages = Object.keys(messages).map(x => messages[x]);
            }
        }

        if (messages && messages.length) {
            handleReceiveChatMessages(messages);
            return true;
        }
    }
};

/**
 * 处理服务器推送修改聊天历史记录消息
 * @param {SocketMessage} msg Socket 消息对象
 * @param {Socket} socket Socket 连接实例
 * @return {boolean} 处理结果
 * @private
 */
const chatHistory = (msg, socket) => {
    if (!msg.isSuccess) {
        return;
    }
    let messages = msg.data;
    if (!Array.isArray(messages)) {
        if (messages.cgid && messages.content) {
            messages = [messages];
        } else {
            messages = Object.keys(messages).map(x => messages[x]);
        }
    }

    updateChatHistory((messages && messages.length) ? messages[0].cgid : null, messages, msg.pager, socket);
    return true;
};

/**
 * 处理服务器推送收藏聊天消息
 * @param {SocketMessage} msg Socket 消息对象
 * @param {Socket} socket Socket 连接实例
 * @return {Chat} 如果处理成功则返回修改后的聊天实例
 * @private
 */
const chatStar = (msg, socket) => {
    if (msg.isSuccess) {
        const chat = getChat(msg.data.gid);
        if (chat) {
            chat.star = msg.data.star;
            updateChats(chat);
            return chat;
        }
    }
};

/**
 * 处理服务器推送设置消息免打扰设置消息
 * @param {SocketMessage} msg Socket 消息对象
 * @param {Socket} socket Socket 连接实例
 * @return {Chat} 如果处理成功则返回修改后的聊天实例
 * @private
 */
const chatMute = (msg, socket) => {
    if (msg.isSuccess) {
        const chat = getChat(msg.data.gid);
        if (chat) {
            chat.mute = msg.data.mute;
            updateChats(chat);
            return chat;
        }
    }
};

/**
 * 处理服务器推送修改聊天分组设置消息
 * @param {SocketMessage} msg Socket 消息对象
 * @param {Socket} socket Socket 连接实例
 * @return {boolean} 处理结果
 * @private
 */
const chatCategory = (msg, socket) => {
    if (msg.isSuccess) {
        const {gids, category} = msg.data;
        if (gids && gids.length) {
            const chatsForUpdate = gids.map(gid => {
                const chat = getChat(gid);
                chat.category = category;
                return chat;
            });
            updateChats(chatsForUpdate);
        }
    }
};

/**
 * 处理服务器推送加入聊天消息
 * @param {SocketMessage} msg Socket 消息对象
 * @param {Socket} socket Socket 连接实例
 * @return {Chat} 如果处理成功则返回修改后的聊天实例
 * @private
 */
const chatJoinchat = (msg, socket) => {
    if (!msg.isSuccess) {
        return;
    }
    if (msg.data.gid) {
        let chat = getChat(msg.data.gid);
        if (chat) {
            chat.$set(msg.data);
        } else {
            chat = new Chat(msg.data);
        }
        if (chat.isMember(profile.user.id)) {
            chat.makeActive();
            updateChats(chat);
            if (chat.public && imServer.chatJoinTask) {
                imUI.activeChat(chat);
            }
            return chat;
        }
        removeChat(chat.gid);
        return chat;
    }
    imServer.chatJoinTask = false;
};

/**
 * 处理服务器推送设置消息隐藏操作结果
 * @param {SocketMessage} msg Socket 消息对象
 * @param {Socket} socket Socket 连接实例
 * @return {Chat} 如果处理成功则返回修改后的聊天实例
 * @private
 */
const chatHide = (msg, socket) => {
    if (msg.isSuccess) {
        const chat = getChat(msg.data.gid);
        if (chat) {
            chat.hide = msg.data.hide;
            updateChats(chat);
            return chat;
        }
    }
};

/**
 * 处理服务器推送解散聊天操作结果
 * @param {SocketMessage} msg Socket 消息对象
 * @param {Socket} socket Socket 连接实例
 * @return {Chat} 如果处理成功则返回修改后的聊天实例
 * @private
 */
const chatDismiss = (msg, socket) => {
    if (msg.isSuccess) {
        const chat = getChat(msg.data.gid);
        if (chat) {
            chat.dismissDate = msg.data.dismissDate;
            updateChats(chat);
            return chat;
        }
    }
};

/**
 * 处理服务器推送设置聊天是否公开操作结果
 * @param {SocketMessage} msg Socket 消息对象
 * @param {Socket} socket Socket 连接实例
 * @return {Chat} 如果处理成功则返回修改后的聊天实例
 * @private
 */
const chatChangepublic = (msg, socket) => {
    if (msg.isSuccess) {
        const chat = getChat(msg.data.gid);
        if (chat) {
            chat.public = msg.data.public;
            updateChats(chat);
            return chat;
        }
    }
};

/**
 * 处理服务器推送请求获取公开聊天列表操作结果
 * @param {SocketMessage} msg Socket 消息对象
 * @param {Socket} socket Socket 连接实例
 * @return {Chat[]} 如果处理成功则返回获取到的公开聊天列表
 * @private
 */
const chatGetpubliclist = (msg, socket) => {
    let publicChats = [];
    if (msg.isSuccess) {
        publicChats = msg.data.map(x => {
            const chat = new Chat(x);
            chat.updateMembersSet(members);
            return chat;
        });
    }
    updatePublicChats(publicChats);
    return publicChats;
};

/**
 * 处理服务器推送通知消息操作
 * @param {SocketMessage} msg Socket 消息对象
 * @param {Socket} socket Socket 连接实例
 * @return {boolean} 返回操作结果
 * @private
 */
const chatNotify = (msg, socket) => {
    if (Config.ui['chat.littlexx'] && msg.isSuccess) {
        let messages = msg.data;
        if (!Array.isArray(messages)) {
            if (messages.cgid) {
                messages = [messages];
            } else {
                messages = Object.keys(messages).map(x => messages[x]);
            }
        }

        if (messages && messages.length) {
            messages.forEach(x => {x.type = 'notification';});
            updateChatMessages(messages);
        }
        return true;
    }
};

/**
 * Socket 服务器推送消息处理函数
 * @type {Object<string, Function(msg: SocketMessage, socket: Socket)>}
 */
export default {
    'chat/changename': chatChangeName,
    'chat/setcommitters': chatSetcomitters,
    'chat/addmember': chatAddmember,
    'chat/getlist': chatGetlist,
    'chat/create': chatCreate,
    'chat/message': chatMessage,
    'chat/history': chatHistory,
    'chat/star': chatStar,
    'chat/mute': chatMute,
    'chat/category': chatCategory,
    'chat/joinchat': chatJoinchat,
    'chat/hide': chatHide,
    'chat/dismiss': chatDismiss,
    'chat/changepublic': chatChangepublic,
    'chat/getpubliclist': chatGetpubliclist,
    'chat/notify': chatNotify
};
