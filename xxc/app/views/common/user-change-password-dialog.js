import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Modal from '../../components/modal';
import InputControl from '../../components/input-control';
import Messager from '../../components/messager';
import App from '../../core';
import HTML from '../../utils/html-helper';
import StringHelper from '../../utils/string-helper';
import Lang from '../../core/lang';

/**
 * UserChangePassword-Dialog 组件 ，显示修改用户密码界面
 * @class UserChangePassword-Dialog
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import UserChangePassword-Dialog from './user-change-password-dialog';
 * <UserChangePassword-Dialog />
 */
export class UserChangePassword extends Component {
    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof UserChangePassword-Dialog
     * @type {Object}
     */
    static propTypes = {
        onFinish: PropTypes.func,
        className: PropTypes.string,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof UserChangePassword-Dialog
     * @static
     */
    static defaultProps = {
        onFinish: null,
        className: null,
    };

    /**
     * React 组件构造函数，创建一个 UserChangePassword-Dialog 组件实例，会在装配之前被调用。
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
        this.state = {
            oldPassword: '',
            password1: '',
            password2: '',
            message: '',
            doing: false
        };
    }

    /**
     * 处理输入框值变更事件
     * @param {string} name 属性名称
     * @param {string} value 属性值
     * @memberof UserChangePassword-Dialog
     * @private
     * @return {void}
     */
    handleInputChange(name, value) {
        this.setState({[name]: value, message: ''});
    }

    /**
     * 处理取消按钮点击事件
     * @memberof UserChangePassword-Dialog
     * @private
     * @return {void}
     */
    handleCancelBtnClick = () => {
        if (this.props.onFinish) {
            this.props.onFinish(false);
        }
    }

    /**
     * 处理确定按钮点击事件
     * @memberof UserChangePassword-Dialog
     * @private
     * @return {void}
     */
    handleConfirmBtnClick = () => {
        if (StringHelper.isEmpty(this.state.password1)) {
            return this.setState({message: Lang.format('user.changePassword.inputRequired', Lang.string('user.changePassword.newPassword'))});
        }
        if (this.state.password1.length < 6) {
            return this.setState({message: Lang.string('user.changePassword.denySimplePassword')});
        }
        if (StringHelper.isEmpty(this.state.password2)) {
            return this.setState({message: Lang.format('user.changePassword.inputRequired', Lang.string('user.changePassword.newPasswordRepeat'))});
        }
        if (this.state.password1 !== this.state.password2) {
            return this.setState({message: Lang.string('user.changePassword.passwordNotSame')});
        }
        this.setState({doing: true});
        App.server.socket.changeUserPassword(this.state.password1).then(() => {
            this.setState({doing: false});
            if (this.props.onFinish) {
                this.props.onFinish(true);
            }
        }).catch(error => {
            this.setState({
                message: Lang.error(error) || Lang.string('user.changePassword.failed'),
                doing: false
            });
        });
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof UserChangePassword-Dialog
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            onFinish,
            className,
            ...other
        } = this.props;
        return (<div className={HTML.classes('app-user-change-pwd', className)} {...other}>
            {this.state.message && <div className="box danger rounded space-sm">{this.state.message}</div>}
            <InputControl inputType="password" className={this.state.message && (StringHelper.isEmpty(this.state.password1) || this.state.password1 !== this.state.password2) ? 'has-error' : ''} disabled={this.state.doing} onChange={this.handleInputChange.bind(this, 'password1')} value={this.state.password1} label={Lang.string('user.changePassword.newPassword')} />
            <InputControl inputType="password" className={this.state.message && (StringHelper.isEmpty(this.state.password2) || this.state.password1 !== this.state.password2) ? 'has-error' : ''} disabled={this.state.doing} onChange={this.handleInputChange.bind(this, 'password2')} value={this.state.password2} label={Lang.string('user.changePassword.newPasswordRepeat')} />
            <div className="has-padding-v">
                <button disabled={this.state.doing} onClick={this.handleConfirmBtnClick} type="button" className="btn primary btn-wide">{Lang.string('user.changePassword.btn.confirm')}</button>
                 &nbsp;
                <button disabled={this.state.doing} onClick={this.handleCancelBtnClick} type="button" className="btn gray btn-wide">{Lang.string('common.cancel')}</button>
            </div>
        </div>);
    }
}

/**
 * 显示修改密码对话框
 * @param {function} callback 对话框显示回调函数
 * @return {void}
 */
export const showUserChangePasswordDialog = (callback) => {
    const modalId = 'user-change-pwd';
    const onFinish = result => {
        Modal.hide(modalId);
        if (result) {
            Messager.show(Lang.string('user.changePassword.success'), {type: 'success'});
        }
    };
    return Modal.show({
        actions: false,
        id: modalId,
        className: 'app-user-change-pwd-dialog',
        content: <UserChangePassword onFinish={onFinish} />,
        title: Lang.string('user.changePassword.heading')
    }, callback);
};

export default {
    show: showUserChangePasswordDialog,
};
