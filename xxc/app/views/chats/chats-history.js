import React, {Component} from 'react';
import PropTypes from 'prop-types';
import HTML from '../../utils/html-helper';
import Icon from '../../components/icon';
import Avatar from '../../components/avatar';
import SearchControl from '../../components/search-control';
import SelectBox from '../../components/select-box';
import Lang from '../../core/lang';
import App from '../../core';
import _ChatListItem from './chat-list-item';
import _ChatHistory from './chat-history';
import _ChatSearchResult from './chat-search-result';
import {getTimeBeforeDesc} from '../../utils/date-helper';
import ListItem from '../../components/list-item';
import Config from '../../config';
import withReplaceView from '../with-replace-view';

/**
 * ChatSearchResult 可替换组件形式
 * @type {Class<ChatSearchResult>}
 * @private
 */
const ChatSearchResult = withReplaceView(_ChatSearchResult);

/**
 * ChatListItem 可替换组件形式
 * @type {Class<ChatListItem>}
 * @private
 */
const ChatListItem = withReplaceView(_ChatListItem);

/**
 * ChatHistory 可替换组件形式
 * @type {Class<ChatHistory>}
 * @private
 */
const ChatHistory = withReplaceView(_ChatHistory);

/**
 * ChatsHistory 组件 ，显示聊天历史记录界面
 * @class ChatsHistory
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import ChatsHistory from './chats-history';
 * <ChatsHistory />
 */
export default class ChatsHistory extends Component {
    /**
     * ChatsHistory 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof ChatsHistory
     */
    static replaceViewPath = 'chats/ChatsHistory';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof ChatsHistory
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
        chat: PropTypes.object,
        children: PropTypes.any,
        startPageSize: PropTypes.number,
        morePageSize: PropTypes.number,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof ChatsHistory
     * @static
     */
    static defaultProps = {
        className: null,
        chat: null,
        children: null,
        startPageSize: Config.ui['page.start.size'] || 20,
        morePageSize: Config.ui['page.more.size'] || 20,
    };

    /**
     * React 组件构造函数，创建一个 ChatsHistory 组件实例，会在装配之前被调用。
     * @see https://react.docschina.org/docs/react-component.html#constructor
     * @param {Object?} props 组件属性对象
     * @constructor
     */
    constructor(props) {
        super(props);

        const {chat} = props;

        /**
         * 搜索聊天类型
         * @type {{name: string, chats: Chat[]}[]}
         * @private
         */
        this.chats = [
            {name: 'contacts', chats: App.im.chats.getContactsChats()},
            {name: 'groups', chats: App.im.chats.getGroups()}
        ];

        /**
         * 搜索过滤聊天时间范围
         * @type {string}
         * @private
         */
        this.searchFilterTime = 'oneMonth';

        /**
         * 搜索过滤聊天类型
         * @type {string}
         * @private
         */
        this.searchFilterType = 'choosed';

        /**
         * React 组件状态对象
         * @see https://react.docschina.org/docs/state-and-lifecycle.html
         * @type {object}
         */
        this.state = {
            isFetching: false,
            choosed: chat,
            search: '',
            searchFilterType: this.searchFilterType,
            searchFilterTime: this.searchFilterTime,
            searching: false,
            searchingChat: null,
            searchTip: '',
            searchResult: null,
            searchResultTotal: 0,
            searchProgress: 0,
            expanded: chat ? {contacts: chat.isOne2One, groups: chat.isGroupOrSystem} : {contacts: true, groups: false},
            chats: this.chats,
            messageGoto: null,
            groupPage: {contacts: 1, groups: 1}
        };
    }

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof ChatsHistory
     * @return {void}
     */
    componentDidMount() {
        const updateFetchingMessage = (pager) => {
            const message = `${Lang.string('chats.history.fetchingMessages')} ${Math.floor(pager.percent || 0)}%`;
            this.setState({isFetching: true, message});
        };
        this.handleHistoryStart = App.im.server.onChatHistoryStart(updateFetchingMessage);
        this.handleHistoryEnd = App.im.server.onChatHistoryEnd(() => {
            this.setState({isFetching: false, message: ''});
        });
        this.handleHistory = App.im.server.onChatHistory(updateFetchingMessage);
    }

    /**
     * React 组件生命周期函数：`componentWillUnmount`
     * 在组件被卸载和销毁之前立刻调用。可以在该方法里处理任何必要的清理工作，例如解绑定时器，取消网络请求，清理
    任何在componentDidMount环节创建的DOM元素。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentwillunmount
     * @private
     * @memberof ChatsHistory
     * @return {void}
     */
    componentWillUnmount() {
        App.events.off(this.handleHistoryStart, this.handleHistoryEnd, this.handleHistory);
    }

    /**
     * 处理分组标题点击事件
     * @param {string} name 分组标题
     * @memberof ChatsHistory
     * @private
     * @return {void}
     */
    handleGroupHeaderClick(name) {
        const {expanded} = this.state;
        expanded[name] = !expanded[name];
        this.setState({expanded});
    }

    /**
     * 处理聊天条目点击事件
     * @param {Chat} chat 聊天对象
     * @memberof ChatsHistory
     * @private
     * @return {void}
     */
    handleChatItemClick(chat) {
        this.setState({choosed: chat}, () => {
            if (this.state.search) {
                this.startSearch();
            }
        });
    }

    /**
     * 处理点击获取所有历史记录按钮事件
     * @param {Event} e 事件对象
     * @memberof ChatsHistory
     * @private
     * @return {void}
     */
    handleFetchAllBtnClick = e => {
        App.ui.showContextMenu({x: e.clientX, y: e.clientY, target: e.target}, [
            {label: Lang.string('chats.history.selectFetchTime'), disabled: true},
            {label: `${Lang.string('time.oneWeek')} (${Lang.string('chats.history.sync.fast')})`, data: 'oneWeek'},
            {label: Lang.string('time.oneMonth'), data: 'oneMonth'},
            {label: Lang.string('time.halfYear'), data: 'halfYear'},
            {label: Lang.string('time.oneYear'), data: 'oneYear'},
            {label: Lang.string('time.twoYear'), data: 'twoYear'},
            {label: `${Lang.string('time.all')} (${Lang.string('chats.history.sync.slow')})`, data: 'all'},
        ], {
            onItemClick: (item) => {
                if (item.data) {
                    const startDate = item.data === 'all' ? 0 : getTimeBeforeDesc(item.data);
                    App.im.server.fetchChatsHistory('all', startDate);
                }
            }
        });
    }

    /**
     * 处理搜索关键字变更事件
     * @param {string} search 搜索字符串
     * @memberof ChatsHistory
     * @private
     * @return {void}
     */
    handleSearchChange = search => {
        this.setState({search});
        this.startSearch();
    }

    /**
     * 处理聊天类型变更事件
     * @param {string} searchFilterType 聊天类型
     * @memberof ChatsHistory
     * @private
     * @return {void}
     */
    handleSearchFilterTypeChange = searchFilterType => {
        this.setState({searchFilterType});
        this.searchFilterType = searchFilterType;
        this.startSearch();
    }

    /**
     * 处理聊天时间范围值变更事件
     * @param {string} searchFilterTime 聊天时间范围
     * @memberof ChatsHistory
     * @private
     * @return {void}
     */
    handleSearchFilterTimeChange = searchFilterTime => {
        this.setState({searchFilterTime});
        this.searchFilterTime = searchFilterTime;
        this.startSearch();
    }

    /**
     * 处理跳转到指定消息事件
     * @param {ChatMessage} messageGoto 要跳转的消息
     * @memberof ChatsHistory
     * @private
     * @return {void}
     */
    handleRequestGoto = messageGoto => {
        this.setState({messageGoto: messageGoto && {
            time: new Date().getTime(),
            gid: messageGoto.gid,
            cgid: messageGoto.cgid,
            id: messageGoto.id,
        }});
    }

    /**
     * 开始搜索
     *
     * @memberof ChatsHistory
     * @return {void}
     */
    startSearch() {
        if (!this.searchControl.isEmpty()) {
            const search = this.searchControl.getValue();
            const {searchFilterType, searchFilterTime} = this;
            const searchId = [search, searchFilterTime, searchFilterType === 'choosed' ? this.state.choosed.gid : searchFilterType].join('|');
            if (this.lastSearchId !== searchId) {
                this.lastSearchId = searchId;
                if (this.searchTask) {
                    this.searchTask.cancel();
                }
                let chats = null;
                switch (searchFilterType) {
                case 'choosed':
                    chats = [this.state.choosed];
                    break;
                case 'contacts':
                    chats = this.chats[0].chats;
                    break;
                case 'groups':
                    chats = this.chats[1].chats;
                    break;
                default:
                    chats = [];
                    chats.push(...this.chats[0].chats);
                    chats.push(...this.chats[1].chats);
                }
                this.searchTask = App.im.chats.createCountMessagesTask(chats, search, searchFilterTime);
                this.setState({
                    groupPage: {contacts: 1, groups: 1},
                    searchResult: {},
                    searchResultTotal: 0,
                    searchTip: Lang.string('chats.history.searching'),
                    searching: true,
                    searchProgress: 0,
                    expanded: {
                        contacts: !searchFilterType || searchFilterType === 'contacts' || (searchFilterType === 'choosed' && this.state.choosed.isOne2One),
                        groups: !searchFilterType || searchFilterType === 'groups' || (searchFilterType === 'choosed' && this.state.choosed.isGroupOrSystem),
                    },
                });
                this.searchTask.onTask = (result, searchProgress) => {
                    let {searchResult, searchResultTotal} = this.state;
                    searchResult = Object.assign(searchResult || {}, {
                        [result.gid]: result.count
                    });
                    searchResultTotal += result.count;
                    this.setState({searchResult, searchResultTotal, searchProgress});
                };
                this.searchTask.onTaskStart = (task, searchProgress) => {
                    this.setState({
                        searchingChat: task.chat,
                        searchProgress,
                        searchTip: Lang.format('chats.history.searching.format', task.chat.getDisplayName(App))
                    });
                };
                this.searchTask.run().then(() => {
                    this.setState({
                        searchTip: Lang.format('chats.history.search.result.format', this.state.searchResultTotal),
                        searching: false,
                        searchProgress: 1,
                        searchingChat: null
                    });
                }).catch(error => {
                    if (error !== 'canceled') {
                        this.setState({
                            searchTip: Lang.error(error),
                            searching: false,
                            searchProgress: 1,
                            searchingChat: null,
                            gotoMessage: null
                        });
                    }
                });
            }
        } else {
            this.lastSearchId = '';
            if (this.searchTask) {
                this.searchTask.cancel();
                this.searchTask = null;
            }
            this.setState({
                search: '',
                searchTip: '',
                searching: false,
                searchProgress: 0,
                searchResult: null,
                searchingChat: null,
                gotoMessage: null
            });
        }
    }

    /**
     * 处理显示请求下一页事件
     *
     * @param {string} group 分组名称
     * @memberof ChatsHistory
     * @return {void}
     * @private
     */
    handleRequestMorePage(group) {
        const {groupPage} = this.state;
        groupPage[group] += 1;
        this.setState({groupPage});
    }

    /**
     * 渲染聊天分组
     *
     * @param {{name: string, chats: Chat[]}} group 分组
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     * @memberof ChatsHistory
     */
    renderChatsGroup(group) {
        const {searchResult, searchFilterType} = this.state;
        if (searchResult && searchFilterType && searchFilterType !== group.name && searchFilterType !== 'choosed') {
            return null;
        }
        const isExpanded = this.state.expanded[group.name];
        const chats = group.chats;
        if (searchResult && searchFilterType !== 'choosed') {
            chats.sort((chat1, chat2) => {
                let result = (searchResult[chat2.gid] || 0) - (searchResult[chat1.gid] || 0);
                if (result === 0) {
                    result = chat2.id - chat1.id;
                }
                return result;
            });
        }
        const itemsArray = [];
        chats.forEach(chat => {
            if (searchResult && searchResult[chat.gid] === 0 && searchFilterType !== 'choosed') {
                return null;
            }
            itemsArray.push(chat);
        });

        const {startPageSize, morePageSize} = this.props;
        const listViews = [];
        const page = this.state.groupPage[group.name];
        const maxIndex = page ? Math.min(itemsArray.length, startPageSize + (page > 1 ? (page - 1) * morePageSize : 0)) : itemsArray.length;
        for (let i = 0; i < maxIndex; i += 1) {
            const item = itemsArray[i];
            listViews.push(this.renderChatItem(item));
        }
        const notShowCount = itemsArray.length - maxIndex;
        if (notShowCount) {
            listViews.push(<ListItem key="showMore" icon="chevron-double-down" className="flex-middle item muted" title={<span className="title small">{Lang.format('common.clickShowMoreFormat', notShowCount)}</span>} onClick={this.handleRequestMorePage.bind(this, group.name)} />);
        }

        return (<div key={group.name} className="app-chats-history-menu-group">
            <a className="heading" onClick={this.handleGroupHeaderClick.bind(this, group.name)}>
                <Avatar className="text-primary" icon={isExpanded ? 'menu-down' : 'menu-right'} />
                <div className="text-primary">{Lang.string(`chats.history.group.${group.name}`)} ({itemsArray.length})</div>
            </a>
            {isExpanded && <div className="app-chats-history-menu-list list compact">{listViews}</div>}
        </div>);
    }

    /**
     * 渲染聊天条目
     *
     * @param {Chat} chat 聊天对象
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     * @memberof ChatsHistory
     */
    renderChatItem(chat) {
        const {searchResult, searchFilterType} = this.state;
        const isChoosed = this.state.choosed && this.state.choosed.gid === chat.gid;
        let badge = null;
        if (searchResult) {
            if (searchResult[chat.gid] === 0 && !isChoosed) {
                return null;
            }
            if (this.state.searchingChat && this.state.searchingChat.gid === chat.gid) {
                badge = <Icon name="loading" square className="spin-fast muted inline-block" />;
            } else if (searchResult[chat.gid]) {
                badge = <div className="label circle secondary label-sm">{searchResult[chat.gid]}</div>;
            } else if (searchFilterType === 'choosed' && isChoosed) {
                badge = <div className="label circle important label-sm">0</div>;
            }
        }
        return (<ChatListItem
            key={chat.gid}
            badge={badge}
            notUserLink="disabled"
            className={isChoosed ? 'item white text-primary' : 'item'}
            onClick={this.handleChatItemClick.bind(this, chat)}
            chat={chat}
        />);
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ChatsHistory
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            chat,
            className,
            children,
            startPageSize,
            morePageSize,
            ...other
        } = this.props;

        const searchTimeOptions = [
            {label: Lang.string('time.oneWeek'), value: 'oneWeek'},
            {label: Lang.string('time.oneMonth'), value: 'oneMonth'},
            {label: Lang.string('time.threeMonth'), value: 'threeMonth'},
            {label: Lang.string('time.halfYear'), value: 'halfYear'},
            {label: Lang.string('time.oneYear'), value: 'oneYear'},
            {label: Lang.string('time.all'), value: ''},
        ];
        const searchTypeOptions = [
            {label: Lang.string('chats.history.search.type.choosed'), value: 'choosed'},
            {label: Lang.string('chats.history.search.type.contacts'), value: 'contacts'},
            {label: Lang.string('chats.history.search.type.groups'), value: 'groups'},
            {label: Lang.string('chats.history.search.type.all'), value: ''},
        ];

        return (<div
            {...other}
            className={HTML.classes('app-chats-history dock column single', className)}
        >
            <div className="app-chats-history-header heading flex-none row single">
                <div className="flex-none title">{Lang.string('chats.history.title')}</div>
                <div className="flex-auto search-control row flex-middle">
                    <SearchControl
                        disabled={this.state.isFetching}
                        ref={e => {this.searchControl = e;}}
                        changeDelay={500}
                        onSearchChange={this.handleSearchChange}
                        placeholder={Lang.string('chats.history.search.placeholder')}
                    >
                        <SelectBox value={this.state.searchFilterTime} onChange={this.handleSearchFilterTimeChange} options={searchTimeOptions} className="search-box-time dock dock-right small" />
                        <SelectBox value={this.state.searchFilterType} onChange={this.handleSearchFilterTypeChange} options={searchTypeOptions} className="search-box-type dock dock-right small" />
                    </SearchControl>
                    {this.state.isFetching ? null : <div className="search-control-tip">
                        <small className="muted">{this.state.searchTip}</small>
                        <div className="progress"><div className="bar" style={{width: `${this.state.searchProgress * 100}%`}} /></div>
                    </div>}
                </div>
                <nav style={{overflow: 'visible'}} className="flex-none nav hint--bottom" data-hint={Lang.string('chats.history.fetchAllFromServer')}>
                    {
                        this.state.isFetching ? <a>
                            <Icon name="sync spin" /> &nbsp; <small>{this.state.message}</small>
                        </a> : <a onClick={this.handleFetchAllBtnClick} className={HTML.classes('text-primary', {disabled: this.state.searching})}><Icon name="cloud-sync" /> &nbsp; <small>{Lang.string('chats.history.fetchAll')}</small></a>
                    }
                </nav>
            </div>
            <div className="app-chats-history-content flex-auto row single">
                <div className="app-chats-history-menu primary-pale scroll-y flex-none">
                    {
                        this.state.chats.map(this.renderChatsGroup.bind(this))
                    }
                </div>
                {
                    this.state.choosed ? <div className="row single flex-auto">
                        <ChatSearchResult
                            className={HTML.classes('flex-none', {empty: !this.state.searchResult || !this.state.searchResult[this.state.choosed.gid]})}
                            chat={this.state.choosed}
                            searchKeys={this.state.search}
                            searchFilterTime={this.state.searchFilterTime}
                            searchCount={this.state.searchResult && this.state.searchResult[this.state.choosed.gid]}
                            requestGoto={this.handleRequestGoto}
                        />
                        <ChatHistory searchKeys={this.state.search} gotoMessage={(this.state.searchResult && this.state.searchResult[this.state.choosed.gid] && this.state.messageGoto && this.state.messageGoto.cgid === this.state.choosed.gid) ? this.state.messageGoto : null} className="flex-auto white" chat={this.state.choosed} />
                    </div> : <div className="flex-auto center-content muted"><div>{Lang.string('chats.history.selectChatTip')}</div></div>
                }
            </div>
            {children}
        </div>);
    }
}
