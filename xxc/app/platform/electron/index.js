import fs from 'fs-extra';
import sound from '../common/sound';
import env from './env';
import screenshot from './screenshot';
import contextmenu from './contextmenu';
import remote from './remote';
import EventEmitter from './event-emitter';
import image from './image';
import ui from './ui';
import notify from './notify';
import shortcut from './shortcut';
import dialog from './dialog';
import net from './net';
import crypto from './crypto';
import Socket from './socket';
import clipboard from './clipboard';
import webview from './webview';
import buildIn, {buildInPath} from './build-in';
import language, {initLanguage} from './language';

if (process.type !== 'renderer') {
    throw new Error('platform/electron/index.js must run in renderer process.');
}

export const init = ({config, lang}) => {
    if (config) {
        // 初始化 ion-sound 声音播放模块
        sound.init(config.media['sound.path']);

        // 初始化界面交互功能模块
        ui.init(config);
    }

    if (lang) {
        contextmenu.setLangObj(lang);
    }

    initLanguage();

    if (DEBUG) {
        console.color('Build-in Path', 'greenBg', buildInPath, 'greenPale');
    }
};

const platform = {
    type: 'electron',
    init,
    language,
    env,
    screenshot,
    contextmenu,
    EventEmitter,
    remote,
    image,
    ui,
    shortcut,
    dialog,
    fs,
    sound,
    net,
    crypto,
    Socket,
    notify,
    clipboard,
    webview,
    buildIn,
};

export default platform;
