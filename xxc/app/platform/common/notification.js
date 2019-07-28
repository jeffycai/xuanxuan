/**
 * 创建一个桌面通知
 * @param {string} title 通知标题
 * @param {Object} options 通知选项
 * @param {function(event: Event)} onClick 通知被点击时的回调函数
 * @return {Notification} 桌面通知对象
 */
export const createNotification = (title, options, onClick) => {
    if (typeof title === 'object') {
        options = title;
        // eslint-disable-next-line prefer-destructuring
        title = options.title;
        delete options.title;
    }
    if (!onClick && options) {
        onClick = options.click;
    }
    const notification = new Notification(title, options);
    if (onClick) {
        notification.onclick = onClick;
    }
    return notification;
};

/**
 * 显示一个桌面通知
 * @param {string} title 通知标题
 * @param {Object} options 通知选项
 * @param {function(event: Event)} onClick 通知被点击时的回调函数
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const showNotification = (title, options, onClick) => {
    if (Notification.permission === 'granted') {
        return Promise.resolve(createNotification(title, options, onClick));
    }
    if (Notification.permission !== 'denied' || Notification.permission === 'default') {
        return new Promise((resolve, reject) => {
            Notification.requestPermission(permission => {
                if (permission === 'granted') {
                    resolve(createNotification(title, options, onClick));
                } else {
                    reject(new Error('denied'));
                }
            });
        });
    }
    return Promise.reject(new Error('denied'));
};

export default {
    show: showNotification
};
