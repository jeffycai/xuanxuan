import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import Config from '../../config';
import {classes} from '../../utils/html-helper';
import _LoginForm from './form'; // eslint-disable-line
import _BuildInfo from '../common/build-info'; // eslint-disable-line
import PoweredInfo from '../common/powered-info';
import App from '../../core';
import withReplaceView from '../with-replace-view';
import pkg from '../../package.json';
import AboutDialog from '../common/about-dialog';
import {getLangDisplayName} from '../../core/lang';
import Icon from '../../components/icon';

/**
 * LoginForm 可替换组件形式
 * @type {Class<LoginForm>}
 * @private
 */
const LoginForm = withReplaceView(_LoginForm);

/**
 * UserAvatar 可替换组件形式
 * @type {Class<UserAvatar>}
 * @private
 */
const BuildInfo = withReplaceView(_BuildInfo);

/**
 * LoginIndex 组件 ，显示登录界面
 * @class LoginIndex
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example
 * import LoginIndex from './index';
 * <LoginIndex />
 */
export default class LoginIndex extends PureComponent {
    /**
     * LoginIndex 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof LoginIndex
     */
    static replaceViewPath = 'login/LoginIndex';

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof LoginIndex
     * @static
     */
    static defaultProps = {
        className: null,
        userStatus: null,
        children: null,
    };

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof LoginIndex
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
        userStatus: PropTypes.any,
        children: PropTypes.any,
    };

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof LoginIndex
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            className,
            userStatus,
            children,
            ...other
        } = this.props;

        let showPoweredBy = Config.ui['app.showPoweredBy'];
        if (showPoweredBy === 'auto') {
            showPoweredBy = pkg.name !== 'xuanxuan';
        }

        return (
            <div className={classes('app-login center-content', className)} {...other}>
                <header className="has-padding-sm dock-right dock-top">
                    <a href="xxc:showLanguageSwitchDialog" className="btn darken text-white rounded muted"><Icon name="web" />&nbsp;<small>{getLangDisplayName()}</small></a>
                </header>
                <section>
                    <header className="text-center space-sm">
                        <img src={`${Config.media['image.path']}logo-inverse.png`} alt="logo" />
                    </header>
                    <LoginForm className="rounded layer has-padding-xl" />
                    {App.ui.entryParams.loginTip && <div className="app-login-tip small text-center has-padding-v muted text-white">{App.ui.entryParams.loginTip}</div>}
                    {children}
                </section>
                <footer className="dock-bottom text-center text-white muted has-padding-sm">
                    <BuildInfo className="small state has-padding-sm inline-block" onClick={() => AboutDialog.show()} />
                    {showPoweredBy ? '•' : null}
                    {showPoweredBy && <PoweredInfo className="state has-padding-sm inline-block strong small" />}
                </footer>
            </div>
        );
    }
}
