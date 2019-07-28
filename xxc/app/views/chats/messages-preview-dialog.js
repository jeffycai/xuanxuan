import React from 'react';
import Modal from '../../components/modal';
import Lang from '../../core/lang';
import _MessageList from './message-list';
import withReplaceView from '../with-replace-view';

/**
 * MessageList 可替换组件形式
 * @type {Class<MessageList>}
 * @private
 */
const MessageList = withReplaceView(_MessageList);

/**
 * 显示聊天消息预览对话框
 * @param {ChatMessage[]} messages 聊天消息列表
 * @param {Object} props 对话框属性
 * @param {function} callback 回调函数
 * @return {void}
 */
export const showMessagesPreviewDialog = (messages, props, callback) => {
    const modalId = 'app-messages-preview-dialog';
    return Modal.show(Object.assign({
        id: modalId,
        title: Lang.string('chat.sendbox.toolbar.previewDraft'),
        animation: 'enter-from-bottom',
        style: {
            bottom: 0,
            top: 'auto',
            width: '65%',
            minWidth: 400,
            position: 'absolute'
        },
        actions: false,
        contentClassName: 'box',
        content: <MessageList listItemProps={{ignoreStatus: true}} showDateDivider={false} messages={messages} />
    }, props), callback);
};

export default {
    show: showMessagesPreviewDialog,
};
