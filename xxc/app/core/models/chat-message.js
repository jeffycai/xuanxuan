import Entity from './entity';
import Status from '../../utils/status';
import Member from './member';

/**
 * 聊天消息状态管理器
 *
 * @private
 * @type {Status}
 */
const STATUS = new Status({
    draft: 0,
    sending: 1,
    sendFail: 2,
    ok: 3,
}, 0);

/**
 * 聊天消息类型表
 * @type {Object<string,string>}
 * @private
 */
const TYPES = {
    broadcast: 'broadcast',
    normal: 'normal',
    notification: 'notification'
};

/**
 * 聊天消息内容类型表
 * @type {Object<string,string>}
 * @private
 */
const CONTENT_TYPES = {
    file: 'file',
    image: 'image',
    text: 'text',
    plain: 'plain',
    emoticon: 'emoticon',
    object: 'object'
};

/**
 * 聊天消息对象内容类型表
 * @type {Object<string,string>}
 * @private
 */
const OBJECT_TYPES = {
    default: 'default',
    url: 'url'
};

/**
 * 判断会发送失败的等待时间，单位毫秒
 * @type {number}
 * @private
 */
const SEND_WAIT_TIME = 10000;

export default class ChatMessage extends Entity {
    /**
     * 实体名称
     * @type {string}
     * @memberof Entity
     */
    static NAME = 'ChatMessage';

    /**
     * 聊天消息状态管理器
     *
     * @static
     * @type {Status}
     * @memberof ChatMessage
     */
    static STATUS = STATUS;

    /**
     * 聊天消息类型表
     * @type {Object<string,string>}
     * @static
     * @memberof ChatMessage
     */
    static TYPES = TYPES;

    /**
     * 聊天消息内容类型表
     * @type {Object<string,string>}
     * @static
     * @memberof ChatMessage
     */
    static CONTENT_TYPES = CONTENT_TYPES;

    /**
     * 聊天消息对象内容类型表
     * @type {Object<string,string>}
     * @static
     * @memberof ChatMessage
     */
    static OBJECT_TYPES = OBJECT_TYPES;

    /**
     * 数据库存储实体属性结构管理器
     *
     * @type {EntitySchema}
     * @static
     * @memberof Chat
     */
    static SCHEMA = Entity.SCHEMA.extend({
        cgid: {type: 'string', indexed: true},
        user: {type: 'int', indexed: true},
        order: {type: 'int', indexed: true},
        date: {type: 'timestamp', indexed: true},
        type: {type: 'string', indexed: true, defaultValue: TYPES.normal},
        contentType: {type: 'string', indexed: true, defaultValue: CONTENT_TYPES.plain},
        content: {type: 'string', defaultValue: null},
        unread: {type: 'boolean', indexed: true, defaultValue: false},
        status: {type: 'int', indexed: true},
        data: {type: 'json'},
    });

    /**
     * 创建一个聊天消息类实例
     * @param {Object<string,any>} data 聊天消息属性对象
     * @param {string} [entityType=Chat.NAME] 实体类型名称
     * @memberof Chat
     */
    constructor(data, entityType = ChatMessage.NAME) {
        super(data, entityType);

        /**
         * 聊天消息状态
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
        if (!this.$.contentType) {
            this.$.contentType = CONTENT_TYPES.plain;
        }
        if (!this.$.type) {
            this.$.type = TYPES.normal;
        }
        if (!this.$.date) {
            this.$.date = new Date().getTime();
        }
    }

    /**
     * 获取用于发送到服务器的数据简单对象
     *
     * @return {Object<string,any>} 简单对象
     * @memberof ChatMessage
     */
    plainServer() {
        return {
            gid: this.gid,
            cgid: this.cgid,
            type: this.type,
            contentType: this.contentType,
            content: this.content,
            date: '',
            user: this.senderId,
            order: this.order,
        };
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
        return ChatMessage.SCHEMA;
    }

    /**
     * 设置 ID 属性
     * @param {number} remoteId  ID 属性
     * @memberof Chat
     */
    set id(remoteId) {
        super.id = remoteId;
        this._status.change(remoteId ? STATUS.ok : STATUS.sendFail);
    }

    /**
     * 获取 ID 属性值
     * @memberof Chat
     * @type {number}
     */
    get id() {
        return this.$get('id', 0);
    }

    /**
     * 获取排序序号
     * @memberof ChatMessage
     * @type {number}
     */
    get order() {
        return this.$get('order', 0);
    }

    /**
     * 设置排序序号
     * @param {number} order 排序序号
     * @memberof ChatMessage
     */
    set order(order) {
        this.$set('order', order);
    }

    /**
     * 获取状态值
     * @memberof ChatMessage
     * @readonly
     * @type {number}
     */
    get status() {
        return this._status.value;
    }

    /**
     * 获取状态名称
     * @memberof ChatMessage
     * @readonly
     * @type {string}
     */
    get statusName() {
        return this._status.name;
    }

    /**
     * 判断当前状态是否是给定的状态
     * @memberof ChatMessage
     * @param {number|string} status 要判断的状态值或状态名称
     * @return {boolean} 如果为 `true` 则为给定的状态，否则不是
     */
    isStatus(status) {
        return this._status.is(status);
    }

    /**
     * 获取是否发送失败
     * @memberof ChatMessage
     * @type {boolean}
     * @readonly
     */
    get isSendFail() {
        return this.isStatus(STATUS.sendFail);
    }

    /**
     * 获取是否发送成功
     * @memberof ChatMessage
     * @type {boolean}
     * @readonly
     */
    get isOK() {
        return this.isStatus(STATUS.ok);
    }

    /**
     * 获取是否已发送正在等待服务器结果
     * @memberof ChatMessage
     * @type {boolean}
     * @readonly
     */
    get isSending() {
        return this.isStatus(STATUS.sending);
    }

    /**
     * 获取是否是草稿状态（未发送）
     * @memberof ChatMessage
     * @type {boolean}
     * @readonly
     */
    get isDraft() {
        return this.isStatus(STATUS.draft);
    }

    /**
     * 标记为开始发送状态
     *
     * @memberof ChatMessage
     * @return {void}
     */
    beginSend() {
        this.$set('date', new Date().getTime());
        this._status.change(STATUS.sending);
        setTimeout(() => {
            if (this.isStatus(STATUS.sending)) {
                this._status.change(STATUS.sendFail);
            }
        }, SEND_WAIT_TIME);
    }

    /**
     * 标记为结束发送
     *
     * @param {*} remoteId 服务器存储 ID，如果为 `0`，表示发送失败（没有在服务器上存储）
     * @return {void}
     * @memberof ChatMessage
     */
    endSend(remoteId) {
        this.id = remoteId;
    }

    /**
     * 获取全局唯一标识字符串 GID
     * @memberof ChatMessage
     * @type {string}
     */
    get cgid() {
        return this.$get('cgid');
    }

    /**
     * 设置全局唯一标识字符串 GID
     * @param {string} gid 全局唯一标识字符串 GID
     * @memberof ChatMessage
     */
    set cgid(gid) {
        this.$set('cgid', gid);
    }

    /**
     * 获取是否处于未读状态
     * @memberof ChatMessage
     * @type {boolean}
     */
    get unread() {
        return this.$get('unread');
    }

    /**
     * 设置是否处于未读状态
     * @param {boolean} unread 处于未读状态
     * @memberof ChatMessage
     */
    set unread(unread) {
        this.$set('unread', unread);
    }

    /**
     * 获取消息额外存储数据
     * @memberof ChatMessage
     * @type {Object}
     */
    get data() {
        if (this._data === undefined) {
            this._data = this.$get('data');
        }
        return this._data;
    }

    /**
     * 设置消息额外存储数据
     * @param {any} data 消息额外存储数据，会转换为 JSON 字符串类型进行存储
     * @memberof ChatMessage
     */
    set data(data) {
        if (data !== undefined) {
            data = JSON.stringify(data);
            delete this._data;
        }
        this.$set('data', data);
    }

    /**
     * 获取消息额外数据属性值
     *
     * @param {String} name 属性名称
     * @param {any} defaultValue 默认值
     * @return {any} 属性值
     * @memberof ChatMessage
     */
    getDataValue(name, defaultValue) {
        const {data} = this;
        if (!data) {
            return defaultValue;
        }
        const value = data[name];
        return value === undefined ? defaultValue : value;
    }

    /**
     * 设置消息额外属性值
     * @param {String|Map<String, any>} name 属性名称
     * @param {?any} value 属性值
     * @return {void}
     */
    setDataValue(name, value) {
        const newDataObj = typeof name !== 'object' ? {[name]: value} : name;
        this.data = Object.assign({}, this.$data, newDataObj);
    }

    /**
     * 获取消息发送日期时间戳
     * @memberof ChatMessage
     * @type {number}
     */
    get date() {
        return this.$get('date');
    }

    /**
     * 设置消息发送日期时间戳
     * @param {number} date 消息发送日期时间戳
     * @memberof ChatMessage
     */
    set date(date) {
        this.$set('date', date);
    }

    /**
     * 获取消息发送日期时间戳，相当于读取 `date` 属性
     * @memberof ChatMessage
     * @type {number}
     */
    get sendTime() {
        return this.date;
    }

    /**
     * 获取消息发送者 ID
     * @memberof ChatMessage
     * @type {number}
     */
    get senderId() {
        return this.$get('user');
    }

    /**
     * 判断给定的成员 ID 是否是当前消息发送者
     *
     * @param {number} userId 成员 ID
     * @returns {boolean} 如果返回 `true` 则为是当前消息发送者，否则为不是当前消息发送者
     * @memberof ChatMessage
     */
    isSender(userId) {
        return this.senderId === userId;
    }

    /**
     * 获取消息发送者成员对象
     * @memberof ChatMessage
     * @type {Member}
     */
    get sender() {
        if (!this._sender) {
            return new Member({
                id: this.senderId
            });
        }
        return this._sender;
    }

    /**
     * 设置消息发送者
     * @param {Member} sendUser 消息发送者
     * @memberof ChatMessage
     */
    set sender(sendUser) {
        if (sendUser) {
            this._sender = sendUser;
            this.$set('user', sendUser.id);
        }
    }

    /**
     * 从系统获取消息发送成员对象
     *
     * @param {{get: function(id: number):Member}} appMembers 用于从系统获取成员信息的辅助对象
     * @return {Member} 消息发送成员
     * @memberof ChatMessage
     */
    getSender(appMembers) {
        this._sender = appMembers.get(this.senderId);
        return this._sender;
    }

    /**
     * 获取消息内容类型
     * @memberof ChatMessage
     * @type {string}
     */
    get contentType() {
        return this.$get('contentType', CONTENT_TYPES.text);
    }

    /**
     * 设置消息内容类型
     * @param {string} type 消息内容类型
     * @memberof ChatMessage
     */
    set contentType(type) {
        this.$set('contentType', type);
    }

    /**
     * 获取消息内容是否是文件
     * @memberof ChatMessage
     * @type {boolean}
     * @readonly
     */
    get isFileContent() {
        return this.contentType === CONTENT_TYPES.file;
    }

    /**
     * 获取消息内容是否是文本
     * @memberof ChatMessage
     * @type {boolean}
     * @readonly
     */
    get isTextContent() {
        return this.contentType === CONTENT_TYPES.text || this.contentType === CONTENT_TYPES.plain;
    }

    /**
     * 获取消息内容是否是纯文本
     * @memberof ChatMessage
     * @type {boolean}
     * @readonly
     */
    get isPlainTextContent() {
        return this.contentType === CONTENT_TYPES.plain;
    }

    /**
     * 获取消息内容是否是图片
     * @memberof ChatMessage
     * @type {boolean}
     * @readonly
     */
    get isImageContent() {
        return this.contentType === CONTENT_TYPES.image;
    }

    /**
     * 获取消息内容是否是对象
     * @memberof ChatMessage
     * @type {boolean}
     * @readonly
     */
    get isObjectContent() {
        return this.contentType === CONTENT_TYPES.object;
    }

    /**
     * 获取内容对象类型
     * @readonly
     * @memberof ChatMessage
     * @type {string}
     */
    get objectContentType() {
        return this.isObjectContent ? this.objectContent.type : null;
    }

    /**
     * 获取内容对象
     * @readonly
     * @memberof ChatMessage
     * @type {Object<string, any>}
     */
    get objectContent() {
        if (this.isObjectContent) {
            let objectContent = this._objectContent;
            if (!objectContent) {
                objectContent = JSON.parse(this.content);
                if (objectContent.path) {
                    delete objectContent.path;
                }
                this._objectContent = objectContent;
            }
            return objectContent;
        }
        return null;
    }

    /**
     * 获取消息类型
     * @memberof ChatMessage
     * @type {string}
     */
    get type() {
        return this.$get('type', TYPES.normal);
    }

    /**
     * 设置消息类型
     * @param {string} type 消息类型
     * @memberof ChatMessage
     */
    set type(type) {
        this.$set('type', type);
    }

    /**
     * 获取消息类型是否为广播
     * @memberof ChatMessage
     * @type {boolean}
     * @readonly
     */
    get isBroadcast() {
        return this.type === TYPES.broadcast;
    }

    /**
     * 获取原始内容字符串
     * @memberof ChatMessage
     * @type {string}
     */
    get content() {
        return this.$get('content');
    }

    /**
     * 设置原始内容字符串
     * @param {string} newContent 原始内容字符串
     * @memberof ChatMessage
     */
    set content(newContent) {
        this.$set('content', newContent);
        if (this._imageContent) {
            delete this._imageContent;
        }
        if (this._fileContent) {
            delete this._fileContent;
        }
        if (this._objectContent) {
            delete this._objectContent;
        }
        if (this._renderedTextContent) {
            delete this._renderedTextContent;
            delete this._isBlockContent;
        }
    }

    /**
     * 将文本消息渲染为 HTML 格式
     *
     * @param {...function(content: string, options: Object<string,any>)} converters 格式转换函数
     * @return {string} 转换后的 HTML 字符串
     * @memberof ChatMessage
     */
    renderedTextContent(...converters) {
        if (this._renderedTextContent === undefined) {
            let {content} = this;
            const renderOptions = {renderMarkdown: this.isBroadcast || !this.isPlainTextContent};
            if (typeof content === 'string' && content.length) {
                if (converters && converters.length) {
                    converters.forEach(converter => {
                        if (converter) {
                            content = converter(content, renderOptions);
                        }
                    });
                }
                this._renderedTextContent = content;
                this._isBlockContent = content && (content.includes('<h1>') || content.includes('<h2>') || content.includes('<h3>'));
            } else {
                this._renderedTextContent = '';
                this._isBlockContent = false;
            }
        }
        return this._renderedTextContent;
    }

    /**
     * 获取是否块级富文本消息（至少包含一个 3 级以上的标题）
     * @memberof ChatMessage
     * @type {boolean}
     */
    get isBlockContent() {
        return this.renderedTextContent && this._isBlockContent;
    }

    /**
     * 获取图片内容对象
     * @memberof ChatMessage
     * @type {Object<string,any>}
     */
    get imageContent() {
        if (this.isImageContent) {
            let imageContent = this._imageContent;
            if (!imageContent) {
                imageContent = JSON.parse(this.content);
                if (imageContent.path) {
                    delete imageContent.path;
                }
                this._imageContent = imageContent;
            }
            return imageContent;
        }
        return null;
    }

    /**
     * 设置图片内容对象
     * @param {Object} content 图片内容对象
     * @memberof ChatMessage
     */
    set imageContent(content) {
        delete content.path;

        this.contentType = CONTENT_TYPES.image;
        this._imageContent = content;
        this.content = JSON.stringify(content);
    }

    /**
     * 更新图片内容对象
     *
     * @param {Object} content 图片内容对象
     * @return {void}
     * @memberof ChatMessage
     */
    updateImageContent(content) {
        this._imageContent = Object.assign({}, this.imageContent, content);
        this.content = JSON.stringify(this._imageContent);
    }

    /**
     * 获取文件内容对象
     * @memberof ChatMessage
     * @type {Object<string,any>}
     */
    get fileContent() {
        if (this.isFileContent) {
            let fileContent = this._fileContent;
            if (!fileContent) {
                fileContent = JSON.parse(this.content);
                if (fileContent.path) {
                    delete fileContent.path;
                }
                this._fileContent = fileContent;
            }
            if (fileContent) {
                fileContent.user = this.user;
                if (this._sender) {
                    fileContent.sender = this.sender;
                }
                fileContent.senderId = this.senderId;
                fileContent.attachFile = this.attachFile;
                fileContent.date = this.sendTime;
                fileContent.gid = this.gid;
            }
            return fileContent;
        }
        return null;
    }

    /**
     * 设置文件内容对象
     * @param {Object} content 文件内容对象
     * @memberof ChatMessage
     */
    set fileContent(content) {
        delete content.path;

        this.contentType = CONTENT_TYPES.file;
        this.content = JSON.stringify({
            name: content.name || content.title,
            size: content.size,
            send: content.send,
            type: content.type,
            id: content.id,
            time: content.time,
            isImage: content.type && content.type.startsWith('image')
        });
        this._fileContent = content;
    }

    /**
     * 更新文件内容对象
     *
     * @param {Object} content 文件内容对象
     * @return {void}
     * @memberof ChatMessage
     */
    updateFileContent(content) {
        this._fileContent = Object.assign({}, this.fileContent, content);
        this.content = JSON.stringify(this._fileContent);
    }

    /**
     * 获取消息指令对象
     *
     * @return {{action: string}} 消息指令对象
     * @memberof ChatMessage
     */
    getCommand() {
        if (this.contentType === 'text') {
            const content = this.content.trim();
            if (content === '$$version') {
                return {action: 'version'};
            }
            if (content === '$$dataPath') {
                return {action: 'dataPath'};
            }
        }
        return null;
    }

    /**
     * 重置实体属性
     *
     * @param {Object} newData 属性对象
     * @memberof ChatMessage
     * @return {void}
     */
    reset(newData) {
        if (newData instanceof ChatMessage) {
            newData = newData.plain();
        }
        this.$set(newData);
        this._status.change(newData.status);
        delete this._fileContent;
        delete this._imageContent;
        delete this._isBlockContent;
        delete this._renderedTextContent;
        delete this._sender;
    }

    /**
     * 检查消息是否需要检查重新发送
     * @type {boolean}
     * @memberof ChatMessage
     * @readonly
     */
    get needCheckResend() {
        return !this.id;
    }

    /**
     * 判断消息是否发送失败并且需要重新发送
     * @type {boolean}
     * @memberof ChatMessage
     * @readonly
     */
    get needResend() {
        return this.needCheckResend && this.isSendFailed && !this.isFileContent && !this.isImageContent;
    }

    /**
     * 获取是否发送失败
     * @memberof ChatMessage
     * @type {boolean}
     * @readonly
     */
    get isSendFailed() {
        return this.needCheckResend && this.isOutdated;
    }

    /**
     * 检查消息是否过期（在一定时间内没有收到服务器回应的远程存储 ID）
     * @type {boolean}
     * @memberof ChatMessage
     * @readonly
     */
    get isOutdated() {
        return (new Date().getTime() - this.date) > 10000;
    }

    /**
     * 创建一个聊天消息类实例
     *
     * @static
     * @param {Object<string,any>|ChatMessage} chatMessage 聊天消息属性对象或者聊天消息实例
     * @return {ChatMessage} 聊天消息类实例
     * @memberof ChatMessage
     */
    static create(chatMessage) {
        if (chatMessage instanceof ChatMessage) {
            return chatMessage;
        }
        return new ChatMessage(chatMessage);
    }

    /**
     * 对聊天消息列表进行排序
     * @param  {ChatMessage[]} messages 要排序的聊天列表
     * @return {ChatMessage[]} 排序后的聊天列表
     * @memberof ChatMessage
     * @static
     */
    static sort(messages) {
        return messages.sort((x, y) => {
            let orderResult = x.date - y.date;
            if (orderResult === 0 && x.order && y.order) {
                orderResult = x.order - y.order;
            }
            if (orderResult === 0) {
                orderResult = (x.id || Number.MAX_SAFE_INTEGER) - (y.id || Number.MAX_SAFE_INTEGER);
            }
            return orderResult;
        });
    }
}
