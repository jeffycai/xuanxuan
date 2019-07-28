import React from 'react';
import PropTypes from 'prop-types';
import _ChatListItem from './chat-list-item';
import GroupList from '../../components/group-list';
import App from '../../core';
import withReplaceView from '../with-replace-view';
import Lang from '../../core/lang';
import Icon from '../../components/icon';
import {classes} from '../../utils/html-helper';

/**
 * ChatListItem 可替换组件形式
 * @type {Class<ChatListItem>}
 * @private
 */
const ChatListItem = withReplaceView(_ChatListItem);

export default class ChatShareList extends React.Component {
    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof ChatShareList
     * @type {Object}
     */
    static propTypes = {
        onItemClick: PropTypes.func,
        eventBindObject: PropTypes.object,
        choosed: PropTypes.object,
        search: PropTypes.string,
    }

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof ChatShareList
     * @static
     */
    static defaultProps = {
        onItemClick: null,
        eventBindObject: null,
        search: '',
        choosed: null,
    }

    /**
     * React 组件构造函数，创建一个 ChatShareList 组件实例，会在装配之前被调用。
     * @see https://react.docschina.org/docs/react-component.html#constructor
     * @param {Object?} props 组件属性对象
     * @constructor
     */
    constructor(props) {
        super(props);
        this.state = {};
    }

    /**
     * 处理列表条目点击事件
     * @memberof MemberList
     * @param {Event} e 事件对象
     * @private
     * @return {void}
     */
    handleOnItemClick = e => {
        const {onItemClick, eventBindObject} = this.props;
        if (onItemClick) {
            const chat = App.im.chats.get(e.currentTarget.attributes['data-gid'].value);
            onItemClick.call(eventBindObject, chat, e);
        }
    };

    /**
     * 渲染联系人聊天条目
     *
     * @param {Chat} chat 聊天对象
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     * @private
     * @memberof MenuContactList
     */
    itemCreator = chat => {
        if (chat.gid === 'littlexx') return;
        const {choosed} = this.props;
        return (
            <ChatListItem
                data-gid={chat.gid}
                key={chat.gid}
                chat={chat}
                onClick={this.handleOnItemClick}
                className={classes('item', {'primary-pale': choosed[chat.gid]})}
                notUserLink="disabled"
                badge={choosed[chat.gid] ? <Icon name="check" className="text-green" /> : null}
                subname={false}
            />
        );
    };

    /**
     * 检查列表条目是否为分组
     *
     * @param {Object} item 列表条目
     * @memberof MenuGroupList
     * @returns {boolean} 如果返回 `true` 则为是分组，否则为不是分组
     * @private
     */
    checkIsGroup = item => {
        return item.list && item.entityType !== 'Chat';
    };

    render() {
        const groupType = 'dept';
        const {search} = this.props;
        let shareGroupList = '';

        if (search === '') {
            const shareList = {
                contacts: {id: 'contacts', title: Lang.string('chat.share.contacts'), list: App.im.chats.getContactsChats()},
                groups: {id: 'group', title: Lang.string('chat.share.groups'), list: App.im.chats.getGroups()},
                recents: {id: 'recent', title: Lang.string('chat.share.chats'), list: App.im.chats.getRecents()},
            };
            shareGroupList = [
                <GroupList
                    key="contacts"
                    className="compact"
                    group={shareList.contacts}
                    defaultExpand={false}
                    itemCreator={this.itemCreator.bind(this)}
                    hideEmptyGroup={groupType !== 'category'}
                    showMoreText={Lang.string('common.clickShowMoreFormat')}
                />,
                <GroupList
                    key="groups"
                    className="compact"
                    group={shareList.groups}
                    defaultExpand={false}
                    itemCreator={this.itemCreator.bind(this)}
                    checkIsGroup={this.checkIsGroup}
                    showMoreText={Lang.string('common.clickShowMoreFormat')}
                />,
                <GroupList
                    key="recents"
                    className="compact"
                    group={shareList.recents}
                    itemCreator={this.itemCreator.bind(this)}
                    checkIsGroup={this.checkIsGroup}
                    showMoreText={Lang.string('common.clickShowMoreFormat')}
                />
            ];
        } else {
            const searchChats = App.im.chats.search(search);
            shareGroupList = (
                <GroupList
                    className="compact"
                    group={{list: searchChats, root: true}}
                    itemCreator={this.itemCreator.bind(this)}
                    checkIsGroup={this.checkIsGroup}
                    showMoreText={Lang.string('common.clickShowMoreFormat')}
                />
            );
        }
        return shareGroupList;
    }
}
