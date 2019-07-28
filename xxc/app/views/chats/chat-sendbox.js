import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../../utils/html-helper';
import {getKeyDecoration} from '../../utils/shortcut';
import Emojione from '../../components/emojione';
import Lang from '../../core/lang';
import App from '../../core';
import _DraftEditor from '../common/draft-editor';
import _ChatSendboxToolbar from './chat-sendbox-toolbar';
import MessagesPreivewDialog from './messages-preview-dialog';
import withReplaceView from '../with-replace-view';

/**
 * DraftEditor 可替换组件形式
 * @type {Class<ChatSendboxToolbar>}
 * @private
 */
const DraftEditor = withReplaceView(_DraftEditor);

/**
 * ChatSendboxToolbar 可替换组件形式
 * @type {Class<ChatSendboxToolbar>}
 * @private
 */
const ChatSendboxToolbar = withReplaceView(_ChatSendboxToolbar);

/**
 * ChatSendbox 组件 ，显示一个聊天发送框
 * @class ChatSendbox
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import ChatSendbox from './chat-sendbox';
 * <ChatSendbox />
 */
export default class ChatSendbox extends Component {
    /**
     * ChatSendbox 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof ChatSendbox
     */
    static replaceViewPath = 'chats/ChatSendbox';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof ChatSendbox
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
        chat: PropTypes.object,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof ChatSendbox
     * @static
     */
    static defaultProps = {
        className: null,
        chat: null,
    };

    /**
     * React 组件构造函数，创建一个 ChatSendbox 组件实例，会在装配之前被调用。
     * @see https://react.docschina.org/docs/react-component.html#constructor
     * @param {Object?} props 组件属性对象
     * @constructor
     */
    constructor(props) {
        super(props);
        this.state = {
            sendButtonDisabled: true
        };
    }

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof ChatSendbox
     * @return {void}
     */
    componentDidMount() {
        this.onSendContentToChatHandler = App.im.ui.onSendContentToChat(this.props.chat.gid, content => {
            if (content.clear) {
                this.clearContent();
            }
            if (content && content.content) {
                switch (content.type) {
                case 'image':
                    this.editbox.appendImage(content.content);
                    break;
                default:
                    this.editbox.appendContent(content.content);
                }
            }
            this.focusEditor();
        });

        this.onChatActiveHandler = App.im.ui.onActiveChat(chat => {
            const {chat: thisChat} = this.props;
            if (chat.gid === thisChat.gid) {
                this.focusEditor();
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
     * @memberof ChatSendbox
     * @return {void}
     */
    componentWillUnmount() {
        App.events.off(this.onSendContentToChatHandler, this.onChatActiveHandler);
    }

    /**
     * 向聊天发送框添加图片
     *
     * @param {FileList|Object|Object[]} images 要添加的图片
     * @memberof ChatSendbox
     * @return {void}
     */
    appendImages(images) {
        if (images instanceof FileList) {
            const files = images;
            images = [];
            for (let i = 0; i < files.length; ++i) {
                images.push(files[i]);
            }
        }
        if (!Array.isArray(images)) {
            images = [images];
        }
        images.forEach(image => {
            this.editbox.appendImage(image);
        });
        this.focusEditor();
    }

    /**
     * 清空聊天发送框内的内容
     * @memberof ChatSendbox
     * @return {void}
     */
    clearContent() {
        this.editbox.clearContent();
        this.setState({sendButtonDisabled: true});
    }

    /**
     * 激活发送框编辑器
     *
     * @memberof ChatSendbox
     * @return {void}
     */
    focusEditor() {
        this.editbox.focus();
    }

    /**
     * 处理发送按钮点击事件
     * @memberof ChatSendbox
     * @private
     * @return {void}
     */
    handleSendButtonClick = async () => {
        const {sendButtonDisabled} = this.state;
        if (sendButtonDisabled) {
            return;
        }

        const contentList = this.editbox.getContentList();
        this.clearContent();
        this.focusEditor();
        const {chat} = this.props;
        for (let i = 0; i < contentList.length; ++i) {
            const content = contentList[i];
            if (content.type === 'text') {
                content.content = Emojione.toShort(content.content);
                const trimContent = App.profile.userConfig.sendHDEmoticon ? content.content.trim() : false;
                if (trimContent && Emojione.emojioneList[trimContent]) {
                    await App.im.server.sendEmojiMessage(trimContent, chat); // eslint-disable-line
                } else {
                    await App.im.server.sendTextMessage(content.content, chat); // eslint-disable-line
                }
            } else if (content.type === 'image') {
                await App.im.server.sendImageMessage(content.image, chat); // eslint-disable-line
            }
        }
        App.im.ui.activeChat(chat, 'recents');
    }

    /**
     * 处理文本输入事件
     * @param {Object} contentState DraftJS 内容状态对象
     * @memberof ChatSendbox
     * @private
     * @return {void}
     */
    handleOnChange = (contentState) => {
        this.setState({sendButtonDisabled: !contentState.hasText()});
    }

    /**
     * 处理按下回车键事件
     * @param {Event} e 事件对象
     * @memberof ChatSendbox
     * @private
     * @return {void}
     */
    handleOnReturnKeyDown = e => {
        const keyDecoration = getKeyDecoration(e);
        if (keyDecoration === App.profile.userConfig.sendMessageHotkey) {
            if (!this.state.sendButtonDisabled) {
                setTimeout(() => {
                    this.handleSendButtonClick();
                }, 10);
            }
            e.preventDefault();
            return 'handled';
        }
        return 'not-handled';
    }

    /**
     * 处理点击预览按钮事件
     * @param {Event} e 事件对象
     * @memberof ChatSendbox
     * @private
     * @return {void}
     */
    handlePreviewBtnClick = e => {
        const {sendButtonDisabled} = this.state;
        if (sendButtonDisabled) {
            return;
        }

        const messages = [];
        const {chat} = this.props;
        this.editbox.getContentList().forEach(content => {
            if (content.type === 'text') {
                content.content = Emojione.toShort(content.content);
                const trimContent = App.profile.userConfig.sendHDEmoticon ? content.content.trim() : false;
                if (trimContent && Emojione.emojioneList[trimContent]) {
                    messages.push(App.im.server.createEmojiChatMessage(trimContent, chat));
                } else {
                    messages.push(App.im.server.createTextChatMessage(content.content, chat));
                }
            } else if (content.type === 'image') {
                messages.push(App.im.server.createTextChatMessage(`![preview-image](${content.image.url || content.image.path})`, chat));
            }
        });
        MessagesPreivewDialog.show(messages, {onHidden: () => {
            this.focusEditor();
        }});
    };

    /**
     * 处理获得焦点事件
     * @param {Event} e 事件对象
     * @memberof ChatSendbox
     * @private
     * @return {void}
     */
    handleOnFocus = e => {
        const {chat} = this.props;
        const {editbox} = this;
        App.im.ui.emitChatSendboxFocus(chat, editbox.getContent());
    };

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ChatSendbox
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            chat,
            className,
            ...other
        } = this.props;

        let placeholder = null;
        if (chat.isOne2One) {
            const theOtherOne = chat.getTheOtherOne(App);
            if (theOtherOne && theOtherOne.isOffline) {
                placeholder = Lang.format('chat.sendbox.placeholder.memberIsOffline', theOtherOne.displayName);
            }
        }
        placeholder = placeholder || `${Lang.string('chat.sendbox.placeholder.sendMessage')}${App.profile.userConfig.sendMarkdown ? ' (Markdown)' : ''}`;
        const {userConfig} = App.profile;

        return (<div
            {...other}
            className={classes('app-chat-sendbox', className)}
        >
            <DraftEditor
                className="app-chat-drafteditor white dock-top has-padding scroll-y"
                ref={e => {this.editbox = e;}}
                placeholder={placeholder}
                onChange={this.handleOnChange}
                onReturnKeyDown={this.handleOnReturnKeyDown}
                onFocus={this.handleOnFocus}
            />
            <ChatSendboxToolbar className="dock-bottom" chatGid={chat.gid} userConfigChangeTime={userConfig && userConfig.lastChangeTime} sendButtonDisabled={this.state.sendButtonDisabled} onSendButtonClick={this.handleSendButtonClick} onPreviewButtonClick={this.handlePreviewBtnClick} />
        </div>);
    }
}
