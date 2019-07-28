import Config, {getSpecialVersionName} from '../../config'; // eslint-disable-line
import {socket} from '../server';
import imServerHandlers from './im-server-handlers';
import events from '../events';
import profile from '../profile';
import members from '../members';
import PKG from '../../package.json';
import Chat from '../models/chat';
import Messager from '../../components/messager';
import {formatBytes} from '../../utils/string-helper';
import {createPhpTimestramp} from '../../utils/date-helper';
import ChatMessage from '../models/chat-message';
import Lang from '../lang';
import {getImageInfo} from '../../utils/image';
import FileData from '../models/file-data';
import {checkUploadFileSize, uploadFile} from './im-files';
import {isWebUrl} from '../../utils/html-helper';
import {
    updateChatMessages, getChat, queryChats, initChats,
} from './im-chats';
import platform from '../../platform';

/**
 * 适合使用 Base64 格式发送图片的最大文件大小
 * @type {number}
 * @private
 */
const MAX_BASE64_IMAGE_SIZE = 1024 * 10;

/**
 * 事件名称表
 * @type {Object}
 * @private
 */
const EVENT = {
    history: 'im.chats.history',
    history_start: 'im.chats.history.start',
    history_end: 'im.chats.history.end',
    message_send: 'im.server.message.send',
    message_receive: 'im.server.message.receive',
};

/**
 * 聊天加入任务
 * @type {number}
 * @private
 */
let chatJoinTask = null;

// 设置 Socket 接收消息处理函数
socket.setHandler(imServerHandlers);

/**
 * 获取消息历史记录分页器
 * @type {Object}
 * @private
 */
let historyFetchingPager = null;

/**
 * 是否正在请求消息历史记录
 * @returns {boolean} 如果返回 `true` 则为正在请求消息历史记录，否则为不是
 */
export const isFetchingHistory = () => {
    return historyFetchingPager;
};

/**
 * 请求从服务器获取聊天历史记录
 * @param {Object} pager 分页器对象
 * @param {boolean} continued 是否需要继续进行下一页的请求
 * @param {number} startDate 消息记录的最早日期（时间戳形式）
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const fetchChatsHistory = (pager, continued = false, startDate = 0) => {
    if (continued instanceof Date || typeof continued === 'number') {
        startDate = continued;
        continued = false;
    }
    if (pager === 'all') {
        pager = {queue: queryChats(x => !!x.id, true).map(x => x.gid)};
    }
    if (typeof pager === 'string') {
        pager = {queue: [pager]};
    }
    pager = Object.assign({
        recPerPage: 50,
        pageID: 1,
        recTotal: 0,
        continued: true,
        perent: 0,
        finish: [],
        startDate,
    }, historyFetchingPager, pager);
    if (pager.startDate) {
        pager.startDate = createPhpTimestramp(pager.startDate);
    }
    if (!pager.queue || !pager.queue.length) {
        if (DEBUG) {
            console.error('Cannot fetch history, because the fetch queue is empty.', pager);
        }
        return;
    }
    // eslint-disable-next-line prefer-destructuring
    pager.gid = pager.queue[0];
    if (pager.total === undefined) {
        pager.total = pager.finish.length + pager.queue.length;
    }
    if (pager.pageID === 1 && pager.continued && !continued) {
        if (historyFetchingPager) {
            if (DEBUG) {
                console.warn('Server is busy.');
            }
            return;
        }
        events.emit(EVENT.history_start, pager);
        historyFetchingPager = pager;
    }
    return socket.send({
        method: 'history',
        params: [pager.gid, pager.recPerPage, pager.pageID, pager.recTotal, pager.continued, pager.startDate]
    });
};

/**
 * 将服务器推送的历史消息记录更新到数据库
 * @param {string} cgid 聊天 GID
 * @param {ChatMessage[]} messages 历史聊天消息列表
 * @param {Object} pager 分页器对象
 * @param {AppSocket} socket Socket 服务实例
 * @return {void}
 */
export const updateChatHistory = (cgid, messages, pager, socket) => {
    if (messages && messages.length) {
        updateChatMessages(messages, true, true);
    }

    const isFetchOver = pager.pageID * pager.recPerPage >= pager.recTotal;
    pager = Object.assign({}, historyFetchingPager, pager, {
        isFetchOver,
    });
    if (pager.continued) {
        if (isFetchOver && pager.queue.length < 2) {
            historyFetchingPager = null;
        } else {
            if (isFetchOver) {
                pager.finish.push(pager.queue.shift());
                pager = Object.assign(pager, {
                    pageID: 1,
                    recTotal: 0,
                });
            } else {
                pager = Object.assign(pager, {
                    pageID: pager.pageID + 1,
                });
            }
            fetchChatsHistory(pager, true);
        }
    }
    pager.total = pager.finish.length + pager.queue.length;
    pager.percent = 100 * (pager.finish.length / pager.total + (pager.recTotal ? ((Math.min(pager.recTotal, pager.pageID * pager.recPerPage) / pager.recTotal)) : 0) / pager.total);
    events.emit(EVENT.history, pager, messages);

    if (pager.continued && !historyFetchingPager) {
        events.emit(EVENT.history_end, pager);
    }
};

/**
 * 绑定接收到服务器推送的聊天消息记录事件
 * @param {Funcion} listener 事件回调函数
 * @return {Symbol} 使用 `Symbol` 存储的事件 ID，用于取消事件
 */
export const onChatHistory = listener => {
    return events.on(EVENT.history, listener);
};

/**
 * 绑定开始接收到服务器推送的聊天消息记录事件
 * @param {Funcion} listener 事件回调函数
 * @return {Symbol} 使用 `Symbol` 存储的事件 ID，用于取消事件
 */
export const onChatHistoryStart = listener => {
    return events.on(EVENT.history_start, listener);
};

/**
 * 绑定完成接收到服务器推送的聊天消息记录事件
 * @param {Funcion} listener 事件回调函数
 * @return {Symbol} 使用 `Symbol` 存储的事件 ID，用于取消事件
 */
export const onChatHistoryEnd = listener => {
    return events.on(EVENT.history_end, listener);
};

/**
 * 请求服务器创建一个新的聊天
 * @param {Chat|{gid:string, name: string, type: string, members: number[]}} chat 要创建的聊天对象
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const createChat = chat => {
    return socket.sendAndListen({
        method: 'create',
        params: [
            chat.gid,
            chat.name || '',
            chat.type,
            chat.members,
            0,
            false
        ]
    }).then(theChat => {
        if (theChat) {
            const groupUrl = `#/chats/groups/${theChat.gid}`;
            if (theChat.isGroup) {
                sendBoardChatMessage(Lang.format('chat.createNewChat.format', `@${profile.user.account}`, `[**[${theChat.getDisplayName({members, user: profile.user})}](${groupUrl})**]`), theChat);
            }
        }
        return Promise.resolve(theChat);
    });
};

/**
 * 在本地创建一个聊天实例
 * @private
 * @param {Set<number>|number[]} chatMembers 聊天成员
 * @param {Object} chatSetting 聊天属性对象
 * @return {Chat} 新创建的聊天实例
 */
const createLocalChatWithMembers = (chatMembers, chatSetting) => {
    if (!Array.isArray(chatMembers)) {
        chatMembers = [chatMembers];
    }
    const userMeId = profile.user.id;
    chatMembers = chatMembers.map(member => {
        if (typeof member === 'object') {
            return member.id;
        }
        return member;
    });
    if (!chatMembers.find(memberId => memberId === userMeId)) {
        chatMembers.push(userMeId);
    }
    let chat = null;
    if (chatMembers.length === 2) {
        const gid = chatMembers.sort().join('&');
        chat = getChat(gid);
        if (!chat) {
            chat = new Chat(Object.assign({
                members: chatMembers,
                createdBy: profile.userAccount,
                type: Chat.TYPES.one2one
            }, chatSetting));
        }
    } else {
        chat = new Chat(Object.assign({
            members: chatMembers,
            createdBy: profile.user.account,
            type: Chat.TYPES.group
        }, chatSetting));
    }
    return chat;
};

/**
 * 根据给定的成员清单创建一个聊天实例，如果成员清单中只有自己和另一个人则创建一个一对一聊天，否则创建一个讨论组；
 * 如果一对一聊天已经存在则直接返回之前的聊天实例，而不是请求服务器创建一个新的。
 * @param {Set<number>|number[]} chatMembers 聊天成员
 * @param {Object} chatSettings 聊天属性对象
 * @return {Chat} 新创建的聊天实例
 */
export const createChatWithMembers = (chatMembers, chatSettings) => {
    const chat = createLocalChatWithMembers(chatMembers, chatSettings);
    if (chat.id) {
        return Promise.resolve(chat);
    }
    return createChat(chat);
};

/**
 * 请求从服务器获取公开聊天列表
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const fetchPublicChats = () => {
    return socket.sendAndListen('getpubliclist');
};

/**
 * 设置聊天的白名单信息
 * @param {Chat} chat 聊天实例
 * @param {Set<string>|string[]|string} committers 白名单信息
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const setChatCommitters = (chat, committers) => {
    if (committers instanceof Set) {
        committers = Array.from(committers);
    }
    if (Array.isArray(committers)) {
        committers = committers.join(',');
    }
    return socket.send({
        method: 'setCommitters',
        params: [chat.gid, committers]
    });
};

/**
 * 切换聊天是否设置为公开
 * @param {Chat} chat 聊天实例
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const toggleChatPublic = (chat) => {
    return socket.send({
        method: 'changePublic',
        params: [chat.gid, !chat.public]
    });
};

/**
 * 切换聊天是否设置为已收藏
 * @param {Chat} chat 聊天实例
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const toggleChatStar = (chat) => {
    const sendRequest = () => {
        return socket.send({
            method: 'star',
            params: [chat.gid, !chat.star]
        });
    };
    if (!chat.id) {
        return createChat(chat).then(sendRequest);
    }
    return sendRequest();
};

/**
 * 切换聊天是否设置为免打扰
 * @param {Chat} chat 聊天实例
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const toggleMuteChat = (chat) => {
    const sendRequest = () => {
        return socket.send({
            method: 'mute',
            params: [chat.gid, !chat.mute]
        });
    };
    if (!chat.id) {
        return createChat(chat).then(sendRequest);
    }
    return sendRequest();
};

/**
 * 切换聊天是否设置为已隐藏（存档）
 * @param {Chat} chat 聊天实例
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const toggleHideChat = (chat) => {
    const sendRequest = () => {
        return socket.send({
            method: 'hide',
            params: [chat.gid, !chat.hide]
        });
    };
    if (!chat.id) {
        return createChat(chat).then(() => {
            return sendRequest();
        });
    }
    return sendRequest();
};

/**
 * 设置聊天分组
 * @param {Chat} chat 聊天实例
 * @param {string} category 分组名称
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const setChatCategory = (chat, category) => {
    const isArray = Array.isArray(chat);
    const gids = isArray ? chat.map(x => x.gid) : [chat.gid];
    const sendRequest = () => {
        return socket.send({
            method: 'category',
            params: [gids, category]
        });
    };
    if (!isArray && !chat.id) {
        return createChat(chat).then(() => {
            return sendRequest();
        });
    }
    return sendRequest();
};

/**
 * 向给定的聊天发送消息
 * @param {SocketMessage} socketMessage 聊天消息
 * @param {Chat} chat 聊天实例对象
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const sendSocketMessageForChat = (socketMessage, chat) => {
    if (chat.id) {
        return socket.sendAndListen(socketMessage);
    }
    return createChat(chat).then(() => {
        return socket.sendAndListen(socketMessage);
    });
};

/**
 * 创建一个广播聊天消息实例
 * @param {string} message 广播消息内容
 * @param {Chat|{gid: string}} chat 聊天实例对象
 * @return {ChatMessage} 广播聊天消息实例
 */
export const createBoardChatMessage = (message, chat) => {
    return new ChatMessage({
        content: message,
        user: profile.userId,
        cgid: chat.gid,
        type: ChatMessage.TYPES.broadcast
    });
};

/**
 * 发送广播消息
 * @param {string} message 广播消息内容
 * @param {Chat|{gid: string}} chat 聊天实例对象
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const sendBoardChatMessage = (message, chat) => {
    return sendChatMessage(createBoardChatMessage(message, chat), chat, true);
};

/**
 * 创建一个文本聊天消息
 * @param {string} message 消息内容
 * @param {Chat|{gid:string}} chat 聊天对象
 * @param {boolean} [isMarkdown=null] 是否为 Markdown 格式消息，如果为 `null` 则根据用户设置判断
 * @return {ChatMessage} 聊天消息实例
 */
export const createTextChatMessage = (message, chat, isMarkdown = null) => {
    const {userConfig} = profile;
    let contentType;
    if (isMarkdown === null || isMarkdown === undefined) {
        contentType = (Config.ui['chat.sendMarkdown'] && userConfig && userConfig.sendMarkdown) ? ChatMessage.CONTENT_TYPES.text : ChatMessage.CONTENT_TYPES.plain;
    } else {
        contentType = isMarkdown ? ChatMessage.CONTENT_TYPES.text : ChatMessage.CONTENT_TYPES.plain;
    }
    return new ChatMessage({
        content: message,
        user: profile.userId,
        cgid: chat.gid,
        contentType
    });
};

/**
 * 创建一个网址卡片消息
 * @param {string} url 网址
 * @param {Chat|{gid:string}} chat 聊天对象
 * @return {ChatMessage} 聊天消息实例
 * @private
 */
const createUrlObjectMessage = (url, chat) => {
    return new ChatMessage({
        content: JSON.stringify({type: ChatMessage.OBJECT_TYPES.url, url}),
        user: profile.userId,
        cgid: chat.gid,
        contentType: ChatMessage.CONTENT_TYPES.object
    });
};

/**
 * 发送一个文本类聊天消息
 * @param {string} message 文本消息内容
 * @param {Chat|{gid:string}} chat 聊天对象
 * @param {boolean} [isMarkdown=null] 文本内容是否为 Markdown 格式
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const sendTextMessage = (message, chat, isMarkdown = null) => {
    return sendChatMessage(message && isWebUrl(message.trim()) ? createUrlObjectMessage(message, chat) : createTextChatMessage(message, chat, isMarkdown), chat);
};

/**
 * 转发已有的消息到其他聊天
 * @param {ChatMessage} originMessage 要转发的原始消息
 * @param {Chat|Array<Chat>} chats 要转发到那些聊天
 * @param {function(number)} onProgress 发送进度变更回调函数
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const forwardMessage = async (originMessage, chats, onProgress) => {
    if (!Array.isArray(chats)) {
        chats = [chats];
    }
    const forwardMessageData = {
        forwardFrom: {
            gid: originMessage.gid,
            user: originMessage.senderId,
            date: originMessage.date,
        },
    };
    for (let i = 0; i < chats.length; ++i) {
        const chat = chats[i];
        if (onProgress) {
            onProgress(i / chats.length, i + 1, chats.length, chat);
        }
        const message = new ChatMessage({
            user: profile.userId,
            cgid: chat.gid,
            type: originMessage.type,
            content: originMessage.content,
            contentType: originMessage.contentType,
            data: forwardMessageData
        });
        await sendChatMessage(message, chat); // eslint-disable-line
    }
    if (onProgress) {
        onProgress(1, chats.length, chats.length);
    }
};

/**
 * 创建一个 Emoji 聊天消息
 * @param {string} emojicon Emojicon 表情名称
 * @param {Chat|{gid:string}} chat 聊天对象
 * @return {ChatMessage} 聊天消息实例
 */
export const createEmojiChatMessage = (emojicon, chat) => {
    return new ChatMessage({
        contentType: ChatMessage.CONTENT_TYPES.image,
        content: JSON.stringify({type: 'emoji', content: emojicon}),
        user: profile.userId,
        cgid: chat.gid,
    });
};

/**
 * 发送 Emoji 聊天消息
 * @param {string} emojicon Emojicon 表情名称
 * @param {Chat|{gid:string}} chat 聊天对象
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const sendEmojiMessage = (emojicon, chat) => {
    return sendChatMessage(createEmojiChatMessage(emojicon, chat), chat, true);
};

/**
 * 重命名聊天
 * @param {Chat} chat 聊天实例
 * @param {string} newName 新的聊天名称
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const renameChat = (chat, newName) => {
    if (chat && chat.canRename(profile.user)) {
        if (chat.id) {
            return socket.sendAndListen({
                method: 'changename',
                params: [chat.gid, newName]
            }).then(theChat => {
                if (theChat) {
                    sendBoardChatMessage(Lang.format('chat.rename.someRenameGroup.format', `@${profile.user.account}`, `**${newName}**`), theChat);
                }
                return Promise.resolve(theChat);
            });
        }
        chat.name = newName;
        if (DEBUG) {
            console.error('Cannot rename a local chat.', chat);
        }
        return Promise.reject(new Error('Cannot rename a local chat.'));
    }
    return Promise.reject(new Error('You have no permission to rename the chat.'));
};

/**
 * 向服务器发送聊天消息
 * @param {ChatMessage[]} messages 要发送聊天消息列表
 * @param {Chat} chat 聊天实例
 * @param {boolean} [isSystemMessage=false] 是否是系统消息
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const sendChatMessage = async (messages, chat, isSystemMessage = false) => {
    if (!Array.isArray(messages)) {
        messages = [messages];
    }

    if (!chat) {
        chat = getChat(messages[0].cgid);
        if (!chat) {
            return Promise.reject(new Error('Chat is not set before send messages.'));
        }
    }

    if (!isSystemMessage && chat.isReadonly(profile.user)) {
        return Promise.reject(Lang.string('chat.blockedCommitterTip'));
    }

    messages.forEach(message => {
        message.order = chat.newMsgOrder();

        const command = message.getCommand();
        if (command) {
            if (command.action === 'version') {
                const specialVersionName = getSpecialVersionName();
                const specialVersion = specialVersionName ? ` for ${specialVersionName}` : '';
                const contentLines = ['```'];
                contentLines.push(
                    `$$version       = '${PKG.version}${PKG.buildVersion ? (`.${PKG.buildVersion}`) : ''}${specialVersion}';`,
                    `$$serverVersion = '${profile.user.serverVersion}';`,
                    `$$platform      = '${platform.type}';`,
                    `$$os            = '${platform.access('env.os')}';`
                );
                if (platform.has('env.arch')) {
                    contentLines.push(`$$arch          = '${platform.access('env.arch')}';`);
                }
                contentLines.push('```');
                message.content = contentLines.join('\n');
            } else if (command.action === 'dataPath' && platform.has('ui.createUserDataPath')) {
                const contentLines = ['```'];
                contentLines.push(
                    `$$dataPath = '${platform.call('ui.createUserDataPath', profile.user, '', '')}';`,
                );
                contentLines.push('```');
                message.content = contentLines.join('\n');
            }
        }
    });

    if (!isSystemMessage) {
        events.emit(EVENT.message_send, messages, chat);
    }

    updateChatMessages(messages);

    return sendSocketMessageForChat({
        method: 'message',
        params: {
            messages: messages.map(m => {
                const msgObj = m.plainServer();
                if (!profile.user.isVersionSupport('messageOrder')) {
                    delete msgObj.order;
                }
                return msgObj;
            })
        }
    }, chat);
};

/**
 * 将图片文件通过 Base64 编码发送
 * @param {FileData} imageFile 图片文件
 * @param {Chat} chat 聊天实例
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
const sendImageAsBase64 = (imageFile, chat) => {
    return new Promise((resolve) => {
        const sendBase64 = base64Data => {
            const message = new ChatMessage({
                user: profile.userId,
                cgid: chat.gid,
                contentType: ChatMessage.CONTENT_TYPES.image
            });
            message.imageContent = {
                content: base64Data,
                time: new Date().getTime(),
                name: imageFile.name,
                size: imageFile.size,
                send: true,
                type: 'base64'
            };
            sendChatMessage(message, chat);
            resolve();
        };
        if (imageFile.base64) {
            sendBase64(imageFile.base64);
        } else {
            const reader = new FileReader();
            reader.onload = e => {
                sendBase64(e.target.result);
            };
            reader.readAsDataURL(imageFile.blob || imageFile);
        }
    });
};

/**
 * 发送图片消息并上传图片到服务器
 * @param {FileData} imageFile 图片文件
 * @param {Chat} chat 聊天实例
 * @param {function(progress: number)} onProgress 图片发送进度变更回调函数
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const sendImageMessage = async (imageFile, chat, onProgress) => {
    if (imageFile.size < MAX_BASE64_IMAGE_SIZE) {
        return sendImageAsBase64(imageFile, chat);
    }
    if (checkUploadFileSize(imageFile.size)) {
        const message = new ChatMessage({
            user: profile.userId,
            cgid: chat.gid,
            date: new Date(),
            contentType: ChatMessage.CONTENT_TYPES.image
        });
        imageFile = FileData.create(imageFile);
        message.attachFile = imageFile;
        let info = imageFile.imageInfo;
        if (!info) {
            info = await getImageInfo(imageFile.viewUrl).catch(() => {
                Messager.show(Lang.error('CANNOT_HANDLE_IMAGE'));
                if (DEBUG) {
                    console.warn('Cannot get image information', imageFile);
                }
            });
        }
        imageFile.width = info.width;
        imageFile.height = info.height;
        const imageObj = imageFile.plain();
        delete imageObj.type;
        message.imageContent = imageObj;
        await sendChatMessage(message, chat);
        return uploadFile(imageFile, progress => {
            message.updateImageContent({send: progress});
            sendChatMessage(message, chat);
            if (onProgress) {
                onProgress(progress);
            }
        }).then(data => {
            message.updateImageContent(Object.assign({}, data, {send: true}));
            return sendChatMessage(message, chat);
        }).catch(error => {
            message.updateImageContent({send: false, error: error && Lang.error(error)});
            sendChatMessage(message, chat);
        });
    }
    Messager.show(Lang.format('error.UPLOAD_FILE_IS_TOO_LARGE', formatBytes(imageFile.size)), {type: 'warning'});
    return Promise.reject();
};

/**
 * 发送文件消息并上传文件到服务器
 * @param {FileData} file 文件
 * @param {Chat} chat 聊天实例
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const sendFileMessage = (file, chat) => {
    if (checkUploadFileSize(file.size)) {
        const message = new ChatMessage({
            user: profile.userId,
            cgid: chat.gid,
            date: new Date(),
            contentType: ChatMessage.CONTENT_TYPES.file
        });
        file = FileData.create(file);
        file.cgid = chat.gid;
        message.fileContent = file.plain();
        sendChatMessage(message, chat);
        uploadFile(file, progress => {
            message.updateFileContent({send: progress});
            return sendChatMessage(message, chat);
        }).then(data => {
            message.updateFileContent(Object.assign({}, data, {send: true}));
            return sendChatMessage(message, chat);
        }).catch(error => {
            message.updateFileContent({send: false, error: error && Lang.error(error)});
            return sendChatMessage(message, chat);
        });
    } else {
        Messager.show(Lang.format('error.UPLOAD_FILE_IS_TOO_LARGE', formatBytes(file.size)), {type: 'warning'});
    }
};

/**
 * 邀请其他成员到给定的聊天中
 * @param {Chat} chat 聊天实例
 * @param {Member[]} chatMembers 要邀请的成员列表
 * @param {Object} newChatSetting 当需要创建新的聊天实例时的属性对象
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
const inviteMembersToChat = (chat, chatMembers, newChatSetting) => {
    if (chat.canInvite(profile.user)) {
        if (!chat.isOne2One) {
            return socket.sendAndListen({
                method: 'addmember',
                params: [chat.gid, chatMembers.map(x => x.id), true]
            });
        }
        chatMembers.push(...chat.membersSet);
        return createChatWithMembers(chatMembers, newChatSetting);
    }
};

/**
 * 将给定的成员从聊天中剔除
 * @param {Chat} chat 聊天实例
 * @param {Member} kickOfWho 要踢出的成员实例
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const kickOfMemberFromChat = (chat, kickOfWho) => {
    if (chat.canKickOff(profile.user, kickOfWho)) {
        return socket.sendAndListen({
            method: 'addmember',
            params: [chat.gid, [kickOfWho.id], false]
        });
    }
};

/**
 * 加入或退出聊天
 * @param {Chat} chat 聊天实例
 * @param {boolean} [join=true] 如果为 `true`，则为加入聊天，否则为退出聊天
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const joinChat = (chat, join = true) => {
    chatJoinTask = true;
    return socket.sendAndListen({
        method: 'joinchat',
        params: [chat.gid, join]
    }).then(theChat => {
        if (theChat && theChat.isMember(profile.userId)) {
            sendBoardChatMessage(Lang.format('chat.join.message', `@${profile.userAccount}`), theChat);
        }
        return Promise.resolve(theChat);
    });
};

/**
 * 退出指定的聊天
 * @param {Chat} chat 聊天实例
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const exitChat = (chat) => {
    if (chat.canExit(profile.user)) {
        return joinChat(chat, false).then(theChat => {
            if (theChat && !theChat.isMember(profile.userId)) {
                sendBoardChatMessage(Lang.format('chat.exit.message', `@${profile.userAccount}`), theChat);
            }
            return Promise.resolve(theChat);
        });
    }
    return Promise.reject();
};

/**
 * 解散聊天
 * @param {Chat} chat 聊天实例
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const dimissChat = chat => {
    if (chat.canDismiss(profile.user)) {
        return socket.sendAndListen({
            method: 'dismiss',
            params: [chat.gid]
        });
    }
    return Promise.reject();
};

/**
 * 处理从服务器接收到的消息
 * @param {Object[]} messages 接收到的消息列表
 * @return {void}
 */
export const handleReceiveChatMessages = messages => {
    updateChatMessages(messages);
    events.emit(EVENT.message_receive, messages);
};

/**
 * 处理从服务器接收到的聊天
 * @param {any[]} newChats 接收到的聊天列表
 * @return {void}
 */
export const handleInitChats = (newChats) => {
    initChats(newChats, chat => {
        if (chat.isOne2One && chat.hide) {
            toggleHideChat(chat);
        }
    });
};

/**
 * 绑定发送聊天消息事件
 * @param {Funcion} listener 事件回调函数
 * @return {Symbol} 使用 `Symbol` 存储的事件 ID，用于取消事件
 */
export const onSendChatMessages = listener => {
    return events.on(EVENT.message_send, listener);
};

/**
 * 绑定接收聊天消息事件
 * @param {Funcion} listener 事件回调函数
 * @return {Symbol} 使用 `Symbol` 存储的事件 ID，用于取消事件
 */
export const onReceiveChatMessages = listener => {
    return events.on(EVENT.message_receive, listener);
};

/**
 * 向服务器主动请求获取用户聊天列表
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const fetchChatList = () => {
    return socket.sendAndListen({
        method: 'getlist'
    });
};

/**
 * 从服务器获取指定的聊天信息
 * @param {string} cgid 聊天 gid
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const fetchChat = cgid => {
    return socket.sendAndListen({
        method: 'create',
        params: [
            cgid,
            '',
            '',
            '',
            0,
            false
        ]
    });
};

export default {
    fetchChatsHistory,
    fetchChatList,
    fetchChat,
    onChatHistoryStart,
    onChatHistoryEnd,
    onChatHistory,
    isFetchingHistory,
    updateChatHistory,
    createChat,
    createChatWithMembers,
    setCommitters: setChatCommitters,
    toggleChatPublic,
    toggleChatStar,
    toggleHideChat,
    toggleMuteChat,
    setChatCategory,
    renameChat,
    sendSocketMessageForChat,
    sendChatMessage,
    joinChat,
    exitChat,
    dimissChat,
    inviteMembersToChat,
    fetchPublicChats,
    forwardMessage,
    sendImageMessage,
    sendFileMessage,
    createBoardChatMessage,
    sendBoardChatMessage,
    createTextChatMessage,
    createEmojiChatMessage,
    sendTextMessage,
    sendEmojiMessage,
    handleReceiveChatMessages,
    handleInitChats,
    onSendChatMessages,
    onReceiveChatMessages,
    kickOfMemberFromChat,

    get chatJoinTask() {
        return chatJoinTask;
    },

    set chatJoinTask(flag) {
        chatJoinTask = flag;
    },
};
