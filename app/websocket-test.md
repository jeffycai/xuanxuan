# Websocket 测试

无加密。

启动喧喧，打开控制台之后，你可以在控制台获取 `WS` 对象，该对象上有如下方法来测试 web socket 链接：

## `WS.connect(address, callback)`

连接到 websocket 服务器，各参数如下：

* `address`：websocket 地址，例如：`"ws://echo.websocket.org"`;
* `callback`：连接成功后到回调函数，可选。

例子：

```js
WS.connect('ws://echo.websocket.org', function() {
    console.log('已连接到 ws://echo.websocket.org');
});
```

## `WS.login(server, account, password, callback)`

使用当前已连接到 websocket 服务器发送喧喧到登录请求消息。参数说明：

* `server`：要登录到然之服务器名称；
* `account`：用户名；
* `password`：密码；
* `callback`：登录请求发送完毕后到回调函数（此时登录不一地成功）。

例子：

```js
WS.login('ranzhi', 'admin', '123456', function() {
    console.log('已发送登录请求');
});
```

## `WS.sendMessage(message, callback)`

向当前已连接到 websocket 服务器发送消息。参数说明：

* `message`：要发送到消息，开源为字符串或者 `object` 类型（实际发送时会转换为 json 字符串）；
* `callback`：登录请求发送完毕后到回调函数。

例子：

```js
WS.sendMessage('hello', function() {
    console.log('已向服务器发送 hello');
});

var data = {
    "module": "chat",
    "method": "getList",
    params: []
};
WS.sendMessage(data, function() {
    console.log('已向服务器发送 data 对象');
});
```

## `WS.$`

获取当前已连接到 websocket 对象实例。对象实例用法参考：https://github.com/websockets/ws/blob/master/doc/ws.md

## 其他

当服务器收到消息时或者连接断开会在控制台打印消息
