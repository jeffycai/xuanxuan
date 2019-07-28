import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Route, Redirect} from 'react-router-dom';
import {classes} from '../../utils/html-helper';
import ROUTES from '../common/routes';
import App from '../../core';
import _Navbar from './navbar';
import _GlobalMessage from './global-message';
import _CacheContainer from './cache-container';
import withReplaceView from '../with-replace-view';
import {onLangChange} from '../../core/lang';
import events from '../../core/events';

/**
 * GlobalMessage 可替换组件形式
 * @type {Class<GlobalMessage>}
 * @private
 */
const GlobalMessage = withReplaceView(_GlobalMessage);

/**
 * CacheContainer 可替换组件形式
 * @type {Class<CacheContainer>}
 * @private
 */
const CacheContainer = withReplaceView(_CacheContainer);

/**
 * Navbar 可替换组件形式
 * @type {Class<Navbar>}
 * @private
 */
const Navbar = withReplaceView(_Navbar);

/**
 * Index 组件 ，显示主界面
 * @class Index
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import Index from './index';
 * <Index />
 */
export default class MainIndex extends Component {
    /**
     * MainIndex 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof MainIndex
     */
    static replaceViewPath = 'main/MainIndex';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof Index
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
        userStatus: PropTypes.any,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof Index
     * @static
     */
    static defaultProps = {
        className: null,
        userStatus: null,
    };

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof Index
     * @return {void}
     */
    componentDidMount() {
        this.onUserConfigChange = App.profile.onUserConfigChange(() => {
            this.forceUpdate();
        });
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
     * @memberof Index
     * @return {void}
     */
    componentWillUnmount() {
        events.off(this.onUserConfigChange, this.onLangChangeHandler);
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof Index
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            className,
            userStatus,
            ...other
        } = this.props;

        return (
            <div className={classes('app-main', className)} {...other}>
                <GlobalMessage className="dock-top" />
                <Navbar userStatus={userStatus} className="dock-left primary shadow-2" />
                <Route path={ROUTES.apps.__} exact component={CacheContainer} />
                <Route
                    path="/:app?"
                    exact
                    render={(props) => {
                        if (props.match.url === '/' || props.match.url === '/index' || props.match.url === '/chats') {
                            const activeChatId = App.im.ui.currentActiveChatId;
                            if (activeChatId) {
                                return <Redirect to={`/chats/recents/${activeChatId}`} />;
                            }
                            return <Redirect to="/chats/recents" />;
                        }
                        return null;
                    }}
                />
            </div>
        );
    }
}
