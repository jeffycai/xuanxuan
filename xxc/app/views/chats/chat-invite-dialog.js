import React from 'react';
import Modal from '../../components/modal';
import _ChatInvite from './chat-invite';
import Lang from '../../core/lang';
import withReplaceView from '../with-replace-view';

/**
 * ChatInvite 可替换组件形式
 * @type {Class<ChatInvite>}
 * @private
 */
const ChatInvite = withReplaceView(_ChatInvite);

/**
 * 显示邀请其他成员加入聊天对话框
 * @param {Chat} chat 聊天实例
 * @param {function} callback 显示完成后的回调函数
 * @return {void}
 */
export const showChatInviteDialog = (chat, callback) => {
    const modalId = 'app-chat-invite-dialog';
    const onRequestClose = () => {
        Modal.hide(modalId);
    };
    return Modal.show({
        id: modalId,
        className: 'app-chat-invite-dialog',
        title: Lang.string('chat.invite.title'),
        content: <ChatInvite chat={chat} onRequestClose={onRequestClose} />,
        actions: false,
    }, callback);
};

export default {
    show: showChatInviteDialog,
};
