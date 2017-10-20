import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import HTML from '../../utils/html-helper';
import Icon from '../../components/icon';
import Lang from '../../lang';
import App from '../../core';
import DraftEditor from '../common/draft-editor';
import Emojione from '../../components/emojione';
import MessagesPreivewDialog from './messages-preview-dialog';

class ChatSendbox extends Component {

    constructor(props) {
        super(props);
        this.state = {
            sendButtonDisabled: true
        };
    }

    appendImages(images) {
        if(images instanceof FileList) {
            let files = images;
            images = [];
            for(let i = 0; i < files.length; ++i) {
                images.push(files[i]);
            }
        }
        if(!Array.isArray(images)) {
            images = [images];
        }
        images.forEach(image => {
            this.editbox.appendImage(image);
        });
        this.editbox.focus();
    }

    clearContent() {
        this.editbox.clearContent();
        this.setState({sendButtonDisabled: true})
    }

    focusEditor() {
        this.editbox.focus();
    }

    handleSendButtonClick = () => {
        if(this.state.sendButtonDisabled) {
            return;
        }
        this.editbox.getContentList().forEach(content => {
            if(content.type === 'text') {
                content.content = Emojione.toShort(content.content);
                let trimContent = App.profile.userConfig.sendHDEmoticon ? content.content.trim() : false;
                if(trimContent && Emojione.emojioneList[trimContent]) {
                    App.im.server.sendEmojiMessage(trimContent, this.props.chat);
                } else {
                    App.im.server.sendTextMessage(content.content, this.props.chat);
                }
            } else if(content.type === 'image') {
                App.im.server.sendImageMessage(content.image, this.props.chat);
            }
        });

        this.clearContent();
        this.focusEditor();
    }

    handleOnChange = (contentState) => {
        this.setState({sendButtonDisabled: !contentState.hasText()});
    }

    handleOnReturnKeyDown = e => {
        if(!e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
            if(!this.state.sendButtonDisabled) {
                setTimeout(() => {
                    this.handleSendButtonClick();
                }, 10);
            }
            e.preventDefault();
            return 'handled';
        }
        return 'not-handled';
    }

    componentWillUnmount() {
        App.events.off(this.onSendContentToChatHandler);
    }

    componentDidMount() {
        this.onSendContentToChatHandler = App.im.ui.onSendContentToChat(this.props.chat.gid, content => {
            switch(content.type) {
                case 'image':
                    this.editbox.appendImage(content.content);
                    break;
                default:
                    this.editbox.appendContent(content.content);
            }
            this.editbox.focus();
        });
    }

    handlePreviewBtnClick = e => {
        if(this.state.sendButtonDisabled) {
            return;
        }

        const messages = [];
        const {chat} = this.props;
        this.editbox.getContentList().forEach(content => {
            if(content.type === 'text') {
                content.content = Emojione.toShort(content.content);
                let trimContent = App.profile.userConfig.sendHDEmoticon ? content.content.trim() : false;
                if(trimContent && Emojione.emojioneList[trimContent]) {
                    messages.push(App.im.server.createEmojiChatMessage(trimContent, chat));
                } else {
                    messages.push(App.im.server.createTextChatMessage(content.content, chat));
                }
            } else if(content.type === 'image') {
                messages.push(App.im.server.createTextChatMessage(`![preview-image](${content.image.url || content.image.path})`, chat));
            }
        });
        MessagesPreivewDialog.show(messages, {onHidden: () => {
            this.editbox.focus();
        }});
    }

    render() {
        let {
            chat,
            className,
            style,
            children,
            ...other
        } = this.props;

        let placeholder = null;
        if(chat.isOne2One) {
            const theOtherOne = chat.getTheOtherOne(App);
            if(theOtherOne && theOtherOne.isOffline) {
                placeholder = Lang.format('chat.sendbox.placeholder.memberIsOffline', theOtherOne.displayName);
            }
        }
        placeholder = placeholder || Lang.string('chat.sendbox.placeholder.sendMessage');

        return <div {...other}
            className={HTML.classes('app-chat-sendbox', className)}
        >
            <DraftEditor className="app-chat-drafteditor dock-top box scroll-y"
                ref={e => {this.editbox = e;}}
                placeholder={placeholder}
                onChange={this.handleOnChange}
                onReturnKeyDown={this.handleOnReturnKeyDown}
            />
            <div className="dock-bottom app-chat-sendbox-toolbar flex">
                <div className="toolbar flex flex-middle flex-auto">
                    {
                        App.im.ui.createSendboxToolbarItems(chat, App.profile.userConfig).map(item => {
                            return <div key={item.id} className="hint--top has-padding-sm" data-hint={item.label} onContextMenu={item.contextMenu} onClick={item.click}><button className="btn iconbutton rounded" type="button"><Icon name={item.icon}/></button></div>
                        })
                    }
                    <div className="hint--top has-padding-sm" data-hint={Lang.string('chat.sendbox.toolbar.previewDraft')} onClick={this.handlePreviewBtnClick}><button disabled={this.state.sendButtonDisabled} className="btn iconbutton rounded" type="button"><Icon name="file-document-box"/></button></div>
                </div>
                <div className="toolbar flex flex-none flex-middle">
                    <div className="hint--top-left has-padding-sm" data-hint={Lang.string('chat.sendbox.toolbar.send') + ' (Enter)'} onClick={this.handleSendButtonClick}>
                        <button className={HTML.classes('btn iconbutton rounded', {
                            "disabled": this.state.sendButtonDisabled,
                            "text-primary": !this.state.sendButtonDisabled
                        })} type="button"><Icon className="icon-2x" name="keyboard-return"/></button>
                    </div>
                </div>
            </div>
        </div>;
    }
}

export default ChatSendbox;
