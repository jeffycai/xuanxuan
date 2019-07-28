import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../../utils/html-helper';
import {getUrlMeta} from '../../core/ui';
import _MessageContentCard from './message-content-card';
import _WebView from '../common/webview';
import Lang from '../../core/lang';
import Button from '../../components/button';
import {showContextMenu, getMenuItemsForContext} from '../../core/context-menu';
import ContextMenu from '../../components/context-menu';
import withReplaceView from '../with-replace-view';
import ChatShareDialog from './chat-share-dialog';

/**
 * MessageContentCard 可替换组件形式
 * @type {Class<MessageContentCard>}
 * @private
 */
const MessageContentCard = withReplaceView(_MessageContentCard);

/**
 * WebView 可替换组件形式
 * @type {Class<WebView>}
 * @private
 */
const WebView = withReplaceView(_WebView);

/**
 * MessageContentUrl 组件 ，显示聊天消息网址卡片内容界面
 * @class MessageContentUrl
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example
 * import MessageContentUrl from './message-content-url';
 * <MessageContentUrl />
 */
export default class MessageContentUrl extends PureComponent {
    /**
     * MessageContentUrl 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof MessageContentUrl
     */
    static replaceViewPath = 'chats/MessageContentUrl';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof MessageContentUrl
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
        url: PropTypes.string.isRequired,
        data: PropTypes.object,
        sleep: PropTypes.bool,
        cgid: PropTypes.string,
        message: PropTypes.object,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof MessageContentUrl
     * @static
     */
    static defaultProps = {
        className: null,
        data: null,
        cgid: null,
        message: null,
        sleep: false
    };

    /**
     * React 组件构造函数，创建一个 MessageContentUrl 组件实例，会在装配之前被调用。
     * @see https://react.docschina.org/docs/react-component.html#constructor
     * @param {Object?} props 组件属性对象
     * @constructor
     */
    constructor(props) {
        super(props);
        const {data, sleep} = props;

        /**
         * React 组件状态对象
         * @see https://react.docschina.org/docs/state-and-lifecycle.html
         * @type {object}
         */
        this.state = {meta: data && data.title ? data : null, sleep};
    }

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof MessageContentUrl
     * @return {void}
     */
    componentDidMount() {
        const {sleep} = this.state;
        if (!sleep) {
            this.getUrlMeta();
        }
    }

    /**
     * React 组件生命周期函数：`componentWillReceiveProps`
     * 在装配了的组件接收到新属性前调用。若你需要更新状态响应属性改变（例如，重置它），你可能需对比this.props和nextProps并在该方法中使用this.setState()处理状态改变。
     *
     * @param {Object} nextProps 即将更新的属性值
     * @see https://doc.react-china.org/docs/react-component.html#unsafe_componentwillreceiveprops
     * @private
     * @memberof MessageContentUrl
     * @return {void}
     * @todo 考虑使用 `UNSAFE_componentWillReceiveProps` 替换 `componentWillReceiveProps`
     */
    componentWillReceiveProps(nextProps) {
        const {url} = this.props;
        if (nextProps.url !== url) {
            this.setState({meta: null});
        }
    }

    /**
     * React 组件生命周期函数：`componentWillUnmount`
     * 在组件被卸载和销毁之前立刻调用。可以在该方法里处理任何必要的清理工作，例如解绑定时器，取消网络请求，清理
    任何在componentDidMount环节创建的DOM元素。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentwillunmount
     * @private
     * @memberof MessageContentUrl
     * @return {void}
     */
    componentWillUnmount() {
        this.unmounted = true;
    }

    /**
     * 获取卡片最大适合宽度（填充满窗口消息列表可用区域）
     *
     * @return {number} 宽度
     * @memberof MessageContentUrl
     */
    getFluidCardWidth = () => {
        const {cgid} = this.props;
        const messageListEle = document.querySelector(cgid ? `#chat-view-${cgid.replace('&', '_')} .app-message-list` : '.app-chats .app-chat:not(.hidden) .app-message-list');
        if (messageListEle) {
            return messageListEle.clientWidth - 80;
        }
    };

    /**
     * 获取网址信息
     *
     * @param {boolean} [disableCache=false] 是否禁用缓存
     * @memberof MessageContentUrl
     * @return {void}
     */
    getUrlMeta(disableCache = false) {
        const {meta, loading} = this.state;
        if (meta && !loading) {
            return;
        }
        const {url} = this.props;
        getUrlMeta(url, disableCache).then(thisMeta => {
            if (this.unmounted) {
                return;
            }
            return this.setState({meta: thisMeta, loading: false});
        }).catch(_ => {
            if (this.unmounted) {
                return;
            }
            if (DEBUG) {
                console.error('Get url meta error', _);
            }
            return this.setState({meta: {url, title: url}, loading: false});
        });
    }

    /**
     * 获取网址信息（禁用缓存）
     *
     * @memberof MessageContentUrl
     * @return {void}
     */
    tryGetUrlMeta() {
        this.setState({loading: true}, () => {
            this.getUrlMeta(true);
        });
    }

    /**
     * 尝试强制获取网址信息
     *
     * @memberof MessageContentUrl
     * @return {void}
     */
    loadSleep = () => {
        this.setState({sleep: false, loading: true}, () => {
            this.getUrlMeta(true);
        });
    };

    /**
     * 处理显示消息内容上下文菜单事件
     * @param {Event} event 事件对象
     * @memberof MessageListItem
     * @private
     * @return {void}
     */
    handleContextMenu = event => {
        if (event.target.tagName === 'WEBVIEW') {
            return;
        }
        const {url, message} = this.props;
        showContextMenu('link,message.url', {
            url,
            event,
            message,
            options: {
                copy: true,
                selectAll: false,
            }
        });
    };

    handleMoreActionsBtnClick(card, e) {
        const {url, message} = this.props;
        const {webviewContent, content} = card;
        const menu = [];
        menu.push(...getMenuItemsForContext('link', {url, event: e}));
        menu.push({
            label: Lang.string('chat.share'),
            icon: 'mdi-share-outline',
            click: () => {
                ChatShareDialog.show(message);
            }
        });
        if (webviewContent) {
            const {originSrc} = content;
            menu.push('divider');
            menu.push({
                label: Lang.string('ext.app.open'),
                url: `!openUrlInDialog/${encodeURIComponent(originSrc || content.src)}/?size=lg&insertCss=${encodeURIComponent(content.insertCss)}`,
                icon: 'mdi-open-in-app'
            });
            if (DEBUG && content.type !== 'iframe') {
                menu.push({
                    label: Lang.string('ext.app.openDevTools'),
                    click: () => {
                        if (this.webview && this.webview.webview && this.webview.webview.openDevTools) {
                            this.webview.webview.openDevTools();
                        } else if (DEBUG) {
                            console.warn('Cannot open dev tools for current webview.');
                        }
                    },
                    icon: 'mdi-auto-fix'
                });
            }
        }
        ContextMenu.show({x: e.clientX, y: e.clientY}, menu);
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof MessageContentUrl
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            url,
            className,
            data,
            sleep,
            ...other
        } = this.props;

        const {meta, loading, sleep: stateSleep} = this.state;

        if (stateSleep) {
            const card = {
                icon: 'mdi-web icon-2x text-info',
                clickable: 'title',
                url,
                title: url,
            };
            const reloadBtn = (<div className="flex-none hint--top has-padding-sm" data-hint={Lang.string('chat.message.loadCard')}><Button onClick={this.loadSleep} className="iconbutton rounded text-primary" icon="mdi-cards-playing-outline" /></div>);
            card.menu = [{
                label: Lang.string('common.moreActions'),
                icon: 'mdi-dots-vertical',
                click: this.handleMoreActionsBtnClick.bind(this, card)
            }];
            return <MessageContentCard onContextMenu={this.handleContextMenu} header={reloadBtn} card={card} className={classes('app-message-content-url relative')} {...other} fluidWidth={this.getFluidCardWidth} />;
        }

        const card = Object.assign({
            clickable: 'content',
            title: url,
        }, meta, {
            icon: (meta && !loading) ? (meta.icon === false ? null : (meta.icon || 'mdi-web icon-2x text-info')) : 'mdi-loading muted spin', // eslint-disable-line
        });

        if (!loading) {
            card.menu = [{
                label: Lang.string('common.moreActions'),
                icon: 'mdi-dots-vertical',
                click: this.handleMoreActionsBtnClick.bind(this, card)
            }];
            const {webviewContent, content} = card;
            if (meta && webviewContent) {
                const {originSrc, ...webviewProps} = content;
                card.content = <WebView fluidWidth={this.getFluidCardWidth} className="relative" {...webviewProps} ref={e => {this.webview = e;}} />;
                card.clickable = 'header';
                card.menu.push({
                    label: Lang.string('chat.message.refreshCard'),
                    click: () => {
                        if (this.webview) {
                            this.webview.reloadWebview();
                        } else {
                            this.tryGetUrlMeta();
                        }
                    },
                    icon: 'mdi-refresh'
                });
            }
        }

        return (
            <MessageContentCard
                onContextMenu={this.handleContextMenu}
                card={card}
                fluidWidth={this.getFluidCardWidth}
                className={classes('app-message-content-url relative', {
                    'is-webview': card.webviewContent
                })}
                {...other}
            />
        );
    }
}
