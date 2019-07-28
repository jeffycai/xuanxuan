import {profile} from '../../core';
import MemberProfileDialog from './member-profile-dialog';

/**
 * 显示个人资料对话框
 * @param {function} callback 对话框显示回调函数
 * @return {void}
 */
export const showUserProfileDialog = (callback) => {
    const {user} = profile;
    if (user) {
        return MemberProfileDialog.show(user, callback);
    } else if (callback) {
        callback(false);
    }
};

export default {
    show: showUserProfileDialog,
};
