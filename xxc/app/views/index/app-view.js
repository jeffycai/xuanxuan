import React, {PureComponent} from 'react';
import App from '../../core';
import _LoginIndex from '../login';
import _MainIndex from '../main';
import withReplaceView from '../with-replace-view';

/**
 * MainIndex 可替换组件形式
 * @type {Class<MainIndex>}
 * @private
 */
const MainIndex = withReplaceView(_MainIndex);

/**
 * LoginIndex 可替换组件形式
 * @type {Class<LoginIndex>}
 * @private
 */
const LoginIndex = withReplaceView(_LoginIndex);

/**
 * AppView 组件 ，显示喧喧主应用界面
 * @class AppView
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example
 * import AppView from './app-view';
 * <AppView />
 */
export default class AppView extends PureComponent {
    /**
     * AppView 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof AppView
     */
    static replaceViewPath = 'index/AppView';

    /**
     * React 组件构造函数，创建一个 AppView 组件实例，会在装配之前被调用。
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
            userStatus: App.profile.userStatus
        };
    }

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof AppView
     * @return {void}
     */
    componentDidMount() {
        this.onUserStatusChangeHandler = App.profile.onUserStatusChange(user => {
            this.setState({userStatus: App.profile.userStatus});
        });
    }

    /**
     * React 组件生命周期函数：`componentWillUnmount`
     * 在组件被卸载和销毁之前立刻调用。可以在该方法里处理任何必要的清理工作，例如解绑定时器，取消网络请求，清理
    任何在componentDidMount环节创建的DOM元素。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentwillunmount
     * @private
     * @memberof AppView
     * @return {void}
     */
    componentWillUnmount() {
        App.events.off(this.onUserStatusChangeHandler);
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof AppView
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {isUserVertified} = App.profile;
        return (
            <div
                className="affix"
                style={{
                    transition: 'transform .4s',
                    transform: `translateX(${isUserVertified ? '0' : '100%'})`
                }}
            >
                <LoginIndex
                    userStatus={this.state.userStatus}
                    className="dock-left"
                    style={{
                        width: '100%',
                        left: '-100%',
                    }}
                />
                <MainIndex userStatus={this.state.userStatus} className={`dock${isUserVertified ? ' app-user-vertified' : ''}`} />
            </div>
        );
    }
}
