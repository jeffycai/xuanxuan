import Socket from './socket';
import clipboard from './clipboard';
import sound from '../common/sound';
import crypto from './crypto';
import EventEmitter from './event-emitter';
import env from './env';
import ui from './ui';
import dialog from './dialog';
import notify from './notify';
import net from './net';

/**
 * 浏览器平台上所有可用的模块
 */
export default {
    type: 'browser',
    Socket,
    clipboard,
    crypto,
    EventEmitter,
    env,
    ui,
    notify,
    sound,
    net,
    dialog,
};
