import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import HTML from '../../utils/html-helper';
import App from '../../core';
import Lang from '../../core/lang';
import Member from '../../core/models/member';
import Avatar from '../../components/avatar';


/**
 * 自动连接登录最短时间计数
 * @type {number}
 * @private
 */
const CONNECT_TIME_TICK = 5;

/**
 * GlobalMessage 组件 ，显示全局提示消息界面（在主界面顶部显示）
 * @class GlobalMessage
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example
 * import GlobalMessage from './global-message';
 * <GlobalMessage />
 */
export default class GlobalMessage extends PureComponent {
    /**
     * GlobalMessage 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof GlobalMessage
     */
    static replaceViewPath = 'main/GlobalMessage';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof GlobalMessage
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof GlobalMessage
     * @static
     */
    static defaultProps = {
        className: null,
    };

    /**
     * React 组件构造函数，创建一个 GlobalMessage 组件实例，会在装配之前被调用。
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
            userStatus: '',
            tick: 0,
            connecting: false,
            disconnect: false,
            failMessage: ''
        };
    }

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof GlobalMessage
     * @return {void}
     */
    componentDidMount() {
        this.onUserStatusChangeHandler = App.profile.onUserStatusChange(user => {
            const userStatus = App.profile.userStatus;
            if (this.state.userStatus !== userStatus) {
                this.setState({userStatus});
                if (Member.STATUS.isSame(userStatus, Member.STATUS.disconnect)) {
                    this.startConnect();
                } else {
                    this.stopConnect();
                }
            }
        });
    }

    /**
     * React 组件生命周期函数：`componentWillUnmount`
     * 在组件被卸载和销毁之前立刻调用。可以在该方法里处理任何必要的清理工作，例如解绑定时器，取消网络请求，清理
    任何在componentDidMount环节创建的DOM元素。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentwillunmount
     * @private
     * @memberof GlobalMessage
     * @return {void}
     */
    componentWillUnmount() {
        App.events.off(this.onUserStatusChangeHandler);
        clearInterval(this.countTimer);
    }

    /**
     * 重新尝试连接到服务器
     * @return {void}
     * @memberof GlobalMessage
     */
    connect() {
        this.setState({
            connecting: true,
            failMessage: ''
        });
        App.server.login(App.profile.user).catch(error => {
            if (DEBUG) {
                console.error('Login failed with error:', error);
            }
            this.connectTimes += 1;
            this.setState({
                failMessage: Lang.error(error),
                connecting: false,
                tick: this.connectTimes * CONNECT_TIME_TICK
            });
        });
    }

    /**
     * 开始自动重连
     * @return {void}
     * @memberof GlobalMessage
     */
    startConnect() {
        this.connectTimes = 0;
        this.setState({
            connecting: false,
            disconnect: true,
            tick: 0,
        });
        this.countTimer = setInterval(() => {
            const {
                connecting,
                tick,
            } = this.state;
            if (!connecting) {
                if (tick < 1) {
                    this.connect();
                } else {
                    this.setState({tick: tick - 1});
                }
            }
        }, 1000);
    }

    /**
     * 停止自动重连
     * @return {void}
     * @memberof GlobalMessage
     */
    stopConnect() {
        this.setState({
            connecting: false,
            disconnect: false
        });
        clearInterval(this.countTimer);
    }

    /**
     * ；立即自动重连
     * @return {void}
     * @memberof GlobalMessage
     */
    reconnectNow() {
        if (!this.state.connecting) {
            this.connectTimes = Math.min(1, Math.floor(this.connectTimes / 2));
            this.connect();
        }
    }

    /**
     * 取消连接并退出
     * @return {void}
     * @memberof GlobalMessage
     */
    logout() {
        this.stopConnect();
        App.server.logout();
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof GlobalMessage
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            className,
            ...other
        } = this.props;

        const {
            connecting,
            disconnect,
            tick,
        } = this.state;

        let contentView = null;
        if (disconnect) {
            if (connecting) {
                contentView = (<div className="heading">
                    <Avatar icon="loading spin" />
                    <div className="title">{Lang.string('login.autoConnet.connecting')}</div>
                    <nav className="nav">
                        <a onClick={this.logout.bind(this)}>{Lang.string('login.autoConnet.logout')}</a>
                    </nav>
                </div>);
            } else {
                contentView = (<div className="heading">
                    <Avatar icon={tick % 2 === 0 ? 'lan-disconnect' : 'lan-connect'} />
                    <div className="title">
                        {Lang.format(this.connectTimes ? 'login.autoConnet.faildAndWait' : 'login.autoConnet.wait', Math.max(0, tick))}
                        {this.state.failMessage ? <span data-hint={this.state.failMessage} className="hint--bottom">{Lang.string('login.autoConnet.errorDetail')}</span> : null}
                    </div>
                    <nav className="nav">
                        <a onClick={this.reconnectNow.bind(this)}>{Lang.string('login.autoConnet.conectIM')}</a>
                        <a onClick={this.logout.bind(this)}>{Lang.string('login.autoConnet.logout')}</a>
                    </nav>
                </div>);
            }
        }

        return (<div
            className={HTML.classes('app-global-message center-content', className, {
                'app-user-disconnet yellow': disconnect,
            })}
            {...other}
        >
            {contentView}
        </div>);
    }
}
