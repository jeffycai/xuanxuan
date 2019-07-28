import Md5 from 'md5';
import Config from '../../config';
import Chat from '../models/chat';
import ChatMessage from '../models/chat-message';
import NotificationMessage from '../models/notification-message';
import profile from '../profile';
import Events from '../events';
import members from '../members';
import db from '../db';
import StringHelper from '../../utils/string-helper';
import {getTimeBeforeDesc} from '../../utils/date-helper';
import TaskQueue from '../../utils/task-queue';
import timeSequence from '../../utils/time-sequence';
import Lang from '../lang';
import Server from '../server';

/**
 * 从运行时配置读取默认每次加载聊天记录条目的数目
 * @type {number}
 * @private
 */
const CHATS_LIMIT_DEFAULT = Config.ui['chat.flow.size'];

/**
 * 默认标记为最近聊天最大过去时间，单位毫秒
 * @type {number}
 * @private
 */
const MAX_RECENT_TIME = 1000 * 60 * 60 * 24 * 7;

/**
 * 搜索权值计算表
 * @type {Object}
 * @private
 */
const SEARCH_SCORE_MAP = {
    matchAll: 100,
    matchPrefix: 75,
    include: 50,
    similar: 10
};

/**
 * 事件名称表
 * @type {Object}
 * @private
 */
const EVENT = {
    init: 'chats.init',
    messages: 'chats.messages',
    fetchQueueFinish: 'fetch.queue.finish.',
};

/**
 * 所有聊天实例对象表
 * @type {Object}
 * @private
 */
let chats = null;

/**
 * 公开聊天实例对象表
 * @type {Object}
 * @private
 */
let publicChats = null;

/**
 * 用于方便获取用户信息的对象
 * @type {Object}
 * @private
 */
const app = {
    members,
    get user() {
        return profile.user;
    }
};

/**
 * 遍历当前用户的每一个聊天
 * @param {Function(chat: Chat)} callback 遍历回调函数
 * @return {void}
 */
export const forEachChat = (callback) => {
    if (chats) {
        Object.keys(chats).forEach(gid => {
            callback(chats[gid]);
        });
    }
};

/**
 * 根据 GID 获取聊天对象
 * @param {string} gid 聊天 GID
 * @return {Chat}
 */
export const getChat = (gid) => {
    if (!chats) {
        return null;
    }
    let chat = chats[gid];
    if (!chat && gid.includes('&')) {
        const chatMembers = gid.split('&').map(x => Number.parseInt(x, 10));
        chat = new Chat({
            gid,
            members: chatMembers,
            createdBy: profile.user.account,
            type: Chat.TYPES.one2one
        });
        chat.updateMembersSet(members);
        updateChats(chat);
    }
    return chat;
};

/**
 * 创建一个聊天消息实例
 * @param {ChatMessage|Object} message 聊天消息存储对象
 * @return {ChatMessage}
 */
export const createChatMessage = message => {
    if (message instanceof ChatMessage) {
        return message;
    }
    if (message.type === 'notification') {
        message = NotificationMessage.create(message);
    } else {
        message = ChatMessage.create(message);
    }
    return message;
};

/**
 * 获取一对一聊天 GID
 * @param {Set|Array} members 一对一聊天成员 ID 列表
 * @return {string}
 */
export const getOne2OneChatGid = members => {
    if (members instanceof Set) {
        members = Array.from(members);
    }
    if (members.length > 2 || !members.length) {
        throw new Error(`Cannot build gid for members count with ${members.length}.`);
    } else if (members.length === 1) {
        members.push(profile.userId);
    }
    return members.map(x => x.id || x).sort().join('&');
};

/**
 * 获取上次激活的聊天
 * @return {Chat}
 */
export const getLastActiveChat = () => {
    let lastChat = null;
    forEachChat(chat => {
        if (!lastChat || lastChat.lastActiveTime < chat.lastActiveTime) {
            lastChat = chat;
        }
    });
    return lastChat;
};

/**
 * 保存聊天消息到数据库
 * @param {Array.<ChatMessage>} messages 聊天消息列表
 * @param {?Chat|?Array<Chat>} chat 要保存的聊天对象
 * @return {Promise}
 */
export const saveChatMessages = (messages, chats) => {
    if (!Array.isArray(messages)) {
        messages = [messages];
    }

    Events.emit(EVENT.messages, messages);

    if (chats) {
        updateChats(chats);
    }

    // Save messages to database
    if (messages.length) {
        return db.database.chatMessages.bulkPut(messages.map(x => x.plain()));
    }
    return Promise.resolve(0);
};

/**
 * 更新缓存中的聊天消息
 * @param {Object[]} messages 聊天消息列表
 * @param {boolean} [muted=false] 是否忽略未读提示
 * @param {boolean} [skipOld=false] 是否跳过已更新的消息
 * @return {Promise}
 */
export const updateChatMessages = (messages, muted = false, skipOld = false) => {
    if (skipOld === true) {
        skipOld = 60 * 1000 * 60 * 24;
    }
    if (!Array.isArray(messages)) {
        messages = [messages];
    }
    const chatsMessages = {};
    const messagesForUpdate = messages.map(message => {
        message = createChatMessage(message);
        if (!chatsMessages[message.cgid]) {
            chatsMessages[message.cgid] = [message];
        } else {
            chatsMessages[message.cgid].push(message);
        }
        return message;
    });

    const updatedChats = {};
    Object.keys(chatsMessages).forEach(cgid => {
        const chat = getChat(cgid);
        if (chat && chat.isMember(profile.userId)) {
            chat.addMessages(chatsMessages[cgid], profile.userId, muted, skipOld);
            if (muted) {
                chat.muteNotice();
            }
            updatedChats[cgid] = chat;
        }
    });

    updateChats(updatedChats);

    return saveChatMessages(messagesForUpdate);
};

/**
 * 移除本地（未发送成功）的聊天消息
 * @param {ChatMessage} message 要移除的聊天消息
 * @return {Promise}
 */
export const deleteLocalMessage = (message) => {
    if (message.id) {
        return Promise.reject(new Error('Cannot delete a remote chat message.'));
    }
    const chat = getChat(message.cgid);
    chat.removeMessage(message.gid);
    Events.emitDataChange({chats: {[chat.gid]: chat}});
    return db.database.chatMessages.delete(message.gid);
};

/**
 * 获取聊天消息数目
 * @param {string} cgid 聊天 GID
 * @param {function(message: ChatMessage)} filter 过滤回调函数
 * @return {Promise<number>}
 */
export const countChatMessages = (cgid, filter) => {
    let collection = db.database.chatMessages.where({cgid});
    if (filter) {
        collection = collection.and(filter);
    }
    return collection.count();
};

/**
 * 获取聊天消息
 * @param {Chat} chat 聊天对象
 * @param {function(message: ChatMessage)} queryCondition 查询过滤函数
 * @param {number} [limit=CHATS_LIMIT_DEFAULT] 最多返回数目
 * @param {number} [offset=0] 要略过的数目
 * @param {boolean} [reverse=true] 是否已倒序返回
 * @param {boolean} [skipAdd=true] 是否忽略添加到聊天消息缓存中
 * @param {boolean} [rawData=false] 是否返回原始数据而不是 ChatMessage
 * @param {boolean} [returnCount=false] 是否仅仅返回数目
 * @return {Promise}
 */
export const getChatMessages = (chat, queryCondition, limit = CHATS_LIMIT_DEFAULT, offset = 0, reverse = true, skipAdd = true, rawData = false, returnCount = false) => {
    // console.log('getChatMessages', {chat, queryCondition, limit, offset, reverse, skipAdd, rawData, returnCount});
    if (!db.database || !db.database.chatMessages) {
        return Promise.resolve([]);
    }
    const cgid = chat ? chat.gid : null;
    let collection = db.database.chatMessages.orderBy('id').and(x => {
        return (!cgid || x.cgid === cgid) && (!queryCondition || queryCondition(x));
    });
    if (reverse) {
        collection = collection.reverse();
    }
    if (offset) {
        collection = collection.offset(offset);
    }
    if (limit) {
        collection = collection.limit(limit);
    }
    if (returnCount) {
        return collection.count(count => {
            return Promise.resolve({gid: cgid, count, chat});
        });
    }
    return collection.toArray(chatMessages => {
        if (chatMessages && chatMessages.length) {
            const result = rawData ? chatMessages : chatMessages.map(createChatMessage);
            if (!skipAdd && cgid) {
                chat.addMessages(result, profile.userId, true);
                Events.emitDataChange({chats: {[cgid]: chat}});
            }
            return Promise.resolve(result);
        }
        return Promise.resolve([]);
    });
};

/**
 * 当前聊天消息查询任务队列是否正忙
 * @type {boolean}
 * @private
 */
let isGetChatMessagesQueueBusy = false;

/**
 * 当前聊天消息查询队列
 * @type {Array}
 * @private
 */
const fetchChatMessagesQueue = [];

/**
 * 监听当指定 ID 的消息查询任务完成事件
 * @param {string} queueId 聊天消息查询任务 ID
 * @param {Function} listener 事件回调函数
 * @return {Symbol}
 */
export const onFetchQueueFinish = (queueId, listener) => {
    return Events.once(`${EVENT.fetchQueueFinish}${queueId}`, listener);
};

/**
 * 处理聊天消息查询队列任务
 * @private
 * @return {void}
 */
const processChatMessageQueue = () => {
    if (isGetChatMessagesQueueBusy) {
        return;
    }
    if (fetchChatMessagesQueue.length) {
        isGetChatMessagesQueueBusy = true;
        const queueData = fetchChatMessagesQueue.pop();
        const {
            queueId, chat, queryCondition, limit, offset, reverse, skipAdd, rawData, returnCount,
        } = queueData;
        const handleChatMessageQueueResult = result => {
            Events.emit(`${EVENT.fetchQueueFinish}${queueId}`, result);
            isGetChatMessagesQueueBusy = false;
            processChatMessageQueue();
        };
        getChatMessages(getChat(chat), queryCondition, limit, offset, reverse, skipAdd, rawData, returnCount).then(handleChatMessageQueueResult).catch(handleChatMessageQueueResult);
    }
};

/**
 * 通过消息查询任务队列获取聊天消息
 * @param {Chat} chat 聊天对象
 * @param {function(message: ChatMessage)} queryCondition 查询过滤函数
 * @param {number} [limit=CHATS_LIMIT_DEFAULT] 最多返回数目
 * @param {number} [offset=0] 要略过的数目
 * @param {boolean} [reverse=true] 是否已倒序返回
 * @param {boolean} [skipAdd=true] 是否忽略添加到聊天消息缓存中
 * @param {boolean} [rawData=false] 是否返回原始数据而不是 ChatMessage
 * @param {boolean} [returnCount=false] 是否仅仅返回数目
 * @return {Promise}
 */
export const getChatMessagesInQueue = (chat, queryCondition, limit = CHATS_LIMIT_DEFAULT, offset = 0, reverse = true, skipAdd = true, rawData = false, returnCount = false) => {
    return new Promise((resolve, reject) => {
        const queueData = {
            chat: chat.gid, queryCondition, limit, offset, reverse, skipAdd, rawData, returnCount,
        };
        const queueId = Md5(JSON.stringify(queueData));
        queueData.queueId = queueId;
        if (!isGetChatMessagesQueueBusy || fetchChatMessagesQueue.every(x => x.queueId !== queueId)) {
            fetchChatMessagesQueue.push(queueData);
        }
        onFetchQueueFinish(queueId, result => {
            if (result instanceof Error) {
                reject(result);
            } else {
                resolve(result);
            }
        });
        processChatMessageQueue();
    });
};

/**
 * 加载指定聊天消息
 *
 * @param {Chat} chat 要加载的聊天实例
 * @param {boolean} [inQueue=true] 是否通过任务队列模式
 * @return {Promise}
 */
export const loadChatMessages = (chat, inQueue = true) => {
    let {loadingOffset} = chat;
    if (loadingOffset === true) {
        return Promise.reject();
    }
    if (!loadingOffset) {
        loadingOffset = 0;
    }
    const limit = loadingOffset ? 20 : CHATS_LIMIT_DEFAULT;
    return (inQueue ? getChatMessagesInQueue : getChatMessages)(chat, null, limit, loadingOffset, true, false).then(chatMessages => {
        if (!chatMessages || chatMessages.length < limit) {
            loadingOffset = true;
        } else {
            loadingOffset += limit;
        }
        chat.loadingOffset = loadingOffset;
        return Promise.resolve(chatMessages);
    });
};

/**
 * 搜索指定聊天记录
 * @param {Chat} chat 要搜索的聊天实例
 * @param {string} searchKeys 搜索关键词，多个关键字使用空格分隔
 * @param {number} minDate 最小日期时间戳，只搜索此日期之后的聊天记录
 * @param {bool} [returnCount=false] 是否只返回结果数目
 * @return {Promise}
 */
export const searchChatMessages = (chat, searchKeys = '', minDate = 0, returnCount = false) => {
    if (typeof minDate === 'string') {
        minDate = getTimeBeforeDesc(minDate);
    }
    const keys = searchKeys.toLowerCase().split(' ');
    return getChatMessages(chat, msg => {
        if (!msg.id || (minDate && msg.date < minDate)) {
            return false;
        }
        for (const key of keys) {
            if (key === '[image]') {
                if (msg.contentType !== 'image') {
                    return false;
                }
            } else if (key === '[file]') {
                if (msg.contentType !== 'file') {
                    return false;
                }
            } else if (msg.contentType === 'text' || msg.content.length < 200) {
                if (!msg.content || !msg.content.toLowerCase().includes(key)) {
                    return false;
                }
            } else {
                return false;
            }
        }
        return true;
    }, 0, 0, true, true, false, returnCount);
};

/**
 * 创建获取消息记录数目队列任务
 * @param {Array.<Chat>} countChats 要获取消息记录数目的聊天对象实例
 * @param {string} searchKeys 搜索关键字
 * @param {number} minDateDesc 最小日期描述
 * @return {TaskQueue}
 */
export const createCountMessagesTask = (countChats, searchKeys, minDateDesc = '') => {
    const minDate = minDateDesc ? getTimeBeforeDesc(minDateDesc) : 0;
    const taskQueue = new TaskQueue();
    taskQueue.add(countChats.map(chat => {
        return {func: searchChatMessages.bind(null, chat, searchKeys, minDate, true), chat};
    }));
    return taskQueue;
};

/**
 * 更新缓存中的聊天对象实例
 * @param {Array.<Chat|Object>} chatArr 要更新的聊天对象
 * @return {void}
 */
export const updateChats = (chatArr) => {
    if (!chatArr) return;

    if (!Array.isArray(chatArr)) {
        if (chatArr instanceof Chat) {
            chatArr = [chatArr];
        }
    }

    let newchats = null;
    if (Array.isArray(chatArr) && chatArr.length) {
        newchats = {};
        chatArr.forEach(chat => {
            chat = Chat.create(chat);
            if (chat.visible) {
                newchats[chat.gid] = chat;
            }
        });
    } else {
        newchats = chatArr;
    }

    if (newchats && Object.keys(newchats).length) {
        Object.assign(chats, newchats);
        Events.emitDataChange({chats: newchats});
    }
};

/**
 * 初始化缓存中的聊天对象实例
 * @param {Array.<Chat|Object>} chatArr 要更新的聊天对象
 * @param {function(chat: Chat)} eachCallback 遍历每一个被缓存的聊天对象回调函数
 * @return {void}
 */
export const initChats = (chatArr, eachCallback) => {
    publicChats = null;
    chats = {};
    if (chatArr && chatArr.length) {
        if (Config.ui['chat.littlexx']) {
            chatArr.push({
                gid: 'littlexx',
                name: Lang.string('common.littlexx'),
                type: 'robot',
                lastActiveTime: new Date().getTime() - Math.floor(MAX_RECENT_TIME / 2),
                members: [profile.user.id]
            });
        }
        updateChats(chatArr);
        forEachChat(chat => {
            if (chat.isOne2One) {
                const member = chat.getTheOtherOne(app);
                if (!member) {
                    return;
                }
                if (member.temp) {
                    chat.isDeleteOne2One = true;
                    Server.tryGetTempUserInfo(member.id);
                }
            }
            chat.renewUpdateId();
            delete chat.loadingOffset;
            if (eachCallback) {
                eachCallback(chat);
            }
        });
        Events.emit(EVENT.init, chats);
    }
};

/**
 * 获取缓存中所有聊天对象实例
 * @return {Array.<Chat>}
 */
export const getAllChats = () => {
    return chats ? Object.keys(chats).map(x => chats[x]) : [];
};

/**
 * 从缓存中查询聊天实例
 * @param {Object|Function(chat: Chat)|Array<Function(chat: Chat)>} condition 查询条件
 * @param {*} sortList 是否对结果进行排序
 * @return {Array.<Chat>}
 */
export const queryChats = (condition, sortList) => {
    if (!chats) {
        return [];
    }
    let result = null;
    if (typeof condition === 'object') {
        const conditionObj = condition;
        const conditionKeys = Object.keys(conditionObj);
        condition = chat => {
            for (const key of conditionKeys) {
                if (conditionObj[key] !== chat[key]) {
                    return false;
                }
            }
            return true;
        };
    }
    if (typeof condition === 'function') {
        result = [];
        forEachChat(chat => {
            if (condition(chat)) {
                result.push(chat);
            }
        });
    } else if (Array.isArray(condition)) {
        result = [];
        condition.forEach(x => {
            const chat = getChat(x);
            if (chat) {
                result.push(chat);
            }
        });
    } else {
        result = getAllChats();
    }
    if (sortList && result && result.length) {
        Chat.sort(result, sortList, app);
    }
    return result || [];
};

/**
 * 获取最近激活的聊天
 * @param {bool} [includeStar=true] 是否包含收藏的聊天
 * @param {boolean|String|Function} sortList 是否排序或者指定排序规则
 * @return {Array<Chat>}
 */
export const getRecentChats = (includeStar = true, sortList = true) => {
    const all = getAllChats();
    let recents = null;
    if (all.length < 4) {
        recents = all;
    } else {
        const now = new Date().getTime();
        recents = all.filter(chat => {
            return (chat.noticeCount || (!chat.hidden)) && !chat.isDeleteOne2One && !chat.isDismissed && (chat.noticeCount || (includeStar && chat.star) || (chat.lastActiveTime && (now - chat.lastActiveTime) <= MAX_RECENT_TIME));
        });
        if (!recents.length) {
            recents = all.filter(chat => chat.isSystem);
        }
    }
    if (sortList) {
        Chat.sort(recents, sortList, app);
    }
    return recents;
};

/**
 * 获取最近一次激活的聊天
 * @return {Chat}
 */
export const getLastRecentChat = () => {
    let lastActiveTime = 0;
    let lastRecentChat = null;
    forEachChat(chat => {
        if (!chat.isDeleteOne2One && !chat.isDismissed && lastActiveTime < chat.lastActiveTime) {
            // eslint-disable-next-line prefer-destructuring
            lastActiveTime = chat.lastActiveTime;
            lastRecentChat = chat;
        }
    });
    if (!lastRecentChat) {
        lastRecentChat = getAllChats().find(x => x.isSystem);
    }
    return lastRecentChat;
};

/**
 * 获取与指定联系人关联的一对一聊天
 * @param {Member|Object} member 联系人
 * @return {Chat}
 */
export const getContactChat = (member) => {
    const membersId = [member.id, profile.user.id].sort();
    const gid = membersId.join('&');
    return getChat(gid);
};

/**
 * 获取一对一聊天
 * @param {boolean|String|Function} sortList 是否排序或者指定排序规则
 * @param {boolean} [groupedBy=false] 是否按分组返回结果
 * @return {Object|Array.<Chat>}
 */
export const getContactsChats = (sortList = 'onlineFirst', groupedBy = false) => {
    const {user} = profile;
    let contactChats = [];
    if (!user) {
        return contactChats;
    }

    const contactChatMap = {};
    members.forEach(member => {
        if (member.id !== profile.user.id) {
            contactChatMap[member.id] = getContactChat(member, true);
        }
    });

    queryChats(x => x.isOne2One).forEach(theChat => {
        if (!contactChatMap[theChat.id]) {
            const member = theChat.getTheOtherOne(app);
            contactChatMap[member.id] = theChat;
        }
    });

    contactChats = Object.keys(contactChatMap).map(x => contactChatMap[x]);

    if (groupedBy === 'role') {
        const groupedContactChats = {};
        contactChats.forEach(chat => {
            const member = chat.getTheOtherOne(app);
            const isDeleteOne2One = member.isDeleted;
            if (isDeleteOne2One) {
                chat.isDeleteOne2One = isDeleteOne2One;
            }
            const isMemberOnline = member.isOnline;
            const role = member.role || '';
            const groupName = isDeleteOne2One ? Lang.string('chats.menu.group.deleted') : members.getRoleName(role);
            const groupId = isDeleteOne2One ? '_delete' : role;
            if (!groupedContactChats[groupId]) {
                groupedContactChats[groupId] = {
                    id: groupId, title: groupName, list: [chat], onlineCount: isMemberOnline ? 1 : 0
                };
                if (isDeleteOne2One) {
                    groupedContactChats[groupId].system = true;
                }
            } else {
                groupedContactChats[groupId].list.push(chat);
                if (isMemberOnline) {
                    groupedContactChats[groupId].onlineCount += 1;
                }
            }
        });
        const orders = profile.user.config.contactsOrderRole;
        return Object.keys(groupedContactChats).map(role => {
            const group = groupedContactChats[role];
            if (sortList) {
                Chat.sort(group.list, sortList, app);
            }
            return group;
        }).sort((g1, g2) => {
            let result = (g2.system ? 1 : 0) - (g1.system ? 1 : 0);
            if (result === 0) {
                result = (g1.id ? (orders[g1.id] || 1) : 0) - (g2.id ? (orders[g2.id] || 1) : 0);
            }
            if (result === 0) {
                result = g1.id > g2.id ? 1 : 0;
            }
            return -result;
        });
    }
    if (groupedBy === 'dept') {
        const groupsMap = {};
        Object.keys(members.depts).forEach(deptId => {
            const dept = members.depts[deptId];
            groupsMap[deptId] = {
                id: deptId,
                title: dept.name,
                dept,
                list: [],
                onlineCount: 0
            };
        });
        contactChats.forEach(chat => {
            const member = chat.getTheOtherOne(app);
            const isDeleteOne2One = member.isDeleted;
            if (isDeleteOne2One) {
                chat.isDeleteOne2One = isDeleteOne2One;
            }
            const isMemberOnline = member.isOnline;
            const groupId = isDeleteOne2One ? '_delete' : member.dept;
            if (groupsMap[groupId]) {
                groupsMap[groupId].list.push(chat);
                if (isMemberOnline) {
                    groupsMap[groupId].onlineCount += 1;
                }
            } else {
                const dept = members.getDept(groupId);
                const groupName = isDeleteOne2One ? Lang.string('chats.menu.group.deleted') : (dept && dept.name);
                groupsMap[groupId] = {
                    id: groupId,
                    title: groupName,
                    dept,
                    list: [chat],
                    onlineCount: isMemberOnline ? 1 : 0
                };
                if (isDeleteOne2One) {
                    groupsMap[groupId].system = true;
                }
            }
        });
        const groupArr = Object.keys(groupsMap).map(deptId => {
            const group = groupsMap[deptId];
            const {dept} = group;
            if (dept) {
                if (dept.children) {
                    group.children = dept.children.map(x => groupsMap[x.id]);
                }
                if (dept.parents) {
                    group.hasParent = true;
                }
            }
            group.type = 'group';
            group.order = dept && dept.order;
            if (sortList) {
                Chat.sort(group.list, sortList, app);
            }
            return group;
        });
        const deptsSorter = (d1, d2) => {
            let result = (d1.system ? 1 : 0) - (d2.system ? 1 : 0);
            if (result === 0) {
                result = (d2.list && d2.list.length ? 1 : 0) - (d1.list && d1.list.length ? 1 : 0);
            }
            if (result === 0) {
                result = (d2.dept ? 1 : 0) - (d1.dept ? 1 : 0);
            }
            return result !== 0 ? result : members.deptsSorter(d1, d2);
        };
        return groupArr.map(x => {
            if (x.children) {
                x.children.sort(deptsSorter);
                const list = x.children;
                if (x.list) {
                    list.push(...x.list);
                }
                x.list = list;
            }
            if (x.type === 'group' && x.dept && x.dept.children && x.dept.children.length === x.list.length) {
                x.onlySubGroup = true;
            }
            return x;
        }).filter(x => !x.hasParent).sort(deptsSorter);
    }
    if (groupedBy === 'category') {
        const groupedChats = {};
        contactChats.forEach(chat => {
            const member = chat.getTheOtherOne(app);
            const isDeleteOne2One = member.isDeleted;
            if (isDeleteOne2One) {
                chat.isDeleteOne2One = isDeleteOne2One;
            }
            const categoryId = isDeleteOne2One ? '_delete' : (chat.category || '');
            const categoryName = isDeleteOne2One ? Lang.string('chats.menu.group.deleted') : (categoryId || user.config.contactsDefaultCategoryName);
            const isMemberOnline = member.isOnline;
            if (!groupedChats[categoryId]) {
                groupedChats[categoryId] = {
                    id: categoryId, title: categoryName || Lang.string('chats.menu.group.default'), list: [chat], onlineCount: isMemberOnline ? 1 : 0,
                };
                if (isDeleteOne2One) {
                    groupedChats[categoryId].system = true;
                }
            } else {
                groupedChats[categoryId].list.push(chat);
                if (isMemberOnline) {
                    groupedChats[categoryId].onlineCount += 1;
                }
            }
        });
        const categories = user.config.contactsCategories;
        let needSaveOrder = false;
        const orderedGroups = Object.keys(groupedChats).map(categoryId => {
            const group = groupedChats[categoryId];
            let savedCategory = categories[categoryId];
            if (!savedCategory) {
                const order = timeSequence();
                savedCategory = {
                    order,
                    key: order
                };
                categories[categoryId] = savedCategory;
                needSaveOrder = true;
            }
            Object.assign(group, savedCategory);
            if (sortList) {
                Chat.sort(group.list, sortList, app);
            }
            return group;
        }).sort((g1, g2) => {
            let result = g2.order - g1.order;
            if (result === 0) {
                result = g1.id > g2.id ? -1 : 1;
            }
            return -result;
        });
        if (needSaveOrder) {
            user.config.contactsCategories = categories;
        }
        return orderedGroups;
    }
    if (sortList) {
        Chat.sort(contactChats, sortList, app);
    }
    return contactChats;
};

/**
 * 获取讨论组聊天
 * @param {boolean|String|Function} sortList 是否排序或者指定排序规则
 * @param {boolean} [groupedBy=false] 是否按分组返回结果
 * @return {Object|Array.<Chat>}
 */
export const getGroupsChats = (sortList = true, groupedBy = false) => {
    const {user} = profile;
    if (!user) {
        return [];
    }
    const groupChats = queryChats(chat => chat.isGroupOrSystem, sortList);
    if (groupedBy === 'category') {
        const groupedChats = {};
        groupChats.forEach(chat => {
            const {isDismissed} = chat;
            const isHidden = chat.hide;
            const categoryId = isDismissed ? '_dismissed' : isHidden ? '_hidden' : (chat.category || '');
            const categoryName = isDismissed ? Lang.string('chats.menu.group.dismissed') : isHidden ? Lang.string('chats.menu.group.hidden') : (categoryId || user.config.groupsDefaultCategoryName);
            if (!groupedChats[categoryId]) {
                groupedChats[categoryId] = {id: categoryId, title: categoryName || Lang.string('chats.menu.group.default'), list: [chat]};
                if (isDismissed || isHidden) {
                    groupedChats[categoryId].system = true;
                }
            } else {
                groupedChats[categoryId].list.push(chat);
            }
        });
        const groupKeys = Object.keys(groupedChats);
        if (groupKeys.length === 1 && !groupKeys[0]) {
            return groupChats;
        }
        const categories = user.config.groupsCategories;
        let needSaveOrder = false;
        const orderedGroups = groupKeys.map(categoryId => {
            const group = groupedChats[categoryId];
            let savedCategory = categories[categoryId];
            if (!savedCategory) {
                const order = categoryId === '_dismissed' ? 999999999999 : timeSequence();
                savedCategory = {
                    order,
                    key: order
                };
                categories[categoryId] = savedCategory;
                needSaveOrder = true;
            }
            Object.assign(group, savedCategory);
            if (sortList) {
                Chat.sort(group.list, sortList, app);
            }
            return group;
        }).sort((g1, g2) => {
            let result = g2.order - g1.order;
            if (result === 0) {
                result = g1.id > g2.id ? 1 : -1;
            }
            return -result;
        });
        if (needSaveOrder) {
            user.config.groupsCategories = categories;
        }
        return orderedGroups;
    }
    return groupChats;
};

/**
 * 获取聊天分组信息
 * @param {string} type 类型，包括 contact（联系人），group（讨论组）
 * @return {Array.<Object>}
 */
export const getChatCategories = (type = 'contact') => {
    if (type === 'contact') {
        return getContactsChats(false, 'category');
    }
    if (type === 'group') {
        const groups = getGroupsChats(false, 'category');
        if (groups.length && groups[0].entityType === 'Chat') {
            return [];
        }
        return groups;
    }
    return [];
};

/**
 * 搜索聊天
 * @param {string} searchKeys 搜索关键字，多个关键字使用空格分隔
 * @param {string} chatType 聊天类型，包括 contacts（联系人），groups（讨论组）
 * @return {Array.<Chat>}
 */
export const searchChats = (searchKeys, chatType) => {
    if (StringHelper.isEmpty(searchKeys)) {
        return [];
    }
    searchKeys = searchKeys.trim().toLowerCase().split(' ');
    if (!searchKeys.length) {
        return [];
    }

    const isContactsType = chatType === 'contacts';
    const isGroupsType = chatType === 'groups';
    const hasChatType = isContactsType || isGroupsType;

    if (!hasChatType || isContactsType) {
        getContactsChats();
    }

    const caculateScore = (sKey, findIn) => {
        if (StringHelper.isEmpty(sKey) || StringHelper.isEmpty(findIn)) {
            return 0;
        }
        if (sKey === findIn) {
            return SEARCH_SCORE_MAP.matchAll;
        }
        const idx = findIn.indexOf(sKey);
        return idx === 0 ? SEARCH_SCORE_MAP.matchPrefix : (idx > 0 ? SEARCH_SCORE_MAP.include : 0);
    };

    return queryChats(chat => {
        const chatGid = chat.gid.toLowerCase();
        if (hasChatType) {
            if ((isContactsType && !chat.isOne2One) || (isGroupsType && !chat.isGroupOrSystem)) {
                return;
            }
        }

        // Do not show delete one2one chat in search result
        if (chat.isDeleteOne2One) {
            return;
        }

        let score = 0;
        const chatName = chat.getDisplayName(app, false).toLowerCase();
        const pinYin = chat.getPinYin(app);
        let theOtherOneAccount = '';
        let theOtherOneContactInfo = '';
        if (chat.isOne2One) {
            const theOtherOne = chat.getTheOtherOne(app);
            if (theOtherOne) {
                theOtherOneAccount = theOtherOne.account;
                theOtherOneContactInfo += (theOtherOne.email || '') + (theOtherOne.mobile || '');
            } else if (DEBUG) {
                console.warn('Cannot get the other one of chat', chat);
            }
        }
        searchKeys.forEach(s => {
            if (StringHelper.isEmpty(s)) {
                return;
            }
            if (s.length > 1) {
                if (s[0] === '#') { // id
                    s = s.substr(1);
                    score += 2 * caculateScore(s, chatGid);
                    if (chat.isSystem || chat.isGroup) {
                        score += 2 * caculateScore(s, chatName);
                        if (chat.isSystem) {
                            score += 2 * caculateScore(s, 'system');
                        }
                    }
                } else if (s[0] === '@') { // account or username
                    s = s.substr(1);
                    if (chat.isOne2One) {
                        score += 2 * caculateScore(s, theOtherOneAccount);
                    }
                }
            }
            score += caculateScore(s, chatName);
            score += caculateScore(s, pinYin);
            if (theOtherOneContactInfo) {
                score += caculateScore(s, theOtherOneContactInfo);
            }
        });
        chat.score = score;
        return score > 0;
    }, ((x, y) => x.score - y.score));
};

/**
 * 从缓存中移除指定 GID 的聊天
 * @param {string} gid 要移除的聊天 GID
 * @return {boolean} 移除结果
 */
export const removeChat = gid => {
    const removedChat = chats[gid];
    if (removedChat) {
        removedChat.delete = true;
        delete chats[gid];
        Events.emitDataChange({chats: {[gid]: removedChat}});
        return true;
    }
    return false;
};

/**
 * 获取指定聊天中发送和接收的文件
 * @param {string} chat 聊天实例
 * @param {bool} [includeFailFile=false] 是否包含发送失败的文件
 * @return {Promise}
 */
export const getChatFiles = (chat, includeFailFile = false) => {
    return getChatMessages(chat, (x => x.contentType === 'file'), 0).then(fileMessages => {
        let files = null;
        if (fileMessages && fileMessages.length) {
            if (includeFailFile) {
                files = fileMessages.map(fileMessage => fileMessage.fileContent);
            } else {
                files = [];
                fileMessages.forEach(fileMessage => {
                    const {fileContent} = fileMessage;
                    if (fileContent.send === true && fileContent.id) {
                        files.push(fileContent);
                    }
                });
            }
        }
        return Promise.resolve(files || []);
    });
};

/**
 * 获取缓存中所有公共聊天
 * @return {Array.<chat>}
 */
export const getPublicChats = () => (publicChats || []);

/**
 * 更新缓存中的公共聊天
 * @param {Array.<Object>|Object} serverPublicChats 要更新的公共聊天
 * @return {void}
 */
export const updatePublicChats = (serverPublicChats) => {
    publicChats = [];
    if (serverPublicChats) {
        if (!Array.isArray(serverPublicChats)) {
            serverPublicChats = [serverPublicChats];
        }
        if (serverPublicChats.length) {
            serverPublicChats.forEach(chat => {
                chat = Chat.create(chat);
                publicChats.push(chat);
            });
        }
    }
    Events.emitDataChange({publicChats});
};

/**
 * 监听缓存聊天初始化事件（第一次从服务器获得到聊天列表）
 * @param {Function(chats: Array<Chat>)} listener 事件回调函数
 * @return {Symbol}
 */
export const onChatsInit = listener => {
    return Events.on(EVENT.init, listener);
};

/**
 * 监听聊天消息变更事件（例如用户收到了新消息）
 * @param {Function(chats: Array<ChatMessage>)} listener 事件回调函数
 * @return {Symbol}
 */
export const onChatMessages = listener => {
    return Events.on(EVENT.messages, listener);
};

// 监听用户资料变更事件，通常在用户登录之后
profile.onSwapUser(user => {
    // 将上一个用户的聊天缓存数据清空
    initChats();
});

// 监听用户成员变更事件
members.onMembersChange(newMembers => {
    // 遍历每一个聊天，标记聊天已更新
    forEachChat(chat => {
        chat._membersSet = null;
        chat.renewUpdateId();
    });
});

export default {
    init: initChats,
    update: updateChats,
    get: getChat,
    getAll: getAllChats,
    getRecents: getRecentChats,
    forEach: forEachChat,
    getLastActiveChat,
    query: queryChats,
    remove: removeChat,
    search: searchChats,
    getChatFiles,
    deleteLocalMessage,
    getChatMessages,
    updateChatMessages,
    saveChatMessages,
    getPublicChats,
    updatePublicChats,
    getContactsChats,
    getGroups: getGroupsChats,
    onChatsInit,
    onChatMessages,
    getOne2OneChatGid,
    countChatMessages,
    createCountMessagesTask,
    searchChatMessages,
    getChatCategories,
    getLastRecentChat,
    loadChatMessages,
};
