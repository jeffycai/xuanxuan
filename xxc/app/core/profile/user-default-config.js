/**
 * 默认用户个人配置
 * @type {Object<string, any>}
 * @property {number} [version=3] 配置版本
 * @property {number} [lastSaveTime=0] 上次配置保存的时间戳
 * @property {boolean} [ui.animate.enable=false] 是否在界面上启用动画效果
 * @property {string} [ui.navbar.width=50] 导航条宽度
 * @property {string} [ui.navbar.active='chat'] 导航上默认激活的项目
 * @property {string} [ui.navbar.avatarPosition='bottom'] 导航上个人头像显示的位置，可选值："bottom"，"top"
 * @property {boolean} [ui.navbar.onlyShowNoticeCountOnRecents=true] 是否仅仅在最近聊天上显示未读消息数目红点
 * @property {string} [ui.chat.menu.with=200] 聊天列表默认宽度
 * @property {boolean} [ui.chat.menu.showMe=true] 是否在联系人聊天列表上显示自己
 * @property {string} [ui.chat.sendbox.height=125] 发送框默认高度
 * @property {string} [ui.chat.sidebar.width=300] 聊天侧边栏默认宽度
 * @property {Object<string, any>} [ui.chat.fontSize={name: 13,time: '0.9230769231em',lineHeight: 1.53846153846,size: 13}] 聊天消息字体大小
 * @property {boolean} [ui.chat.sendHDEmoticon=true] 是否发送高清表情
 * @property {boolean} [ui.chat.showMessageTip=true] 是否在发送框上显示消息发送提示面板
 * @property {boolean} [ui.chat.sendMarkdown=false] 是否使用 Markdown 发送消息
 * @property {boolean} [ui.chat.enableSearchInEmojionePicker=false] 是否在表情选择面板上显示搜索框
 * @property {string} [ui.chat.contacts.groupBy='normal'] 联系人分组方式，可用值包括 'normal', 'role', 'dept'
 * @property {Object<string, any>} [ui.chat.contacts.order.role={}] 当联系人列表使用角色分组显示时分组排序配置
 * @property {Object<string, any>} [ui.chat.contacts.categories={}] 当联系人列表使用自定义分组显示时分组排序配置
 * @property {Object<string, any>} [ui.chat.contacts.order.dept={}] 当联系人列表使用部门分组显示时分组排序配置
 * @property {Object<string, any>} [ui.chat.menu.group.states={}] 聊天分组折叠展开状态配置
 * @property {string} [ui.chat.contacts.category.default=''] 联系人默认分组名称
 * @property {string} [ui.chat.groups.category.default=''] 讨论组默认分组名称
 * @property {Object<string, any>} [ui.chat.groups.categories={}] 讨论组列表分组配置
 * @property {boolean} [ui.chat.listenClipboardImage=false] 是否监听剪切板上的图片并提示直接发送
 * @property {boolean} [ui.notify.enableSound=true] 是否启用声音通知
 * @property {string} [ui.notify.playSoundCondition='onWindowHide'] 播放声音通知的时机，"onWindowHide" 或 "onWindowBlur"
 * @property {boolean} [ui.notify.muteOnUserIsBusy=true] 是否在用户忙碌时禁用通知
 * @property {boolean} [ui.notify.flashTrayIcon=true] 是否启用通知栏图标闪烁通知
 * @property {string} [ui.notify.flashTrayIconCondition='onWindowHide'] 通知栏图标闪烁通知时机，"onWindowHide" 或 "onWindowBlur"
 * @property {boolean} [ui.notify.enableWindowNotification=false] 是否启用系统桌面通知（弹窗）
 * @property {string} [ui.notify.windowNotificationCondition='onWindowBlur'] 系统桌面通知时机
 * @property {boolean} [ui.notify.safeWindowNotification=false] 是否不在桌面通知上显示消息具体内容
 * @property {boolean} [ui.app.hideWindowOnBlur=false] 是否隐藏主窗口当窗口失去焦点时
 * @property {boolean} [ui.app.removeFromTaskbarOnHide=true] 当窗口隐藏时是否从任务栏移除
 * @property {string} [ui.app.onClose='ask'] 点击关闭窗口按钮时的策略 "ask"、"close" 或 "minimize"
 * @property {string} [local.ui.app.lastFileSavePath=''] 用户上次手动保存文件的位置
 * @property {string} [shortcut.captureScreen='Ctrl+Alt+Z'] 截屏全局快捷键
 * @property {string} [shortcut.focusWindow='Ctrl+Alt+X'] 激活窗口全局快捷键
 * @property {string} [shortcut.sendMessage='Enter'] 发送消息快捷键
 * @property {string} [user.autoReconnect=true] 是否断线自动重连
 */
export default {
    version: 3,
    lastSaveTime: 0,
    'ui.animate.enable': false,
    'ui.navbar.width': 50,
    'ui.navbar.active': 'chat',
    'ui.navbar.avatarPosition': 'bottom',
    'ui.navbar.onlyShowNoticeCountOnRecents': true,
    'ui.chat.menu.with': 200,
    'ui.chat.menu.showMe': true,
    'ui.chat.sendbox.height': 125,
    'ui.chat.sidebar.width': 300,
    'ui.chat.fontSize': {
        name: 13,
        time: '0.9230769231em',
        lineHeight: 1.53846153846,
        size: 13
    },
    'ui.chat.sendHDEmoticon': true,
    'ui.chat.showMessageTip': true,
    'ui.chat.sendMarkdown': false,
    'ui.chat.enableSearchInEmojionePicker': false,
    'ui.chat.contacts.groupBy': 'normal', // 'normal', 'role', 'dept'
    'ui.chat.contacts.order.role': {},
    'ui.chat.contacts.categories': {},
    'ui.chat.contacts.order.dept': {},
    'ui.chat.menu.group.states': {},
    'ui.chat.contacts.category.default': '',
    'ui.chat.groups.category.default': '',
    'ui.chat.groups.categories': {},
    'ui.chat.listenClipboardImage': false,
    'ui.notify.enableSound': true,
    'ui.notify.playSoundCondition': 'onWindowHide', // or "onWindowBlur", "
    'ui.notify.muteOnUserIsBusy': true,
    'ui.notify.flashTrayIcon': true,
    'ui.notify.flashTrayIconCondition': '', // "onWindowBlur", ",
    'ui.notify.enableWindowNotification': false,
    'ui.notify.windowNotificationCondition': 'onWindowBlur',
    'ui.notify.safeWindowNotification': false,
    'ui.app.hideWindowOnBlur': false,
    'ui.app.removeFromTaskbarOnHide': true,
    'ui.app.onClose': 'ask', // or "close", "minimize"
    'local.ui.app.lastFileSavePath': '',
    'shortcut.captureScreen': 'Ctrl+Alt+Z',
    'shortcut.focusWindow': 'Ctrl+Alt+X',
    'shortcut.sendMessage': 'Enter',
    'user.autoReconnect': true
};
