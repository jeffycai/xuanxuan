import md5 from 'md5';
import Config from '../../config';
import DEFAULT from './user-default-config';
import DelayAction from '../../utils/delay-action';
import timeSequence from '../../utils/time-sequence';

/**
 * 用户配置管理类
 *
 * @export
 * @class UserConfig
 */
export default class UserConfig {
    /**
     * 用户默认配置
     *
     * @static
     * @memberof UserConfig
     * @type {Object<string, any>}
     */
    static DEFAULT = DEFAULT;

    /**
     * 创建一个用户配置管理类实例`
     * @param {Object<string, any>} config 用户配置数据对象
     * @memberof UserConfig
     */
    constructor(config) {
        if (config && config.version !== DEFAULT.version) {
            config = null;
        }
        this.$ = Object.assign({}, DEFAULT, Config.system.defaultConfig, config);

        this.changeAction = new DelayAction(() => {
            this.onChange(this.lastChange, this);
            this.lastChange = null;
        });

        const {groupsCategories} = this;
        Object.keys(groupsCategories).forEach(x => {
            const category = groupsCategories[x];
            if (category.order > 1000000000000) {
                if (x.startsWith('_')) {
                    category.order = 100000000000 + timeSequence();
                } else {
                    category.order = timeSequence();
                }
            }
        });
        return this.set('ui.chat.groups.categories', groupsCategories, true);
    }

    /**
     * 获取配置数据存储对象
     *
     * @return {Object<string, any>}
     * @memberof UserConfig
     */
    plain() {
        return Object.assign({}, this.$);
    }

    /**
     * 导出用于上传到服务器的数据存储对象
     *
     * @return {Object<string, any>}
     * @memberof UserConfig
     */
    exportCloud() {
        const config = {};
        Object.keys(this.$).forEach(key => {
            if (key.indexOf('local.') !== 0) {
                config[key] = this.$[key];
            }
        });
        config.hash = md5(JSON.stringify(config));
        this.hash = config.hash;
        return config;
    }

    /**
     * 将用户配置标记已变更
     *
     * @param {Object<string, any>} change 要变更的数据
     * @param {boolean} [reset=false] 是否标记为全部重置
     * @return {void}
     * @memberof UserConfig
     */
    makeChange(change, reset = false) {
        this.lastChange = Object.assign({}, this.lastChange, change);
        this.$.lastChangeTime = new Date().getTime();
        if (!reset) {
            this.needSave = this.$.lastChangeTime;
        }
        if (typeof this.onChange === 'function') {
            this.changeAction.do();
        }
    }

    /**
     * 将用户配置数据标记为需要存储
     *
     * @memberof UserConfig
     * @return {void}
     */
    makeSave() {
        this.needSave = false;
    }

    /**
     * 获取指定名称的用户配置项值
     *
     * @param {string} key 配置名称
     * @param {?any} defaultValue 默认值
     * @return {any}
     * @memberof UserConfig
     */
    get(key, defaultValue) {
        if (this.$) {
            const val = this.$[key];
            if (val !== undefined) {
                return val;
            }
        }
        if (defaultValue === undefined) {
            defaultValue = DEFAULT[key];
        }
        return defaultValue;
    }

    /**
     * 设置配置项的值
     *
     * @param {string|Object<string, any>} keyOrObj 如果为字符串则为要设置的配置项名称，如果为对象则将对象键值对作为要设置的配置项
     * @param {?any} value 当 {keyOrObj} 为字符串时要设置的配置项的值
     * @param {boolean} [reset=false] 是否标记为全部重置
     * @return {void}
     * @memberof UserConfig
     */
    set(keyOrObj, value, reset = false) {
        if (typeof keyOrObj === 'object') {
            Object.assign(this.$, keyOrObj);
            this.makeChange(keyOrObj, reset);
        } else {
            this.$[keyOrObj] = value;
            this.makeChange({[keyOrObj]: value}, reset);
        }
    }

    /**
     * 获取扩展的配置项
     *
     * @param {!string} extensionName 扩展名称
     * @param {?string} key 配置项名称，如果不给定名称，则以对象的形式返回所有配置项
     * @param {?any} defaultValue 配置项的默认值
     * @return {any}
     * @memberof UserConfig
     */
    getForExtension(extensionName, key, defaultValue) {
        if (typeof extensionName === 'object' && extensionName.name) {
            extensionName = extensionName.name;
        }
        const extensionConfig = this.get(`EXTENSION::${extensionName}`, {});
        const value = key !== undefined ? extensionConfig[key] : extensionConfig;
        return value !== undefined ? value : defaultValue;
    }

    /**
     * 设置扩展的配置项值
     *
     * @param {!string} extensionName 扩展名称
     * @param {?string} keyOrObj 如果为字符串则为要设置的配置项名称，如果为对象则将对象键值对作为要设置的配置
     * @param {?any} value 当 {keyOrObj} 为字符串时要设置的配置项的值
     * @return {void}
     * @memberof UserConfig
     */
    setForExtension(extensionName, keyOrObj, value) {
        const extensionConfig = this.getForExtension(extensionName);
        if (typeof keyOrObj === 'object') {
            Object.assign(extensionConfig, keyOrObj);
        } else {
            extensionConfig[keyOrObj] = value;
        }
        return this.set(`EXTENSION::${extensionName}`, extensionConfig);
    }

    /**
     * 将用户所有配置项重置为给定的配置
     *
     * @param {?Object<string, any>} newConfig 要重置的配置项对象，如果留空，则将配置项重置为默认
     * @return {void}
     * @memberof UserConfig
     */
    reset(newConfig) {
        this.$ = Object.assign({}, DEFAULT, newConfig);
        this.makeChange(this.$, true);
    }

    /**
     * 获取上次配置发生变更的时间戳
     *
     * @type {number}
     * @readonly
     * @memberof UserConfig
     */
    get lastChangeTime() {
        return this.$.lastChangeTime;
    }

    /**
     * 获取是否自动重连
     *
     * @memberof UserConfig
     * @type {boolean}
     */
    get autoReconnect() {
        return this.get('user.autoReconnect');
    }

    /**
     * 设置是否自动重连
     *
     * @param {boolean} flag 是否自动重连
     * @memberof UserConfig
     */
    set autoReconnect(flag) {
        return this.set('user.autoReconnect', flag);
    }

    /**
     * 获取用户头像在导航上显示的位置
     *
     * @memberof UserConfig
     * @type {string}
     */
    get avatarPosition() {
        return this.get('ui.navbar.avatarPosition');
    }

    /**
     * 设置用户头像在导航上显示的位置
     *
     * @param {string} position 用户头像在导航上显示的位置
     * @memberof UserConfig
     */
    set avatarPosition(position) {
        return this.set('ui.navbar.avatarPosition', position);
    }

    /**
     * 获取上次保存配置的时间戳
     *
     * @memberof UserConfig
     * @type {number}
     */
    get lastSaveTime() {
        return this.get('lastSaveTime');
    }

    /**
     * 设置上次保存配置的时间戳
     *
     * @param {number} time 上次保存配置的时间戳
     * @memberof UserConfig
     */
    set lastSaveTime(time) {
        if (time instanceof Date) {
            time = time.getTime();
        }
        return this.set('lastSaveTime', time);
    }

    /**
     * 获取是否显示发送消息提示面板
     *
     * @memberof UserConfig
     * @type {boolean}
     */
    get showMessageTip() {
        return this.get('ui.chat.showMessageTip');
    }

    /**
     * 设置是否显示发送消息提示面板
     *
     * @param {boolean} flag 是否显示发送消息提示面板
     * @memberof UserConfig
     */
    set showMessageTip(flag) {
        return this.set('ui.chat.showMessageTip', flag);
    }

    /**
     * 获取是否直接发送高清表情
     *
     * @memberof UserConfig
     * @type {boolean}
     */
    get sendHDEmoticon() {
        return this.get('ui.chat.sendHDEmoticon');
    }

    /**
     * 设置是否直接发送高清表情
     *
     * @param {boolean} flag 是否直接发送高清表情
     * @memberof UserConfig
     */
    set sendHDEmoticon(flag) {
        return this.set('ui.chat.sendHDEmoticon', flag);
    }

    /**
     * 获取是否将消息以 Markdown 格式发送
     *
     * @memberof UserConfig
     * @type {boolean}
     */
    get sendMarkdown() {
        return Config.ui['chat.sendMarkdown'] && this.get('ui.chat.sendMarkdown');
    }

    /**
     * 设置是否将消息以 Markdown 格式发送
     *
     * @param {boolean} flag 将消息以 Markdown 格式发送
     * @memberof UserConfig
     */
    set sendMarkdown(flag) {
        if (Config.ui['chat.sendMarkdown']) {
            return this.set('ui.chat.sendMarkdown', flag);
        }
    }

    /**
     * 判断给定当聊天是否隐藏聊天侧边栏
     *
     * @param {string} cgid 聊天 GID
     * @param {boolean} [defaultValue=false] 默认值
     * @return {boolean}
     * @memberof UserConfig
     */
    isChatSidebarHidden(cgid, defaultValue = false) {
        return !!this.get(`ui.chat.hideSidebar.${cgid}`, defaultValue);
    }

    /**
     * 设置给定当聊天是否隐藏聊天侧边栏
     *
     * @param {string} cgid 聊天 GID
     * @param {boolean} flag 是否隐藏
     * @return {void}
     * @memberof UserConfig
     */
    setChatSidebarHidden(cgid, flag) {
        return this.set(`ui.chat.hideSidebar.${cgid}`, flag);
    }

    /**
     * 获取是否在联系人列表上显示自己
     *
     * @memberof UserConfig
     * @type {boolean}
     */
    get showMeOnMenu() {
        return !!this.get('ui.chat.menu.showMe');
    }

    /**
     * 设置是否在联系人列表上显示自己
     *
     * @param {boolean} flag 在联系人列表上显示自己
     * @memberof UserConfig
     */
    set showMeOnMenu(flag) {
        return this.set('ui.chat.menu.showMe', flag);
    }

    /**
     * 获取是否在表情选择面板上启用搜索功能
     *
     * @memberof UserConfig
     * @type {boolean}
     */
    get enableSearchInEmojionePicker() {
        return this.get('ui.chat.enableSearchInEmojionePicker');
    }

    /**
     * 设置是否在表情选择面板上启用搜索功能
     *
     * @param {boolean} flag 在表情选择面板上启用搜索功能
     * @memberof UserConfig
     */
    set enableSearchInEmojionePicker(flag) {
        return this.set('ui.chat.enableSearchInEmojionePicker', flag);
    }

    /**
     * 获取是否启用桌面通知
     *
     * @memberof UserConfig
     * @type {boolean}
     */
    get enableWindowNotification() {
        return this.get('ui.notify.enableWindowNotification');
    }

    /**
     * 设置是否启用桌面通知
     *
     * @param {boolean} flag 启用桌面通知
     * @memberof UserConfig
     */
    set enableWindowNotification(flag) {
        return this.set('ui.notify.enableWindowNotification', flag);
    }

    /**
     * 获取是否不在弹窗上显示消息具体内容
     *
     * @memberof UserConfig
     * @type {boolean}
     */
    get safeWindowNotification() {
        return this.get('ui.notify.safeWindowNotification');
    }

    /**
     * 设置是否不在弹窗上显示消息具体内容
     *
     * @param {boolean} flag 不在弹窗上显示消息具体内容
     * @memberof UserConfig
     */
    set safeWindowNotification(flag) {
        return this.set('ui.notify.safeWindowNotification', flag);
    }

    /**
     * 获取桌面通知显示的时机
     *
     * @memberof UserConfig
     * @type {string}
     */
    get windowNotificationCondition() {
        return this.get('ui.notify.windowNotificationCondition');
    }

    /**
     * 设置桌面通知显示的时机
     *
     * @param {string} condition 桌面通知显示的时机
     * @memberof UserConfig
     */
    set windowNotificationCondition(condition) {
        return this.set('ui.notify.windowNotificationCondition', condition);
    }

    /**
     * 获取是否启用声音通知
     *
     * @memberof UserConfig
     * @type {boolean}
     */
    get enableSound() {
        return this.get('ui.notify.enableSound');
    }

    /**
     * 设置是否启用声音通知
     *
     * @param {boolean} flag 启用声音通知
     * @memberof UserConfig
     */
    set enableSound(flag) {
        return this.set('ui.notify.enableSound', flag);
    }

    /**
     * 获取声音通知显示的时机
     *
     * @memberof UserConfig
     * @type {string}
     */
    get playSoundCondition() {
        return this.get('ui.notify.playSoundCondition');
    }

    /**
     * 设置声音通知显示的时机
     *
     * @param {string} condition 声音通知显示的时机
     * @memberof UserConfig
     */
    set playSoundCondition(condition) {
        return this.set('ui.notify.playSoundCondition', condition);
    }

    /**
     * 获取是否闪烁通知栏图标
     *
     * @memberof UserConfig
     * @type {boolean}
     */
    get flashTrayIcon() {
        return this.get('ui.notify.flashTrayIcon');
    }

    /**
     * 设置是否闪烁通知栏图标
     *
     * @param {boolean} flag 闪烁通知栏图标
     * @memberof UserConfig
     */
    set flashTrayIcon(flag) {
        return this.set('ui.notify.flashTrayIcon', flag);
    }

    /**
     * 获取闪烁通知栏图标通知显示的时机
     *
     * @memberof UserConfig
     * @type {string}
     */
    get flashTrayIconCondition() {
        return this.get('ui.notify.flashTrayIconCondition');
    }

    /**
     * 设置闪烁通知栏图标通知显示的时机
     *
     * @param {string} condition 闪烁通知栏图标通知显示的时机
     * @memberof UserConfig
     */
    set flashTrayIconCondition(condition) {
        return this.set('ui.notify.flashTrayIconCondition', condition);
    }

    /**
     * 获取是否禁用通知当用户状态设置为忙碌时
     *
     * @memberof UserConfig
     * @type {boolean}
     */
    get muteOnUserIsBusy() {
        return this.get('ui.notify.muteOnUserIsBusy');
    }

    /**
     * 设置是否禁用通知当用户状态设置为忙碌时
     *
     * @param {boolean} flag 禁用通知当用户状态设置为忙碌时
     * @memberof UserConfig
     */
    set muteOnUserIsBusy(flag) {
        return this.set('ui.notify.muteOnUserIsBusy', flag);
    }

    /**
     * 获取截屏快捷键
     *
     * @memberof UserConfig
     * @type {string}
     */
    get captureScreenHotkey() {
        return this.get('shortcut.captureScreen');
    }

    /**
     * 设置截屏快捷键
     *
     * @param {string} shortcut 截屏快捷键
     * @memberof UserConfig
     */
    set captureScreenHotkey(shortcut) {
        return this.set('shortcut.captureScreen', shortcut);
    }

    /**
     * 获取激活主窗口快捷键
     *
     * @memberof UserConfig
     * @type {string}
     */
    get focusWindowHotkey() {
        return this.get('shortcut.focusWindow');
    }

    /**
     * 设置激活主窗口快捷键
     *
     * @param {string} shortcut 激活主窗口快捷键
     * @memberof UserConfig
     */
    set focusWindowHotkey(shortcut) {
        return this.set('shortcut.focusWindow', shortcut);
    }

    /**
     * 获取全局快捷键配置
     *
     * @readonly
     * @memberof UserConfig
     * @type {Object<string, string>}
     */
    get globalHotkeys() {
        return {
            captureScreenHotkey: this.captureScreenHotkey,
            focusWindowHotkey: this.focusWindowHotkey
        };
    }

    /**
     * 获取发送消息快捷键
     *
     * @memberof UserConfig
     * @type {string}
     */
    get sendMessageHotkey() {
        return this.get('shortcut.sendMessage');
    }

    /**
     * 设置发送消息快捷键
     *
     * @param {string} shortcut 发送消息快捷键
     * @memberof UserConfig
     */
    set sendMessageHotkey(shortcut) {
        return this.set('shortcut.sendMessage', shortcut);
    }

    /**
     * 获取聊天消息字体大小配置
     *
     * @memberof UserConfig
     * @type {Object<string, any>}
     */
    get chatFontSize() {
        return this.get('ui.chat.fontSize');
    }

    /**
     * 设置聊天消息字体大小配置
     *
     * @param {Object<string, any>} fontSize 聊天消息字体大小配置
     * @memberof UserConfig
     */
    set chatFontSize(fontSize) {
        return this.set('ui.chat.fontSize', fontSize);
    }

    /**
     * 获取应用关闭时的策略选项
     *
     * @memberof UserConfig
     * @type {string}
     */
    get appCloseOption() {
        return this.get('ui.app.onClose');
    }

    /**
     * 设置应用关闭时的策略选项
     *
     * @param {string} option 应用关闭时的策略选项
     * @memberof UserConfig
     */
    set appCloseOption(option) {
        return this.set('ui.app.onClose', option);
    }

    /**
     * 获取是否当窗口关闭时从任务栏移除
     *
     * @memberof UserConfig
     * @type {boolean}
     */
    get removeFromTaskbarOnHide() {
        return this.get('ui.app.removeFromTaskbarOnHide');
    }

    /**
     * 设置是否当窗口关闭时从任务栏移除
     *
     * @param {boolean} flag 当窗口关闭时从任务栏移除
     * @memberof UserConfig
     */
    set removeFromTaskbarOnHide(flag) {
        return this.set('ui.app.removeFromTaskbarOnHide', flag);
    }

    /**
     * 获取是否当应用窗口失去焦点时隐藏窗口
     *
     * @memberof UserConfig
     * @type {boolean}
     */
    get hideWindowOnBlur() {
        return this.get('ui.app.hideWindowOnBlur');
    }

    /**
     * 设置是否当应用窗口失去焦点时隐藏窗口
     *
     * @param {boolean} flag 当应用窗口失去焦点时隐藏窗口
     * @memberof UserConfig
     */
    set hideWindowOnBlur(flag) {
        return this.set('ui.app.hideWindowOnBlur', flag);
    }

    /**
     * 获取联系人分组显示方式
     *
     * @memberof UserConfig
     * @type {string}
     */
    get contactsGroupByType() {
        return this.get('ui.chat.contacts.groupBy');
    }

    /**
     * 设置联系人分组显示方式
     *
     * @param {string} type 联系人分组显示方式
     * @memberof UserConfig
     */
    set contactsGroupByType(type) {
        return this.set('ui.chat.contacts.groupBy', type);
    }

    /**
     * 获取联系人列表以角色分组时的排序设置
     *
     * @memberof UserConfig
     * @type {Object}
     */
    get contactsOrderRole() {
        return this.get('ui.chat.contacts.order.role', {});
    }

    /**
     * 设置联系人列表以角色分组时的排序设置
     *
     * @param {Object} orders 联系人列表以角色分组时的排序设置
     * @memberof UserConfig
     */
    set contactsOrderRole(orders) {
        return this.set('ui.chat.contacts.order.role', orders);
    }

    /**
     * 获取联系人自定义分组数据
     *
     * @memberof UserConfig
     * @type {Object}
     */
    get contactsCategories() {
        return this.get('ui.chat.contacts.categories', {});
    }

    /**
     * 设置联系人自定义分组数据
     *
     * @param {Object} orders 联系人自定义分组数据
     * @memberof UserConfig
     */
    set contactsCategories(orders) {
        return this.set('ui.chat.contacts.categories', orders);
    }

    /**
     * 获取联系人列表以部门分组时的排序设置
     *
     * @memberof UserConfig
     * @type {Object}
     */
    get contactsOrderDept() {
        return this.get('ui.chat.contacts.order.dept', {});
    }

    /**
     * 设置联系人列表以部门分组时的排序设置
     *
     * @param {Object} orders 联系人列表以部门分组时的排序设置
     * @memberof UserConfig
     */
    set contactsOrderDept(orders) {
        return this.set('ui.chat.contacts.order.dept', orders);
    }

    /**
     * 获取联系人默认分组名称
     *
     * @memberof UserConfig
     * @type {string}
     */
    get contactsDefaultCategoryName() {
        return this.get('ui.chat.contacts.category.default');
    }

    /**
     * 设置联系人默认分组名称
     *
     * @param {string} name 联系人默认分组名称
     * @memberof UserConfig
     */
    set contactsDefaultCategoryName(name) {
        return this.set('ui.chat.contacts.category.default', name);
    }

    /**
     * 获取讨论组列表自定义分组配置
     *
     * @memberof UserConfig
     * @type {Object}
     */
    get groupsCategories() {
        return this.get('ui.chat.groups.categories', {});
    }

    /**
     * 设置讨论组列表自定义分组配置
     *
     * @param {Object} orders 讨论组列表自定义分组配置
     * @memberof UserConfig
     */
    set groupsCategories(orders) {
        return this.set('ui.chat.groups.categories', orders);
    }

    /**
     * 获取讨论组列表默认分组名称
     *
     * @memberof UserConfig
     * @type {string}
     */
    get groupsDefaultCategoryName() {
        return this.get('ui.chat.groups.category.default');
    }

    /**
     * 设置讨论组列表默认分组名称
     *
     * @param {string} name 讨论组列表默认分组名称
     * @memberof UserConfig
     */
    set groupsDefaultCategoryName(name) {
        return this.set('ui.chat.groups.category.default', name);
    }

    /**
     * 获取讨论组分组折叠展开状态
     *
     * @memberof UserConfig
     * @type {Object}
     */
    get chatGroupStates() {
        return this.get('ui.chat.list.group.states', {});
    }

    /**
     * 设置讨论组分组折叠展开状态
     *
     * @param {Object} states 讨论组分组折叠展开状态
     * @memberof UserConfig
     */
    set chatGroupStates(states) {
        return this.set('ui.chat.list.group.states', states);
    }

    /**
     * 获取是否监听剪切板图片并提示发送
     *
     * @memberof UserConfig
     * @type {boolean}
     */
    get listenClipboardImage() {
        return this.get('ui.chat.listenClipboardImage', true);
    }

    /**
     * 设置是否监听剪切板图片并提示发送
     *
     * @param {boolean} flag 监听剪切板图片并提示发送
     * @memberof UserConfig
     */
    set listenClipboardImage(flag) {
        return this.set('ui.chat.listenClipboardImage', flag);
    }

    /**
     * 设置讨论组分组折叠展开状态
     *
     * @param {string} listType 列表类型
     * @param {string} groupType 分组类型
     * @param {string} id 组编号
     * @param {boolean} expanded 是否展开
     * @memberof UserConfig
     * @return {void}
     */
    setChatMenuGroupState(listType, groupType, id, expanded) {
        const {chatGroupStates} = this;
        const key = `${listType}.${groupType}.${id}`;
        if (expanded) {
            chatGroupStates[key] = expanded;
        } else if (chatGroupStates[key]) {
            delete chatGroupStates[key];
        }
        this.chatGroupStates = chatGroupStates;
    }

    /**
     * 检查讨论组分组折叠展开状态
     *
     * @param {string} listType 列表类型
     * @param {string} groupType 分组类型
     * @param {string} id 组编号
     * @return {boolean}
     * @memberof UserConfig
     */
    getChatMenuGroupState(listType, groupType, id) {
        const {chatGroupStates} = this;
        return !!(chatGroupStates && chatGroupStates[`${listType}.${groupType}.${id}`]);
    }
}
