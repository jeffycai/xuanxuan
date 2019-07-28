import {showInputContextMenu, showSelectionContextMenu} from './contextmenu';

/**
 * 初始化 WebView 上的右键菜单
 * @param {WebView} webview WebView 实例
 * @return {void}
 */
export const initWebview = (webview) => {
    if (!webview || !webview.getWebContents) {
        return;
    }
    const webContents = webview.getWebContents();
    if (webContents) {
        webContents.on('context-menu', (e, props) => {
            const {selectionText, isEditable} = props;
            if (isEditable) {
                showInputContextMenu(e.clientX, e.clientY);
            } else if (selectionText && selectionText.trim() !== '') {
                showSelectionContextMenu(e.clientX, e.clientY);
            }
        });
    }
};

export default {
    initWebview,
};
