/**
 * 入口文件：index.js
 * 这是 Electron 渲染进程启动的主窗口入口文件
 */

import React from 'react';
import ReactDOM from 'react-dom';
import './style/app.less';
import './utils/debug';
import './utils/react-debug';
import _HomeIndex from './views/index';
import {ready} from './core/runtime';
import {triggerReady} from './core/ui';
import withReplaceView from './views/with-replace-view';
import registerDialogCommands from './views/register-dialogs-commands';

/**
 * HomeIndex 可替换组件形式
 * @type {Class<HomeIndex>}
 * @private
 */
const HomeIndex = withReplaceView(_HomeIndex);

document.body.classList.add('no-animation');

// 喧喧运行时管理程序就绪时加载 React 界面组件
ready(() => {
    const appElement = document.getElementById('appContainer');
    ReactDOM.render(<HomeIndex />, appElement, () => {
        const loadingElement = document.getElementById('loading');
        loadingElement.parentNode.removeChild(loadingElement);

        setTimeout(() => {
            document.body.classList.remove('no-animation');
        }, 2000);

        // 注册对话框命令
        registerDialogCommands();

        // 触发界面就绪事件
        triggerReady();
    });
});
