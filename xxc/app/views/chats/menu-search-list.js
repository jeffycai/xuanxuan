import React, {Component} from 'react';
import PropTypes from 'prop-types';
import hotkeys from 'hotkeys-js';
import {classes} from '../../utils/html-helper';
import App from '../../core';
import {showContextMenu} from '../../core/context-menu';
import _ChatListItem from './chat-list-item';
import ROUTES from '../common/routes';
import ListItem from '../../components/list-item';
import Lang from '../../core/lang';
import Config from '../../config';
import withReplaceView from '../with-replace-view';

/**
 * ChatListItem 可替换组件形式
 * @type {Class<ChatListItem>}
 * @private
 */
const ChatListItem = withReplaceView(_ChatListItem);

/**
 * MenuSearchList 组件 ，显示聊天搜索结果列表界面
 * @class MenuSearchList
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import MenuSearchList from './menu-search-list';
 * <MenuSearchList />
 */
export default class MenuSearchList extends Component {
    /**
     * MenuSearchList 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof MenuSearchList
     */
    static replaceViewPath = 'chats/MenuSearchList';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof MenuSearchList
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
        search: PropTypes.string,
        filter: PropTypes.string,
        children: PropTypes.any,
        onRequestClearSearch: PropTypes.func,
        startPageSize: PropTypes.number,
        morePageSize: PropTypes.number,
        defaultPage: PropTypes.number,
        activeChatId: PropTypes.string,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof MenuSearchList
     * @static
     */
    static defaultProps = {
        className: null,
        search: null,
        filter: null,
        children: null,
        onRequestClearSearch: null,
        startPageSize: Config.ui['page.start.size'] || 20,
        morePageSize: Config.ui['page.more.size'] || 20,
        defaultPage: 1,
        activeChatId: null,
    };

    /**
     * React 组件构造函数，创建一个 MenuSearchList 组件实例，会在装配之前被调用。
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
            select: '',
            page: props.defaultPage
        };
    }

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof MenuSearchList
     * @return {void}
     */
    componentDidMount() {
        hotkeys('up', 'chatsMenuSearch', e => {
            const {chats, selectIndex} = this;
            const {length} = chats;
            if (length > 1) {
                this.setState({select: chats[((selectIndex - 1) + length) % length]});
            } else if (length) {
                this.setState({select: chats[0]});
            }
            e.preventDefault();
        });
        hotkeys('down', 'chatsMenuSearch', e => {
            const {chats, selectIndex} = this;
            const {length} = chats;
            if (length > 1) {
                this.setState({select: chats[((selectIndex + 1) + length) % length]});
            } else if (length) {
                this.setState({select: chats[0]});
            }
            e.preventDefault();
        });
        hotkeys('enter', 'chatsMenuSearch', e => {
            const {select} = this;
            const {onRequestClearSearch, filter} = this.props;
            if (onRequestClearSearch && select) {
                window.location.hash = `#${ROUTES.chats.chat.id(select.gid, filter)}`;
                onRequestClearSearch();
            }
            e.preventDefault();
        });
        hotkeys('esc', 'chatsMenuSearch', e => {
            const {onRequestClearSearch} = this.props;
            if (onRequestClearSearch) {
                onRequestClearSearch();
            }
            e.preventDefault();
        });
    }

    /**
     * React 组件生命周期函数：`componentWillReceiveProps`
     * 在装配了的组件接收到新属性前调用。若你需要更新状态响应属性改变（例如，重置它），你可能需对比this.props和nextProps并在该方法中使用this.setState()处理状态改变。
     *
     * @param {Object} nextProps 即将更新的属性值
     * @see https://doc.react-china.org/docs/react-component.html#unsafe_componentwillreceiveprops
     * @private
     * @memberof MenuSearchList
     * @return {void}
     * @todo 考虑使用 `UNSAFE_componentWillReceiveProps` 替换 `componentWillReceiveProps`
     */
    componentWillReceiveProps(nextProps) {
        const {search} = this.props;
        if (nextProps.search !== search) {
            this.setState({select: ''});
        }
    }

    /**
     * React 组件生命周期函数：`componentWillUnmount`
     * 在组件被卸载和销毁之前立刻调用。可以在该方法里处理任何必要的清理工作，例如解绑定时器，取消网络请求，清理
    任何在componentDidMount环节创建的DOM元素。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentwillunmount
     * @private
     * @memberof MenuSearchList
     * @return {void}
     */
    componentWillUnmount() {
        hotkeys.deleteScope('chatsMenuSearch');
    }

    /**
     * 处理聊天右键菜单事件
     * @param {Event} event 事件对象
     * @memberof MenuSearchList
     * @private
     * @return {void}
     */
    handleItemContextMenu = event => {
        const chat = App.im.chats.get(event.currentTarget.attributes['data-gid'].value);
        const {filter} = this.props;
        showContextMenu('chat.menu', {
            event,
            chat,
            menuType: filter,
            viewType: ''
        });
    };

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof MenuSearchList
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            search,
            filter,
            className,
            children,
            onRequestClearSearch,
            startPageSize,
            morePageSize,
            defaultPage,
            activeChatId,
            ...other
        } = this.props;

        const chats = App.im.chats.search(search, filter);
        let {select} = this.state;
        if (!select && chats.length) {
            select = chats[0];
        }
        this.select = select;
        this.chats = chats;

        const list = chats;
        const listViews = [];
        const {page} = this.state;
        const maxIndex = page ? Math.min(list.length, startPageSize + (page > 1 ? (page - 1) * morePageSize : 0)) : list.length;
        for (let i = 0; i < maxIndex; i += 1) {
            const chat = list[i];
            const isSelected = select && chat.gid === select.gid;
            if (isSelected) {
                this.selectIndex = i;
            }
            listViews.push(<ChatListItem
                onMouseEnter={() => this.setState({select: chat})}
                onContextMenu={this.handleItemContextMenu.bind(this, chat)}
                key={chat.gid}
                data-gid={chat.gid}
                filterType={filter}
                chat={chat}
                className={classes('item', {hover: isSelected, active: activeChatId === chat.gid})}
            />);
        }
        const notShowCount = list.length - maxIndex;
        if (notShowCount) {
            listViews.push(<ListItem key="showMore" icon="chevron-double-down" className="flex-middle item muted" title={<span className="title small">{Lang.format('common.clickShowMoreFormat', notShowCount)}</span>} onClick={this.handleRequestMorePage} />);
        }

        return (
            <div className={classes('app-chats-menu-list list scroll-y', className)} {...other}>
                {listViews}
                {children}
            </div>
        );
    }
}
