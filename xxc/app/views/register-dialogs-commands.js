import {showChatCodeDialog} from './chats/chat-send-code-dialog';
import {showChatShareDialog} from './chats/chat-share-dialog';
import {registerCommand} from '../core/commander';
import {getChat} from '../core/im/im-chats';
import {getCurrentActiveChatGID} from '../core/im/im-ui';

export default () => {
    registerCommand('showChatSendCodeDialog', (context, chat) => {
        chat = chat || context.chat || getCurrentActiveChatGID(); // eslint-disable-line
        if (typeof chat === 'string') {
            chat = getChat(chat);
        }
        if (!chat) {
            return;
        }
        showChatCodeDialog(chat);
    });

    registerCommand('showChatShareDialog', (context) => {
        const {message} = context;
        showChatShareDialog(message);
    });
};
