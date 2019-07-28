import ui from './ui';
import remote from './remote';
import {showNotification} from '../common/notification';
import {playSound} from '../common/sound';

/**
 * 请求获取桌面用户注意
 * @param {boolean} [attention=true] 是否请求获取桌面用户注意
 * @return {void}
 */
export const requestAttention = (attention = true) => {
    if (attention) {
        remote.call('dockBounce', 'informational');
    }
    ui.browserWindow.flashFrame(attention);
};

/**
 * 设置 Mac Dock 栏应用图标上的原点提示文本
 *
 * @param {string} label 提示文本
 * @return {void}
 */
export const setBadgeLabel = (label) => {
    if (label === false) {
        label = '';
    }
    ui.setBadgeLabel(label);
};

/**
 * 更新通知栏图标
 * @param {string} title 通知栏图标上的工具提示文本（鼠标悬停时显示）
 * @param {boolean} [flash=false] 是否闪烁通知栏图标
 * @return {void}
 */
export const updateTrayIcon = (title, flash = false) => {
    ui.setTrayTooltip(title);
    ui.flashTrayIcon(flash);
};

export default {
    requestAttention,
    setBadgeLabel,
    updateTrayIcon,
    showNotification,
    playSound,
};
