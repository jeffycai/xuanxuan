import network from '../common/network';

// 浏览器上下载文件直接在浏览器中打开下载地址即可
network.downloadFile = (user, file, onProgress) => {
    if (!file.url) {
        file.makeUrl(user);
    }
    return Promise.resolve(file);
};

/**
 * 备份文件上传功能
 * @private
 * @type {function}
 */
const uploadFileOrigin = network.uploadFile;

// 重构浏览器上文件上传功能
network.uploadFile = (user, file, data = {}, onProgress = null) => {
    const originFile = file.originFile;
    if (!originFile) {
        return console.warn('Upload file fail, cannot get origin file object.', file);
    }
    const serverUrl = user.uploadUrl;
    const form = new FormData();
    form.append('file', file.originData, file.name);
    form.append('userID', user.id);
    form.append('gid', file.cgid);
    file.form = form;
    return uploadFileOrigin(file, serverUrl, xhr => {
        xhr.setRequestHeader('ServerName', user.serverName);
        xhr.setRequestHeader('Authorization', user.token);
    }, onProgress);
};

export default network;
