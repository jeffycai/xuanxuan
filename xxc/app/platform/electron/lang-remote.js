import {ipcMain, app} from 'electron';
import EVENTS from './remote-events';
import LangHelper from '../../utils/lang-helper';
import events from './events';

/**
 * 语言访问辅助对象
 * @type {LangHelper}
 */
const langHelper = new LangHelper();

// 绑定客户端请求变更语言事件
ipcMain.on(EVENTS.remote_lang_change, (e, langName, langData) => {
    langHelper.change(langName, langData);
    app.setName(langHelper.string('app.title'));
    events.emit(EVENTS.lang_change, langHelper);
});

/**
 * 绑定语言变更事件
 * @param {function(String)} listener 事件回调函数
 * @return {Symbol} 使用 `Symbol` 存储的事件 ID，用于取消事件
 * @example
 * import {onLangChange} from './lang-remote.js';
 * import {events} from './events';
 *
 * const langChangeHandler = onLangChange(newLang => {
 *     console.log('新语言名称为', newLang.name);
 * });
 *
 * // 取消事件绑定
 * events.off(langChangeHandler);
 */
export const onLangChange = listener => events.on(EVENTS.lang_change, listener);

export default langHelper;
