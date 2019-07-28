import {showOpenDialog} from '../common/open-file-button';

/**
 * 显示文件保存对话框
 * @param {{fileUrl: string}} options 选项
 * @param {function(result: boolean)} callback 保存完成后的回调函数，其中参数 `result` 为是否成功保存文件
 * @return {void}
 */
export const showSaveDialog = (options, callback) => {
    if (options.fileUrl) {
        window.open(options.fileUrl);
        callback(true);
    } else {
        if (DEBUG) {
            console.warn('Cannot save file without file url defenition');
        }
        callback(false);
    }
};

export default {
    showSaveDialog,
    showOpenDialog,
};
