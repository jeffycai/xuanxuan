import React, {Component} from 'react';
import PropTypes from 'prop-types';
import HTML from '../../utils/html-helper';
import Icon from '../../components/icon';
import Avatar from '../../components/avatar';
import Messager from '../../components/messager';
import SearchControl from '../../components/search-control';
import Spinner from '../../components/spinner';
import Lang from '../../core/lang';
import App from '../../core';
import ROUTES from '../common/routes';
import _ChatListItem from './chat-list-item';
import withReplaceView from '../with-replace-view';

/**
 * ChatListItem 可替换组件形式
 * @type {Class<ChatListItem>}
 * @private
 */
const ChatListItem = withReplaceView(_ChatListItem);

/**
 * ChatJoinPublic 组件 ，显示一个加入公共讨论组界面
 * @class ChatJoinPublic
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import ChatJoinPublic from './chat-join-public';
 * <ChatJoinPublic />
 */
export default class ChatJoinPublic extends Component {
    /**
     * ChatJoinPublic 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof ChatJoinPublic
     */
    static replaceViewPath = 'chats/ChatJoinPublic';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof ChatJoinPublic
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
        children: PropTypes.any,
        onRequestClose: PropTypes.func,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof ChatJoinPublic
     * @static
     */
    static defaultProps = {
        className: null,
        children: null,
        onRequestClose: null,
    };

    /**
     * React 组件构造函数，创建一个 ChatJoinPublic 组件实例，会在装配之前被调用。
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
            choosed: null,
            search: '',
            chats: [],
            loading: true
        };
    }

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof ChatJoinPublic
     * @return {void}
     */
    componentDidMount() {
        this.loadPublicChats();
    }

    /**
     * React 组件生命周期函数：`componentWillUnmount`
     * 在组件被卸载和销毁之前立刻调用。可以在该方法里处理任何必要的清理工作，例如解绑定时器，取消网络请求，清理
    任何在componentDidMount环节创建的DOM元素。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentwillunmount
     * @private
     * @memberof ChatJoinPublic
     * @return {void}
     */
    componentWillUnmount() {
        this.unmounted = true;
    }

    /**
     * 加载公开讨论组
     * @return {void}
     * @memberof ChatJoinPublic
     * @private
     */
    loadPublicChats() {
        this.setState({loading: true});
        App.im.server.fetchPublicChats().then(chats => {
            if (this.unmounted) return;
            this.setState({loading: false, chats});
        }).catch(error => {
            if (this.unmounted) return;
            this.setState({loading: false, chats: []});
            if (error) {
                Messager.show(Lang.error(error), {type: 'danger'});
            }
        });
    }

    /**
     * 处理搜索框值变更事件
     * @param {string} search 搜索字符串
     * @memberof ChatJoinPublic
     * @private
     * @return {void}
     */
    handleSearchChange = search => {
        search = search && search.toLowerCase();
        this.setState({search});
    }

    /**
     * 处理点击刷新按钮事件
     * @memberof ChatJoinPublic
     * @private
     * @return {void}
     */
    handleRefreshBtnClick = () => {
        this.loadPublicChats();
    }

    /**
     * 处理点击加入按钮事件
     * @memberof ChatJoinPublic
     * @private
     * @return {void}
     */
    handleJoinBtnClick = () => {
        const {choosed} = this.state;
        App.im.server.joinChat(choosed).then(chat => {
            window.location.hash = `#${ROUTES.chats.groups.id(chat.gid)}`;
            const {onRequestClose} = this.props;
            if (onRequestClose) {
                onRequestClose();
            }
            return chat;
        }).catch(error => {
            if (error) {
                Messager.show(Lang.error(error));
            }
        });
    }

    /**
     * 处理点击聊天条目事件
     * @param {Chat} chat 聊天对象
     * @memberof ChatJoinPublic
     * @private
     * @return {void}
     */
    handleChatItemClick(chat) {
        this.setState({choosed: chat});
    }

    /**
     * 判断给定的聊天是否匹配搜索字符串
     *
     * @param {Chat} chat 聊天对象
     * @returns {boolean} 如果返回 `true` 则为是匹配搜索字符串，否则为不是匹配搜索字符串
     * @memberof ChatJoinPublic
     * @private
     */
    isMatchSearch(chat) {
        const {search} = this.state;
        if (!search.length) {
            return true;
        }
        const chatName = chat.name.toLowerCase();
        return chatName.includes(search) || chat.gid === search;
    }

    /**
     * 判断给定的聊天是否是选中的聊天
     *
     * @param {Chat} chat 聊天对象
     * @returns {boolean} 如果返回 `true` 则为是选中的聊天，否则为不是选中的聊天
     * @memberof ChatJoinPublic
     * @private
     */
    isChoosed(chat) {
        return this.state.choosed && this.state.choosed.gid === chat.gid;
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ChatJoinPublic
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            className,
            children,
            onRequestClose,
            ...other
        } = this.props;

        return (<div
            {...other}
            className={HTML.classes('app-chat-join-public column single', className)}
        >
            <div className="list-item divider flex-none">
                <Avatar icon="arrow-right" iconClassName="text-muted icon-2x" />
                <div className="title">{Lang.string('chat.create.joinGroupTip')}</div>
                <div className="flex-none">
                    <button type="button" onClick={this.handleJoinBtnClick} disabled={!this.state.choosed} className="btn primary rounded">{this.state.choosed ? Lang.format('chat.create.joinGroup.format', this.state.choosed.getDisplayName(App)) : Lang.string('chat.create.join')}</button>
                </div>
            </div>
            <div className="white cell">
                <div className="column single">
                    <div className="cell heading flex-none has-padding">
                        <nav className="flex-auto">
                            <a className={'btn text-primary rounded' + (this.state.loading ? ' disabled' : '')} onClick={this.handleRefreshBtnClick}>{Lang.string('common.refresh')}</a>
                        </nav>
                        <SearchControl defaultValue={this.state.search} onSearchChange={this.handleSearchChange} className="flex-none" style={{width: HTML.rem(200)}} />
                    </div>
                    <div className="cell scroll-y has-padding relative">
                        <div className="list fluid compact app-chat-join-public-chat-list">
                            {
                                !this.state.loading && this.state.chats.map(chat => {
                                    if (!App.im.chats.get(chat.gid) && this.isMatchSearch(chat)) {
                                        const isChoosed = this.isChoosed(chat);
                                        return <ChatListItem notUserLink="disabled" className={isChoosed ? 'item primary-pale space-sm' : 'item space-sm'} onClick={this.handleChatItemClick.bind(this, chat)} key={chat.gid} chat={chat}>{isChoosed && <Icon name="check text-success" />}</ChatListItem>;
                                    }
                                    return null;
                                })
                            }
                            {this.state.loading && <div className="dock center-content"><Spinner className="text-primary" iconSize={36} /></div>}
                        </div>
                    </div>
                </div>
            </div>
            {children}
        </div>);
    }
}
