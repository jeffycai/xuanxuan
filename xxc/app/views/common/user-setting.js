import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Config from '../../config';
import {classes} from '../../utils/html-helper';
import {formatKeyDecoration} from '../../utils/shortcut';
import HotkeyInputControl from '../../components/hotkey-input-control';
import Lang from '../../core/lang';
import Checkbox from '../../components/checkbox';
import SelectBox from '../../components/select-box';
import timeSequence from '../../utils/time-sequence';
import platform from '../../platform';

/**
 * 当前平台是否是浏览器
 * @type {boolean}
 * @private
 */
const isBrowser = platform.isType('browser');

/**
 * 判断是否已关闭通知功能
 * @param {Object} state React 状态对象
 * @return {boolean} 如果是 `true` 则为已关闭通知功能
 * @private
 */
const isNotificationOff = state => {
    return !state['ui.notify.enableSound'];
};

/**
 * 判断是否已关闭通知栏图标闪烁功能
 * @param {Object} state React 状态对象
 * @return {boolean} 如果是 `true` 则为已关闭通知栏图标闪烁功能
 * @private
 */
const isFlashTrayIconOff = state => {
    return isBrowser || !state['ui.notify.flashTrayIcon'];
};

/**
 * 判断是否已关闭桌面通知功能
 * @param {Object} state React 状态对象
 * @return {boolean} 如果是 `true` 则为已关闭桌面通知功能
 * @private
 */
const isWindowNotificationOff = state => {
    return !state['ui.notify.enableWindowNotification'];
};

/**
 * UserSetting 组件 ，显示个人设置界面
 * @class UserSetting
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import UserSetting from './user-setting';
 * <UserSetting />
 */
export default class UserSetting extends Component {
    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof UserSetting
     * @type {Object}
     */
    static propTypes = {
        settings: PropTypes.object.isRequired,
        className: PropTypes.string,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof UserSetting
     * @static
     */
    static defaultProps = {
        className: null,
    };

    /**
     * React 组件构造函数，创建一个 UserSetting 组件实例，会在装配之前被调用。
     * @see https://react.docschina.org/docs/react-component.html#constructor
     * @param {Object?} props 组件属性对象
     * @constructor
     */
    constructor(props) {
        super(props);

        /**
         * React 组件状态对象
         * @see https://react.docschina.org/docs/state-and-lifecycle.html
         * @type {object}
         */
        this.state = Object.assign({}, this.props.settings);
    }

    /**
     * 获取当前设置的个人配置对象
     *
     * @return {Object} 个人配置对象
     * @memberof UserSetting
     */
    getSettings() {
        return this.state;
    }

    /**
     * 设置当前设置的个人配置对象
     *
     * @param {Object} settings 个人配置对象
     * @memberof UserSetting
     * @return {void}
     */
    setSettings(settings) {
        this.setState(Object.assign({}, settings));
    }

    /**
     * 修改个人配置
     *
     * @param {Object|{name: string}} item 配置项对象
     * @param {any} value 配置项值
     * @memberof UserSetting
     * @return {void}
     */
    changeConfig(item, value) {
        const {name} = item;
        if (typeof value === 'object' && value.target) {
            if (value.target.type === 'checkbox') {
                value = value.target.checked;
            } else {
                value = value.target.value;
            }
        }
        if (item.setConverter) {
            value = item.setConverter(value);
        }
        this.setState({[name]: value});
    }

    /**
     * 渲染普通配置项
     *
     * @param {Object} item 配置项对象
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     * @memberof UserSetting
     */
    renderConfigItem(item) {
        if (item.hidden) {
            let hidden = item.hidden;
            if (typeof item.hidden === 'function') {
                hidden = item.hidden(this.state);
            }
            if (hidden) {
                return null;
            }
        }
        switch (item.type) {
        case 'boolean':
            return this.renderBooleanItem(item);
        case 'select':
            return this.renderSelectItem(item);
        case 'hotkey':
            return this.renderHotkeyItem(item);
        }
        return null;
    }

    /**
     * 渲染快捷键配置项
     *
     * @param {Object} item 配置项对象
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     * @memberof UserSetting
     */
    renderHotkeyItem(item) {
        let value = this.state[item.name];
        if (item.getConverter) {
            value = item.getConverter(value);
        }
        return <HotkeyInputControl onlyMotifyKeysText={Lang.string('setting.hotkeys.cantSetOnlyMotifyKeys')} key={item.name} defaultValue={value} labelStyle={{flex: 1}} onChange={this.changeConfig.bind(this, item)} label={item.caption} className={classes('flex', item.className)} />;
    }

    /**
     * 渲染选择框配置项
     *
     * @param {Object} item 配置项对象
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     * @memberof UserSetting
     */
    renderSelectItem(item) {
        let value = this.state[item.name];
        if (item.getConverter) {
            value = item.getConverter(value);
        }
        const controlId = `selectbox-${timeSequence()}`;
        return (<div className={classes('control flex', item.className)} key={item.name}>
            <label htmlFor={controlId} style={{flex: '1 1 0%'}}>{item.caption}</label>
            <SelectBox selectProps={{id: controlId}} value={value} options={item.options} onChange={this.changeConfig.bind(this, item)} selectClassName="rounded" />
        </div>);
    }

    /**
     * 渲染布尔值配置项
     *
     * @param {Object} item 配置项对象
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     * @memberof UserSetting
     */
    renderBooleanItem(item) {
        let value = this.state[item.name];
        if (item.getConverter) {
            value = item.getConverter(value);
        }
        const checked = !!value;
        return (<div className={classes('control', item.className)} key={item.name}>
            <Checkbox checked={checked} label={item.caption} onChange={this.changeConfig.bind(this, item)} />
        </div>);
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof UserSetting
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            settings,
            className,
            ...other
        } = this.props;

        /**
         * 个人配置界面列表项清单
         * @type {Map[]}
         * @private
         */
        const configs = [
            {
                name: 'chats',
                title: Lang.string('setting.section.chats'),
                items: [
                    {
                        type: 'boolean',
                        name: 'ui.chat.sendHDEmoticon',
                        caption: Lang.string('setting.chats.sendHDEmoticon')
                    }, {
                        type: 'boolean',
                        name: 'ui.chat.showMessageTip',
                        caption: Lang.string('setting.chats.showMessageTip')
                    }, {
                        type: 'boolean',
                        name: 'ui.chat.enableSearchInEmojionePicker',
                        caption: Lang.string('setting.chats.enableSearchInEmojionePicker')
                    }, {
                        type: 'boolean',
                        name: 'ui.chat.enableAnimate',
                        caption: Lang.string('setting.chats.enableAnimate'),
                        hidden: 'TODO: chats animate is not ready in current version.'
                    }, {
                        type: 'boolean',
                        name: 'ui.chat.listenClipboardImage',
                        caption: Lang.string('setting.chats.listenClipboardImage'),
                        hidden: isBrowser
                    }
                ]
            }, {
                name: 'notification',
                title: Lang.string('setting.section.notification'),
                items: [
                    {
                        type: 'boolean',
                        name: 'ui.notify.enableSound',
                        caption: Lang.string('setting.notification.enableSoundNotification')
                    }, {
                        type: 'select',
                        name: 'ui.notify.playSoundCondition',
                        className: 'level-2',
                        options: [
                            {value: '', label: Lang.string('setting.notification.onNeed')},
                            {value: 'onWindowBlur', label: Lang.string('setting.notification.onWindowBlur')},
                            {value: 'onWindowHide', label: Lang.string('setting.notification.onWindowHide')},
                        ],
                        hidden: isNotificationOff,
                        caption: Lang.string('setting.notification.playSoundCondition')
                    }, {
                        type: 'boolean',
                        className: 'level-2',
                        name: 'ui.notify.muteOnUserIsBusy',
                        hidden: isNotificationOff,
                        caption: Lang.string('setting.notification.muteOnUserIsBusy')
                    }, {
                        type: 'boolean',
                        name: 'ui.notify.flashTrayIcon',
                        hidden: isBrowser,
                        caption: Lang.string('setting.notification.flashTrayIcon')
                    }, {
                        type: 'select',
                        name: 'ui.notify.flashTrayIconCondition',
                        className: 'level-2',
                        options: [
                            {value: '', label: Lang.string('setting.notification.onNeed')},
                            {value: 'onWindowBlur', label: Lang.string('setting.notification.onWindowBlur')},
                            {value: 'onWindowHide', label: Lang.string('setting.notification.onWindowHide')},
                        ],
                        hidden: isFlashTrayIconOff,
                        caption: Lang.string('setting.notification.flashTrayIconCondition')
                    }, {
                        type: 'boolean',
                        name: 'ui.notify.enableWindowNotification',
                        caption: Lang.string('setting.notification.enableWindowNotification')
                    }, {
                        type: 'select',
                        name: 'ui.notify.windowNotificationCondition',
                        className: 'level-2',
                        options: [
                            {value: 'onWindowBlur', label: Lang.string('setting.notification.onWindowBlur')},
                            isBrowser ? null : {value: 'onWindowHide', label: Lang.string('setting.notification.onWindowHide')},
                        ],
                        hidden: isWindowNotificationOff,
                        caption: Lang.string('setting.notification.windowNotificationCondition')
                    }, {
                        type: 'boolean',
                        className: 'level-2',
                        hidden: isWindowNotificationOff,
                        name: 'ui.notify.safeWindowNotification',
                        caption: Lang.string('setting.notification.safeWindowNotificationTip')
                    }
                ]
            }, {
                name: 'navigation',
                title: Lang.string('setting.section.navigation'),
                items: [
                    {
                        type: 'boolean',
                        name: 'ui.navbar.avatarPosition',
                        caption: Lang.string('setting.navigation.showAvatarOnBottom'),
                        getConverter: value => {
                            return value === 'bottom';
                        },
                        setConverter: value => {
                            return value ? 'bottom' : 'top';
                        },
                    }
                ]
            }, {
                name: 'windows',
                hidden: isBrowser,
                title: Lang.string('setting.section.windows'),
                items: [
                    {
                        type: 'boolean',
                        name: 'ui.app.hideWindowOnBlur',
                        caption: Lang.string('setting.windows.hideWindowOnBlur')
                    }, {
                        type: 'boolean',
                        name: 'ui.app.removeFromTaskbarOnHide',
                        caption: Lang.string('setting.windows.removeFromTaskbarOnHide')
                    }, {
                        type: 'select',
                        name: 'ui.app.onClose',
                        hidden: !platform.has('ui.showQuitConfirmDialog'),
                        options: [
                            {value: 'ask', label: Lang.string('setting.windows.askEveryTime')},
                            {value: 'minimize', label: Lang.string('setting.windows.minimizeMainWindow')},
                            {value: 'close', label: Lang.string('setting.windows.quitApp')},
                        ],
                        caption: Lang.string('setting.windows.onClickCloseButton')
                    }
                ]
            }, {
                name: 'hotkeys',
                hidden: isBrowser,
                title: Lang.string('setting.section.hotkeys'),
                items: [
                    {
                        type: 'select',
                        name: 'shortcut.sendMessage',
                        options: Config.ui['hotkey.sendMessageOptions'].map(formatKeyDecoration),
                        caption: Lang.string('setting.hotkeys.sendMessage')
                    }, {
                        hidden: isBrowser,
                        type: 'hotkey',
                        name: 'shortcut.captureScreen',
                        caption: Lang.string('setting.hotkeys.globalCaptureScreen')
                    }, {
                        type: 'hotkey',
                        hidden: isBrowser,
                        name: 'shortcut.focusWindow',
                        caption: Lang.string('setting.hotkeys.globalFocusWindow')
                    }
                ]
            }
        ];

        return (<div
            {...other}
            className={classes('app-user-setting space', className)}
        >
            {
                configs.map(section => {
                    if (section.hidden) {
                        return null;
                    }
                    return (<section key={section.name} className={`space app-setting-group-${section.name}`}>
                        <header className="heading divider space-sm">
                            <strong className="title text-gray">{section.title}</strong>
                        </header>
                        <div className="items">
                            {
                                section.items.map(item => {
                                    return this.renderConfigItem(item);
                                })
                            }
                        </div>
                    </section>);
                })
            }
        </div>);
    }
}
