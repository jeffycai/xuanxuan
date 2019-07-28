// 从全局扩展对象中引入模块
const {
    utils,
} = global.Xext;

const {Store} = utils;
const STORE_KEY = 'Extension::simple-desktop.image';

const onDocumentReady = fn => {
    // if (document.attachEvent ? document.readyState === 'complete' : document.readyState !== 'loading') {
    if (document.head) {
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
};

const setImage = image => {
    const css = `
#appContainer > .affix:before {content: ' '; position: absolute; top:0; bottom: 0; left: -100%; right: 100%; background-image: url('${image}'); background-size: cover; background-position: center; transition: filter 1s 1s, top 1s, right 1s, bottom: 1s;}
#appContainer > .affix[style*='transform: translateX(0px)']:before {bottom: -40px; top: -40px; left: -40px; right: -40px; filter: blur(10px)}
.app-chat-sidebar .tabs > .nav,
.app-login {background: none!important;}
.app-login > section > header > img {filter: drop-shadow(0 0 6px rgba(0,0,0,.65));}
.app-login > .dock-right.small {padding: 8px 12px!important; background: rgba(0,0,0,0.4); text-shadow: 0 0 2px rgba(0,0,0,.9);}
.app-navbar {background: rgba(0,0,0,.2)!important;}
.app-navbar a.active:after {background: rgba(255,255,255,.25);}
.app-chat-sendbox-toolbar,
.app-chats-menu {background: rgba(255,255,255,.7)!important;}
.app-chat-sidebar,
.app-chat-header {background: rgba(255,255,255,.75)!important}
.app-chat-header > .toolbar {background: none!important;}
.Resizer {background: rgba(100,100,100,.3)!important;}
.control.search > .input,
.app-chats-menu-list .item.active,
.app-chat-messages {background: rgba(255,255,255,.8)!important}
.app-message-divider > .content {background: none!important; text-shadow: 0 0 2px rgba(255,255,255,.7);}
.app-exts-nav {background: rgba(255,255,255,.5)!important}
.box,
.white {background: rgba(255,255,255,.8)}
`;

    let styleElement = document.getElementById('simpleDesktopStyle');
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'simpleDesktopStyle';
        styleElement.type = 'text/css';
        document.head.appendChild(styleElement);
    }
    if (styleElement.styleSheet) {
        styleElement.styleSheet.cssText = css;
    } else {
        styleElement.innerHTML = '';
        styleElement.appendChild(document.createTextNode(css));
    }
};

module.exports = {
    onAttach: ext => {
        onDocumentReady(() => {
            setImage('https://api.spencerwoo.com');
        });
    },
    onDetach: ext => {
        const styleElement = document.getElementById('simpleDesktopStyle');
        if (styleElement) {
            styleElement.remove();
            console.log('Extension detached.');
        }
    }
};
