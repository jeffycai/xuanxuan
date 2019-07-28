import React, {Component} from 'react';
import {rem} from '../../utils/html-helper';
import SearchControl from '../../components/search-control';
import PropTypes from 'prop-types';
import Lang from '../../core/lang';
import App from '../../core';
import ChatShareList from './chat-share-list';
import _ChatListItem from './chat-list-item';
import Messager from '../../components/messager';
import withReplaceView from '../with-replace-view';
import timeSequence from '../../utils/time-sequence';

/**
 * ChatListItem 可替换组件形式
 * @type {Class<ChatListItem>}
 * @private
 */
const ChatListItem = withReplaceView(_ChatListItem);

/**
 * ChatShare 组件 ，显示ChatShare界面
 * @class ChatShare
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example @lang jsx
 * import ChatShare from './chat-share';
 * <ChatShare />
 */
export default class ChatShare extends Component {
    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof ChatShare
     * @type {Object}
     */
    static propTypes = {
        message: PropTypes.object,
        onRequestClose: PropTypes.func,
    }

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof ChatShare
     * @static
     */
    static defaultProps = {
        message: null,
        onRequestClose: null,
    }

    /**
     * React 组件构造函数，创建一个 ChatShare 组件实例，会在装配之前被调用。
     * @see https://react.docschina.org/docs/react-component.html#constructor
     * @param {Object?} props 组件属性对象
     * @constructor
     */
    constructor(props) {
        super(props);
        this.state = {
            choosed: {},
            search: '',
        };
    }

    /**
     * 处理列表条目点击事件
     *
     * @param {Chat} chat 聊天对象
     * @return {void}
     */
    onItemClick = chat => {
        const {choosed} = this.state;
        if (choosed[chat.gid]) {
            delete choosed[chat.gid];
        } else {
            choosed[chat.gid] = chat;
        }
        this.setState({choosed});
    }

    /**
     * 处理选中区点击事件
     *
     * @param {Event} e 事件对象
     * @return {void}
     */
    handleOnItemClick = e => {
        const chat = App.im.chats.get(e.currentTarget.attributes['data-gid'].value);
        this.onItemClick(chat);
    }

    /**
     * 处理转发点击事件
     * @return {void}
     */
    handleShareBtnClick = () => {
        const {message, onRequestClose} = this.props;
        const {choosed} = this.state;
        const chats = Object.keys(choosed).map((key) => choosed[key]);
        const messagerID = `messager-${timeSequence()}`;
        App.im.server.forwardMessage(message, chats, (progress, index, total, chat) => {
            if (chats.length > 1) {
                const progressVal = Math.round(progress * 100);
                if (progressVal !== 100) {
                    Messager.show(`${Lang.string('chat.share.sending')}(${index}/${total})`, {
                        id: messagerID, autoHide: false, closeButton: false, modal: true,
                    });
                }
                if (chat && choosed[chat.gid]) {
                    delete choosed[chat.gid];
                    this.setState({choosed});
                }
            }
        }).then(() => {
            Messager.show(Lang.format('chat.share.sendSuccess', chats.length), {
                type: 'success', autoHide: 3000, id: messagerID, closeButton: true, backdrop: false, modal: false,
            });
            return onRequestClose();
        }).catch(error => {
            if (DEBUG) {
                console.warn('Forward message error', error);
            }
            Messager.hide(messagerID);
        });
    };

    /**
     * 处理搜索框变更事件
     *
     * @param {string} search 搜索字符串
     * @private
     * @memberof ChatInvite
     * @return {void}
     */
    handleSearchChange = search => {
        this.setState({search});
    };

    itemCreator = chat => {
        if (chat.gid === 'littlexx') return;
        return (
            <ChatListItem
                data-gid={chat.gid}
                key={chat.gid}
                chat={chat}
                onClick={this.handleOnItemClick}
                className="item"
                notUserLink="disabled"
                subname={false}
                badge={false}
            />
        );
    };

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ChatShare
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {choosed, search} = this.state;
        const choosedItems = Object.keys(choosed).map(App.im.chats.get);

        return (
            <div className="single row outline space app-chat-share">
                <div className="cell column single flex-none gray" style={{width: rem(200)}}>
                    <div className="has-padding-sm flex-none darken">
                        <SearchControl onSearchChange={this.handleSearchChange} />
                    </div>
                    <div className="app-chat-share-menu flex-auto scroll-y">
                        <ChatShareList
                            onItemClick={this.onItemClick}
                            eventBindObject={this}
                            search={search}
                            choosed={choosed}
                        />
                    </div>
                </div>
                <div className="cell column single flex-auto divider-left">
                    <div className="heading flex-none primary-pale">
                        <div className="title text-accent flex-auto">{Lang.string('chat.invite.choosed')} ({choosedItems.length})</div>
                        <div className="flex-none has-padding-h"><button type="button" disabled={!choosedItems.length} className="btn primary rounded btn-wide" onClick={this.handleShareBtnClick}>{Lang.string('chat.share')}</button></div>
                    </div>
                    <div className="app-chat-share-content list compact has-padding-sm">
                        {
                            choosedItems.map(this.itemCreator.bind(this))
                        }
                    </div>
                </div>
            </div>
        );
    }
}
