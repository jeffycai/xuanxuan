// eslint-disable-next-line import/no-unresolved
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import Config from '../../config';
import InputControl from '../../components/input-control';
import Checkbox from '../../components/checkbox';
import Modal from '../../components/modal';
import Icon from '../../components/icon';
import Lang, {onLangChange} from '../../core/lang';
import {classes} from '../../utils/html-helper';
import {isNotEmptyString} from '../../utils/string-helper';
import App from '../../core';
import SwapUserDialog from './swap-user-dialog';
import Button from '../../components/button';
import User, {isPasswordWithMD5Flag} from '../../core/profile/user';
import platform from '../../platform';
import events from '../../core/events';

// 从平台访问对象获取模块功能
const {ui: platformUI} = platform.modules;

/**
 * 将服务器地址转换为简单形式
 * @param {string} serverUrl 服务器地址
 * @return {string} 服务器地址
 * @private
 */
const simpleServerUrl = serverUrl => {
    if (serverUrl) {
        if (!serverUrl.startsWith('http://') && !serverUrl.startsWith('https://')) {
            serverUrl = `https://${serverUrl}`;
        }
        try {
            const simpleServer = new URL(serverUrl);
            if (simpleServer.port === '11443') {
                serverUrl = serverUrl.replace(':11443', '');
            }
        } catch (e) {
            if (DEBUG) {
                console.error('Cannot parse url ', serverUrl, e);
            }
        }
    }
    return serverUrl;
};

/**
 * Form 组件 ，显示登录表单界面
 * @class Form
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example
 * import Form from './form';
 * <Form />
 */
export default class LoginForm extends PureComponent {
    /**
     * Form 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof Form
     */
    static replaceViewPath = 'login/LoginForm';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof LoginForm
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof LoginForm
     * @static
     */
    static defaultProps = {
        className: null,
    };

    /**
     * React 组件构造函数，创建一个 Form 组件实例，会在装配之前被调用。
     * @see https://react.docschina.org/docs/react-component.html#constructor
     * @param {Object?} props 组件属性对象
     * @constructor
     */
    constructor(props) {
        super(props);

        const lastSavedUser = App.profile.getLastSavedUser();
        const entryParams = Object.assign(App.ui.entryParams, Config.ui.defaultUser);
        const lockServerUrl = Config.ui.serverUrl;

        /**
         * 是否锁定了服务器地址（不提供更改服务器地址输入框）
         * @type {string}
         */
        this._lockServerUrl = lockServerUrl;

        /**
         * React 组件状态对象
         * @see https://react.docschina.org/docs/state-and-lifecycle.html
         * @type {object}
         */
        const state = {
            serverUrl: lockServerUrl || '',
            account: '',
            password: '',
            rememberPassword: true,
            autoLogin: false,
            message: '',
            submitable: false,
            logining: false,
            ldap: false,
        };

        if (entryParams && entryParams.server && (!state.serverUrl || (simpleServerUrl(state.serverUrl) === simpleServerUrl(entryParams.server)))) {
            state.serverUrl = entryParams.server;
            state.account = entryParams.account || '';
            state.password = entryParams.password || '';
            state.ldap = entryParams.ldap;
        }
        if (lastSavedUser && (!state.account || (state.account === lastSavedUser.account))) {
            if (!lockServerUrl) {
                state.serverUrl = lastSavedUser.serverUrl || lastSavedUser.server || '';
            }
            state.account = lastSavedUser.account || '';
            state.password = lastSavedUser.rememberPassword ? lastSavedUser.password : '';
            state.rememberPassword = lastSavedUser.rememberPassword;
            state.autoLogin = lastSavedUser.autoLogin;
            state.ldap = lastSavedUser.ldap;
        }

        if (state.serverUrl) {
            state.serverUrl = simpleServerUrl(state.serverUrl);
        }

        state.submitable = isNotEmptyString(state.serverUrl) && isNotEmptyString(state.account) && isNotEmptyString(state.password);

        let denyAutoLogin = false;
        if (platformUI.isMainWindow) {
            denyAutoLogin = !platformUI.isMainWindow();
        }

        /**
         * 是否在显示界面后自动登录
         * @type {boolean}
         * @private
         */
        this._autoLoginOnOpen = !denyAutoLogin && state.submitable && (state.autoLogin || App.ui.isAutoLoginNextTime());

        if (this._autoLoginOnOpen) {
            state.logining = true;
        }

        this.state = state;
    }

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof LoginForm
     * @return {void}
     */
    componentDidMount() {
        if (this._autoLoginOnOpen) {
            this.login();
        }
        this.onLangChangeHandler = onLangChange(() => {
            this.forceUpdate();
        });
    }

    /**
     * React 组件生命周期函数：`componentWillUnmount`
     * 在组件被卸载和销毁之前立刻调用。可以在该方法里处理任何必要的清理工作，例如解绑定时器，取消网络请求，清理
    任何在componentDidMount环节创建的DOM元素。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentwillunmount
     * @private
     * @memberof LanguageSwitcher
     * @return {void}
     */
    componentWillUnmount() {
        events.off(this.onLangChangeHandler);
    }

    /**
     * 登录到服务器
     *
     * @return {void}
     * @memberof LoginForm
     */
    login() {
        const {
            account,
            password,
            serverUrl,
            rememberPassword,
            ldap,
            autoLogin,
        } = this.state;
        App.server.login({
            server: serverUrl,
            account,
            password,
            rememberPassword,
            autoLogin,
            ldap,
        }).then((user) => {
            this.setState({logining: false});
            return user;
        }).catch(error => {
            if (DEBUG) {
                console.error('Login failed with error:', error);
            }
            this.setState({message: error ? Lang.error(error) : null, logining: false});
        });
    }

    /**
     * 处理输入框变更事件
     *
     * @param {string} field 输入框 ID
     * @param {string} value 输入框值
     * @memberof LoginForm
     * @return {void}
     * @private
     */
    handleInputFieldChange(field, value) {
        const {account, password, serverUrl} = this.state;
        const userState = {
            account,
            password,
            serverUrl,
            message: ''
        };
        userState[field] = value;
        userState.submitable = isNotEmptyString(userState.serverUrl) && isNotEmptyString(userState.account) && isNotEmptyString(userState.password);

        this.setState(userState);
    }

    /**
     * 处理记住密码复选框变更事件
     * @param {boolean} rememberPassword 是否记住密码
     * @memberof LoginForm
     * @private
     * @return {void}
     */
    handleRememberPasswordChanged = rememberPassword => {
        const {ldap, autoLogin} = this.state;
        this.setState({
            rememberPassword,
            ldap: rememberPassword ? false : ldap,
            autoLogin: !rememberPassword ? false : autoLogin
        });
    }

    /**
     * 处理自动登录复选框变更事件
     * @param {boolean} autoLogin 是否自动登录
     * @memberof LoginForm
     * @private
     * @return {void}
     */
    handleAutoLoginChanged = autoLogin => {
        const {ldap, rememberPassword} = this.state;
        this.setState({
            autoLogin,
            ldap: autoLogin ? false : ldap,
            rememberPassword: autoLogin ? true : rememberPassword
        });
    }

    /**
     * 变更 LDAP 设置
     *
     * @param {boolean} ldap 是否启用 LDAP
     * @memberof LoginForm
     * @return {void}
     */
    changeLDAP(ldap) {
        const {autoLogin, rememberPassword, password} = this.state;
        this.setState({
            ldap,
            rememberPassword: ldap ? false : rememberPassword,
            autoLogin: ldap ? false : autoLogin,
        });
        if (ldap && isPasswordWithMD5Flag(password)) {
            this.handleInputFieldChange('password', '');
        }
    }

    /**
     * 处理 LDAP 复选框变更事件
     * @param {boolean} ldap 是否启用 LDAP
     * @memberof LoginForm
     * @private
     * @return {void}
     */
    handleLDAPChanged = ldap => {
        if (ldap && !this.hasShowedLDAPConfirm) {
            Modal.confirm(Lang.string('login.ldap.confirm'), {
                actions: [
                    {type: 'cancel'},
                    {type: 'submit', label: Lang.string('common.continue')},
                ],
                style: {maxWidth: 500},
            }).then(result => {
                if (result) {
                    this.changeLDAP(ldap);
                }
                this.hasShowedLDAPConfirm = true;
                return result;
            }).catch(error => {
                if (DEBUG) {
                    console.error('Modal.confirm error', error);
                }
            });
        } else {
            this.changeLDAP(ldap);
        }
    }

    /**
     * 处理点击登录按钮事件
     * @memberof LoginForm
     * @private
     * @return {void}
     */
    handleLoginBtnClick = () => {
        this.setState({
            logining: true,
            message: '',
        }, () => {
            const {serverUrl} = this.state;
            if (!Config.ui['login.skipHTTPSecurityAlert'] && serverUrl.toLowerCase().startsWith('http://')) {
                Modal.confirm((
                    <div>
                        <h4>{Lang.format('login.nonSecurity.confirm', serverUrl)}</h4>
                        <div className="text-gray">{Lang.string('login.nonSecurity.detail')}</div>
                    </div>
                ), {
                    actions: [
                        {type: 'cancel'},
                        {type: 'submit', label: Lang.string('login.nonSecurity.btn'), className: 'danger-pale text-danger'},
                    ],
                    style: {maxWidth: 500},
                    className: 'app-login-nonSecurity-dialog',
                }).then(result => {
                    if (result) {
                        this.login();
                    } else {
                        this.setState({
                            logining: false,
                            message: '',
                        });
                    }
                    return result;
                }).catch(error => {
                    if (DEBUG) {
                        console.error('Modal.confirm error', error);
                    }
                });
            } else {
                this.login();
            }
        });
    };

    /**
     * 处理点击切换用户按钮事件
     * @memberof LoginForm
     * @private
     * @return {void}
     */
    handleSwapUserBtnClick = () => {
        const {serverUrl, account} = this.state;
        const identify = (serverUrl && account) ? User.createIdentify(serverUrl, account) : null;
        SwapUserDialog.show(identify, user => {
            const newState = {
                serverUrl: simpleServerUrl(user.serverUrl),
                account: user.account,
                password: user.passwordMD5WithFlag,
                message: ''
            };
            newState.submitable = isNotEmptyString(newState.serverUrl) && isNotEmptyString(newState.account) && isNotEmptyString(newState.password);
            this.setState(newState);
        });
    };

    /**
     * 处理服务器地址变更事件
     * @param {string} val 服务器地址
     * @memberof LoginForm
     * @private
     * @return {void}
     */
    handleServerUrlChange = val => {
        this.handleInputFieldChange('serverUrl', val);
    };

    /**
     * 处理用户名变更事件
     * @param {string} val 用户名
     * @memberof LoginForm
     * @private
     * @return {void}
     */
    handleAccountChange = val => {
        this.handleInputFieldChange('account', val);
    };

    /**
     * 处理密码变更事件
     * @param {string} val 密码
     * @memberof LoginForm
     * @private
     * @return {void}
     */
    handlePasswordChange = val => {
        this.handleInputFieldChange('password', val);
    };

    /**
     * 处理点击更多设置按钮事件
     * @param {Event} e 事件对象
     * @memberof LoginForm
     * @private
     * @return {void}
     */
    handleSettingBtnClick = e => {
        const isOpenAtLogin = platformUI.isOpenAtLogin();
        App.ui.showContextMenu({x: e.clientX, y: e.clientY}, [{
            label: Lang.string('login.openAtLogin'),
            checked: isOpenAtLogin,
            click: () => {
                platformUI.setOpenAtLogin(!isOpenAtLogin);
            }
        }]);
    };

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof LoginForm
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            className,
            ...other
        } = this.props;

        if (!this.serverSwitchBtn) {
            this.serverSwitchBtn = <div data-hint={Lang.string('login.swapUser')} className="hint--top app-login-swap-user-btn dock-right dock-top"><button onClick={this.handleSwapUserBtnClick} type="button" className="btn iconbutton rounded"><Icon name="account-switch" /></button></div>;
        }

        const {
            serverUrl,
            account,
            password,
            rememberPassword,
            autoLogin,
            message,
            submitable,
            logining,
            ldap,
        } = this.state;

        let serverView = null;
        if (!this._lockServerUrl) {
            serverView = (
                <InputControl
                    value={serverUrl}
                    autoFocus
                    disabled={logining}
                    label={Lang.string('login.serverUrl.label')}
                    placeholder={Lang.string('login.serverUrl.hint')}
                    onChange={this.handleServerUrlChange}
                    className="relative app-login-server-control"
                >
                    {this.serverSwitchBtn}
                </InputControl>
            );
        }

        return (
            <div className={classes('app-login-form', className)} {...other}>
                {message && <div className="app-login-message danger box">{message}</div>}
                {serverView}
                <InputControl
                    value={account}
                    disabled={logining}
                    label={Lang.string('login.account.label')}
                    placeholder={Lang.string('login.account.hint')}
                    onChange={this.handleAccountChange}
                />
                <InputControl
                    value={password}
                    disabled={logining}
                    className="space"
                    label={Lang.string('login.password.label')}
                    inputType="password"
                    onChange={this.handlePasswordChange}
                />
                <button
                    type="button"
                    disabled={!submitable || logining}
                    className={classes('btn block rounded space-sm', submitable ? 'primary' : 'gray')}
                    onClick={this.handleLoginBtnClick}
                >
                    {Lang.string(logining ? 'login.btn.logining' : 'login.btn.label')}
                </button>
                <div className="row">
                    <Checkbox disabled={logining} checked={rememberPassword} onChange={this.handleRememberPasswordChanged} className="cell" label={Lang.string('login.rememberPassword')} />
                    <Checkbox disabled={logining} checked={autoLogin} onChange={this.handleAutoLoginChanged} className="cell" label={Lang.string('login.autoLogin')} />
                    {Config.ui['login.ldap'] && <Checkbox disabled={logining} checked={ldap} onChange={this.handleLDAPChanged} className="cell" label={Lang.string('login.ldap')} />}
                    {platformUI.isOpenAtLogin ? <div data-hint={Lang.string('login.moreLoginSettings')} className="hint--top"><Button className="iconbutton rounded" icon="settings-box" onClick={this.handleSettingBtnClick} /></div> : null}
                </div>
            </div>
        );
    }
}
