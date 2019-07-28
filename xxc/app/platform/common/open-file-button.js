/**
 * 选择文件按钮
 * @type {Element}
 * @private
 */
const fileButton = document.getElementById('fileOpenButton');

/**
 * 显示打开文件对话框
 * @param {?string|{filters: string[]}} acceptExts 可用选择的文件扩展名
 * @param {function(result: any)} callback 文件选择完成后的回调函数，如果返回 `false`，表示选择文件失败，否则为所选择的文件对象数组
 * @return {void}
 */
export const showOpenDialog = (acceptExts = '', callback) => {
    if (typeof acceptExts === 'function') {
        callback = acceptExts;
        acceptExts = '';
    }

    if (typeof acceptExts === 'object') {
        const options = acceptExts;
        const extentions = [];
        if (options && options.filters) {
            options.filters.forEach(filter => {
                if (filter.extensions) {
                    filter.extensions.forEach(ext => {
                        if (ext && ext !== '*') {
                            extentions.push(`.${ext}`);
                        }
                    });
                }
            });
        }
        acceptExts = extentions.join(',');
    }

    fileButton.accept = acceptExts;
    fileButton.onchange = () => {
        const {files} = fileButton;
        if (files.length) {
            callback(files);
            setTimeout(() => {
                fileButton.onchange = null;
                fileButton.value = '';
            }, 500);
        } else {
            callback(false);
        }
    };
    fileButton.click();
};

export default {
    showOpenDialog
};
