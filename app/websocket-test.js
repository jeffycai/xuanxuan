import WebSocket           from 'ws';
import SocketMessage       from './models/socket-message';

let ws = null;

const sendMessage = (message, callback) => {
    if(ws) {
        let msgStr = '';
        if(message instanceof SocketMessage) {
            msgStr = message.json;
        } else if(typeof message === 'object') {
            msgStr = new SocketMessage(message).json;
        } else {
            msgStr = message;
        }
        ws.send(msgStr, () => {
            callback && callback();
            console.log('WS send', msgStr);
        });
        return 'WS try send message...';
    } else {
        return 'cannot send message, ws is not connect.';
    }
};

const login = (server, account, password, callback) => {
    if(ws) {
        sendMessage({
            'module': 'chat',
            'method': 'login',
            'params': [
                server || '',
                account,
                password,
                'online'
            ]
        }, () => {
            callback && callback();
            console.log('login request finish.');
        });
        return 'WS try login...';
    } else {
        return 'login failed, ws is not connect.';
    }
};

const connect = (address, callback) => {
    ws = new WebSocket(address, {
        perMessageDeflate: false
    });

    ws.on('open', () => {
        callback && callback();
        console.log('WS connect success to', address);
    });

    ws.on('message', (data, flags) => {
        console.log('WS receive', {data, flags});
    });

    ws.on('close', (code, reson) => {
        ws = null;
        console.log('WS closed', code, reson);
    });

    ws.on('error', (error) => {
        ws = null;
        console.error('WS error', error);
    });

    ws.on('unexpected-response', (request, response) => {
        ws = null;
        console.error('WS unexpected-response', request, response);
    });

    global.ws = ws;

    return 'WS try connect ' + address;
};

global.WS = {
    $: ws, connect, login, sendMessage,
    isConnect: () => {return !!ws;}
};

export {ws, connect, login, sendMessage};
export default ws;
