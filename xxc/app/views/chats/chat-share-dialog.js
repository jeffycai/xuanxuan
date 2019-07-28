import React from 'react';
import Modal from '../../components/modal';
import ChatShare from './chat-share';
import Lang from '../../core/lang';

/**
 * 显示转发消息对话框界面
 * @param {string} message 广播消息内容
 * @param {function} callback 回调函数
 * @return {void}
 */
export const showChatShareDialog = (message, callback) => {
    const modalId = 'app-chat-share-dialog';
    return Modal.show({
        id: modalId,
        title: Lang.string('chat.share'),
        className: 'app-chat-share-dialog',
        actions: false,
        content: <ChatShare message={message} onRequestClose={() => (Modal.hide(modalId))} />,
    }, callback);
};

export default {
    show: showChatShareDialog,
};
