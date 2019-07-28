import events from './events';
import Lang from './lang';
import Config from '../config';
import platform from '../platform';

/**
 * 平台提供的通知功能访问对象
 * @type {Object}
 * @private
 */
const notify = platform.access('notify');

/**
 * 平台提供的通用界面交互访问对象
 * @type {Object}
 * @private
 */
const PlatformUI = platform.access('ui');

/**
 * 默认通知内容
 * @type {Object<string, any>}
 * @private
 */
const DEFAULT = {
    chats: 0,
    total: 0,
    message: null,
    sound: false,
    tray: false
};

/**
 * 事件名称表
 * @type {Object<string, string>}
 * @private
 */
const EVENT = {
    update: 'notice.update',
};

/**
 * 更新通知信息
 * @param {Object<string, any>} info 通知信息对象
 * @return {void}
 */
export const updateNotice = info => {
    info = Object.assign({}, DEFAULT, info);
    info.total = info.chats + 0;

    if (info.sound && notify.playSound) {
        notify.playSound(info.sound);
    }

    if (notify.setBadgeLabel) {
        notify.setBadgeLabel(info.notMuteCount || '');
    }

    if (notify.updateTrayIcon) {
        if (info.tray) {
            const trayLabel = info.tray.label ? `${Lang.string('app.title')} - ${info.tray.label}` : Lang.string('app.title');
            notify.updateTrayIcon(trayLabel, info.tray.flash);
        } else {
            notify.updateTrayIcon(Lang.string('app.title'));
        }
    }

    if (info.message && notify.showNotification) {
        const noticeOptions = typeof info.message === 'object' ? info.message : {title: info.message};
        if (!noticeOptions.icon) {
            noticeOptions.icon = `${Config.media['image.path']}icon.png`;
        }
        notify.showNotification(info.message);
    }

    events.emit(EVENT.update, info);
};

/**
 * 判定当前桌面应用是否处于给定条件中描述的状态
 * 所有可用的条件状态包括：
 * - `onWindowHide`：当前应用窗口已经被隐藏
 * - `onWindowBlur`：当前应用窗口已经失去焦点
 * @param {string} condition 条件名称
 * @return {boolean}
 */
export const isMatchWindowCondition = condition => {
    if (condition === 'onWindowHide') {
        return !PlatformUI.isWindowOpen;
    }
    if (condition === 'onWindowBlur') {
        return !PlatformUI.isWindowFocus;
    }
    return true;
};

/**
 * 绑定通知变更事件
 * @param {Function} listener 事件回调函数
 * @return {Symbo} 事件 ID
 */
export const onNoticeUpdate = listener => (events.on(EVENT.update, listener));

/**
 * 在用户系统桌面上请求获得用户注意
 * @function
 * @return {void}
 */
// eslint-disable-next-line prefer-destructuring
export const requestAttention = notify.requestAttention;

export default {
    update: updateNotice,
    onNoticeUpdate,
    isMatchWindowCondition,
    requestAttention: notify.requestAttention
};
