import React from 'react';
import Modal from '../../components/modal';
import ChatCode from './chat-send-code';
import Lang from '../../core/lang';
import App from '../../core';
import {isEmptyString} from '../../utils/string-helper';

/**
 * 处理发送代码按钮点击事件
 * @param {string} language 语言类型
 * @param {string} code 代码
 * @param {Chat} chat 聊天实例
 * @memberof ChatSendCodeDialog
 * @private
 * @return {void}
 */
const handleSubmitBtnClick = async (language, code, chat) => {
    const codeLanguage = language.toLowerCase();
    const codeContent = `\`\`\`${codeLanguage}\n${code}\n\`\`\``;

    if (code === '') {
        return;
    }

    await App.im.server.sendTextMessage(codeContent, chat, true); // eslint-disable-line
    App.im.ui.activeChat(chat, 'recents');
};

/**
 * 显示发送代码对话框界面
 * @param {Chat} chat 聊天对象
 * @param {function} callback 回调函数
 * @return {void}
 */
export const showChatCodeDialog = (chat, callback) => {
    const modalId = 'app-chat-code-dialog';
    let chatSendCode = null;
    return Modal.show({
        id: modalId,
        title: Lang.string('chat.sendCodeDialog.title'),
        style: {
            width: 650,
            position: 'absolute',
            bottom: 0,
        },
        className: 'app-chat-code-dialog',
        animation: 'enter-from-bottom',
        actions: [
            {
                type: 'submit',
                label: Lang.string('chat.sendCode.sendBtnLabel'),
                click: () => {
                    const codeInfo = chatSendCode.getCode();
                    if (isEmptyString(codeInfo.code)) {
                        chatSendCode.setRequireCodeWarning();
                        return false;
                    }
                    handleSubmitBtnClick(codeInfo.language, codeInfo.code, chat);
                }
            },
            {type: 'cancel'}
        ],
        content: <ChatCode ref={e => {chatSendCode = e;}} chat={chat} />
    }, callback);
};

export default {
    show: showChatCodeDialog,
};
