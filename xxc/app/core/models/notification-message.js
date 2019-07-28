import Config from '../../config';
import ChatMessage from './chat-message';
import Member from './member';
import {isNotEmptyString} from '../../utils/string-helper';

/**
 * 通知消息类
 *
 * @export
 * @class NotificationMessage
 * @extends {ChatMessage}
 */
export default class NotificationMessage extends ChatMessage {
    /**
     * 获取消息发送者
     *
     * @type {Member}
     * @readonly
     * @memberof NotificationMessage
     */
    get sender() {
        if (!this._sender) {
            const {notification} = this;
            let {sender} = notification;
            if (global.ExtsRuntime && global.ExtsRuntime.getNotificationSender) {
                const extSender = global.ExtsRuntime.getNotificationSender(sender);
                if (extSender) {
                    extSender.system = true;
                    sender = extSender;
                }
            }
            if (!sender.system && sender.id === 'ranzhi') {
                sender = {
                    id: 'ranzhi',
                    realname: '然之协同',
                    system: true,
                    avatar: `$${Config.media['image.path']}ranzhi-icon.png`
                };
            }
            this._sender = new Member(sender);
        }
        return this._sender;
    }

    /**
     * 获取消息发送者 ID
     * @memberof NotificationMessage
     * @type {string}
     */
    get senderId() {
        return this.notification.sender.id || 'robot1';
    }

    /**
     * 获取是否为通知类消息，此类实例永远返回 `true`
     * @memberof NotificationMessage
     * @type {boolean}
     */
    get isNotification() {
        return true;
    }

    /**
     * 获取通知操作
     * @memberof NotificationMessage
     * @type {Object[]}
     */
    get actions() {
        const {notification} = this;
        let {actions} = notification;
        if (actions && !Array.isArray(actions)) {
            actions = [actions];
        }
        return actions;
    }

    /**
     * 获取通知数据对象
     * @memberof NotificationMessage
     * @type {Object<string, any>}
     */
    get notification() {
        return this.data;
    }

    /**
     * 获取通知发送者，相当于调用 `sender` 属性
     * @memberof NotificationMessage
     * @return {Member} 发送人成员实例
     */
    getSender() {
        return this.sender;
    }

    /**
     * 获取是否需要检查重新发送，因为通知消息只能是服务器推送的，所以此属性永远返回 `true`
     * @memberof NotificationMessage
     * @type {boolean}
     */
    get needCheckResend() {
        return false;
    }

    /**
     * 获取是否发送失败，因为通知消息只能是服务器推送的，所以此属性永远返回 `true`
     * @memberof NotificationMessage
     * @type {boolean}
     */
    get isSendFailed() {
        return false;
    }

    /**
     * 获取是否过期，因为通知消息只能是服务器推送的，所以此属性永远返回 `true`
     * @memberof NotificationMessage
     * @type {boolean}
     */
    get isOutdated() {
        return false;
    }

    /**
     * 创建一个通知消息类实例
     *
     * @static
     * @param {Object<string, any>|NotificationMessage} data 用于创建实例的属性对象
     * @returns {NotificationMessage} 一个通知消息类实例
     * @memberof NotificationMessage
     */
    static create(data) {
        if (data instanceof NotificationMessage) {
            return data;
        }
        if (data.data) {
            // eslint-disable-next-line prefer-destructuring
            data = data.data;
        }

        let content = `#### ${data.title}`;
        if (isNotEmptyString(data.subtitle)) {
            content += `\n##### ${data.subtitle}`;
        }
        if (isNotEmptyString(data.content)) {
            content += `\n${data.content}`;
        }

        return new NotificationMessage({
            cgid: 'littlexx',
            content,
            contentType: data.contentType,
            data,
            date: data.date,
            gid: data.gid,
            user: data.sender.id,
            type: 'notification',
            id: data.id,
        });
    }
}
