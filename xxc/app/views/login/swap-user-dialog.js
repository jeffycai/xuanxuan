import React from 'react';
import Modal from '../../components/modal';
import _SwapUser from './swap-user';
import Lang from '../../core/lang';
import withReplaceView from '../with-replace-view';

/**
 * SwapUser 可替换组件形式
 * @type {Class<SwapUser>}
 * @private
 */
const SwapUser = withReplaceView(_SwapUser);

/**
 * 显示切换用户对话框
 * @param {string} identify 当前用户标识字符串
 * @param {function(user: Object)} onSelectUser 当切换用户时的回调函数
 * @param {function} callback 对话框显示完成的回调函数
 * @return {void}
 */
export const showSwapUserDialog = (identify, onSelectUser, callback) => {
    const modalId = 'app-login-swap-user';
    return Modal.show({
        title: Lang.string('login.swapUser'),
        actions: false,
        id: modalId,
        style: {width: 400},
        content: <SwapUser
            identify={identify}
            onSelectUser={user => {
                Modal.hide(modalId);
                if (onSelectUser) {
                    onSelectUser(user);
                }
            }}
        />
    }, callback);
};

export default {
    show: showSwapUserDialog,
};
