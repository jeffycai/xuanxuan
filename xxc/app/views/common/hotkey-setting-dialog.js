import React from 'react';
import Modal from '../../components/modal';
import HotkeyInputControl from '../../components/hotkey-input-control';
import {enableGlobalShortcut, disableGlobalShortcut} from '../../core/ui';
import Lang from '../../core/lang';

/**
 * 显示快捷键设置对话框
 * @param {string} title 对话框标题
 * @param {string} defaultHotkey 默认快捷键
 * @param {function} onKeySelect 有按键按下时的回调函数
 * @param {function} callback 对话框显示完成时的回调函数
 * @return {void}
 */
export const showHotkeySettingDialog = (title, defaultHotkey, onKeySelect, callback) => {
    let userHotKey = defaultHotkey;
    disableGlobalShortcut();
    return Modal.show({
        title,
        onHidden: enableGlobalShortcut,
        onSubmit: () => {
            if (userHotKey !== defaultHotkey && onKeySelect) {
                onKeySelect(userHotKey);
            }
        },
        content: (
            <div>
                <HotkeyInputControl
                    onlyMotifyKeysText={Lang.string('setting.hotkeys.cantSetOnlyMotifyKeys')}
                    placeholder={defaultHotkey}
                    onChange={key => {
                        userHotKey = key;
                    }}
                />
            </div>
        )
    }, callback);
};

export default {
    show: showHotkeySettingDialog,
};
