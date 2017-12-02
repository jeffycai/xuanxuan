import React, {Component, PropTypes} from 'react';
import InputControl from '../../components/input-control';
import Checkbox from '../../components/checkbox';
import Modal from '../../components/modal';
import Icon from '../../components/icon';
import Lang from '../../lang';
import HTML from '../../utils/html-helper';
import StringHelper from '../../utils/string-helper';
import App from '../../core';
import User from '../../core/profile/user';
import SwapUserDialog from './swap-user-dialog';
import replaceViews from '../replace-views';

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

class FormView extends Component {
    static get Form() {
        return replaceViews('login/form', FormView);
    }

    static propTypes = {
        className: PropTypes.string,
    };

    static defaultProps = {
        className: null,
    };

    constructor(props) {
        super(props);

        const lastSavedUser = App.profile.getLastSavedUser();
        const entryParams = App.ui.entryParams;
        const state = {
            serverUrl: '',
            account: '',
            password: '',
            rememberPassword: true,
            autoLogin: false,
            message: '',
            submitable: false,
            logining: false,
        };

        if (entryParams && entryParams.server) {
            state.serverUrl = entryParams.server;
            state.account = entryParams.account || '';
            state.password = entryParams.password || '';
        } else if (lastSavedUser) {
            state.serverUrl = lastSavedUser.serverUrl || lastSavedUser.server || '';
            state.account = lastSavedUser.account || '';
            state.password = lastSavedUser.rememberPassword ? lastSavedUser.password : '';
            state.rememberPassword = lastSavedUser.rememberPassword;
            state.autoLogin = lastSavedUser.autoLogin;
        }

        if (state.serverUrl) {
            state.serverUrl = simpleServerUrl(state.serverUrl);
        }

        state.submitable = StringHelper.isNotEmpty(state.serverUrl) && StringHelper.isNotEmpty(state.account) && StringHelper.isNotEmpty(state.password);

        this.state = state;
    }

    componentDidMount() {
        if (DEBUG && this.state.autoLogin && this.state.submitable) {
            this.login();
        }
    }

    login() {
        App.server.login({
            server: this.state.serverUrl,
            account: this.state.account,
            password: this.state.password,
            rememberPassword: this.state.rememberPassword,
            autoLogin: this.state.autoLogin
        }).then(() => {
            this.setState({logining: false});
        }).catch(error => {
            if (DEBUG) {
                console.error('Login failed with error:', error);
            }
            this.setState({message: error ? Lang.error(error) : null, logining: false});
        });
    }

    handleInputFieldChange(field, value) {
        const userState = {
            account: this.state.account,
            password: this.state.password,
            serverUrl: this.state.serverUrl,
            message: ''
        };
        userState[field] = value;
        userState.submitable = StringHelper.isNotEmpty(userState.serverUrl) && StringHelper.isNotEmpty(userState.account) && StringHelper.isNotEmpty(userState.password);

        this.setState(userState);
    }

    handleRememberPasswordChanged = rememberPassword => {
        this.setState({
            rememberPassword,
            autoLogin: !rememberPassword ? false : this.state.autoLogin
        });
    }

    handleAutoLoginChanged = autoLogin => {
        this.setState({
            autoLogin,
            rememberPassword: autoLogin ? true : this.state.rememberPassword
        });
    }

    handleLoginBtnClick = () => {
        this.setState({
            logining: true,
            message: '',
        }, () => {
            const {serverUrl} = this.state;
            if (serverUrl.toLowerCase().startsWith('http://')) {
                Modal.confirm(<div>
                    <h4>{Lang.format('login.nonSecurity.confirm', serverUrl)}</h4>
                    <div className="text-gray">{Lang.string('login.nonSecurity.detail')}</div>
                </div>, {
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
                }).catch(error => {
                    if (DEBUG) {
                        console.error('Modal.confirm error', error);
                    }
                });
            } else {
                this.login();
            }
        });
    }

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
            newState.submitable = StringHelper.isNotEmpty(newState.serverUrl) && StringHelper.isNotEmpty(newState.account) && StringHelper.isNotEmpty(newState.password);
            this.setState(newState);
        });
    }

    render() {
        const {
            className,
            ...other
        } = this.props;

        return (<div className={HTML.classes('app-login-form', className)} {...other}>
            {this.state.message && <div className="app-login-message danger box">{this.state.message}</div>}
            <InputControl
                value={this.state.serverUrl}
                autoFocus
                disabled={this.state.logining}
                label={Lang.string('login.serverUrl.label')}
                placeholder={Lang.string('login.serverUrl.hint')}
                onChange={this.handleInputFieldChange.bind(this, 'serverUrl')}
                className="relative app-login-server-control"
            >
                <div data-hint={Lang.string('login.swapUser')} className="hint--top app-login-swap-user-btn dock-right dock-top"><button onClick={this.handleSwapUserBtnClick} type="button" className="btn iconbutton rounded"><Icon name="account-switch" /></button></div>
            </InputControl>
            <InputControl
                value={this.state.account}
                disabled={this.state.logining}
                label={Lang.string('login.account.label')}
                placeholder={Lang.string('login.account.hint')}
                onChange={this.handleInputFieldChange.bind(this, 'account')}
            />
            <InputControl
                value={this.state.password}
                disabled={this.state.logining}
                className="space"
                label={Lang.string('login.password.label')}
                inputType="password"
                onChange={this.handleInputFieldChange.bind(this, 'password')}
            />
            <button
                type="button"
                disabled={!this.state.submitable || this.state.logining}
                className={HTML.classes('btn block rounded space-sm', this.state.submitable ? 'primary' : 'gray')}
                onClick={this.handleLoginBtnClick}
            >
                {Lang.string(this.state.logining ? 'login.btn.logining' : 'login.btn.label')}
            </button>
            <div className="row">
                <Checkbox disabled={this.state.logining} checked={this.state.rememberPassword} onChange={this.handleRememberPasswordChanged} className="cell" label={Lang.string('login.rememberPassword')} />
                <Checkbox disabled={this.state.logining} checked={this.state.autoLogin} onChange={this.handleAutoLoginChanged} className="cell" label={Lang.string('login.autoLogin')} />
            </div>
        </div>);
    }
}

export default FormView;
