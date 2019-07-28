import limitTimePromise from '../../utils/limit-time-promise';

/**
 * 默认超时时间，单位毫秒
 * @type {number}
 */
const TIMEOUT_DEFAULT = 15 * 1000;

/**
 * 使用 fetch API 发起 HTTP 请求
 * @param {String} url 请求地址
 * @param {Object} options 请求选项
 * @param {String} options.method 请求使用的方法，如 GET、POST
 * @param {Headers|Map<String, any>} options.headers  请求的头信息，形式为 Headers 的对象或包含 ByteString 值的对象字面量。
 * @param {String|Blob|BufferSource|FormData|URLSearchParams} options.body  请求的 body 信息：可能是一个 Blob、BufferSource、FormData、URLSearchParams 或者 USVString 对象。注意 GET 或 HEAD 方法的请求不能包含 body 信息。
mode: 请求的模式，如 cors、 no-cors 或者 same-origin。
 * @param {String} options.credentials  请求的 credentials，如 omit、same-origin 或者 include。为了在当前域名内自动发送 cookie ， 必须提供这个选项， 从 Chrome 50 开始， 这个属性也可以接受 FederatedCredential 实例或是一个 PasswordCredential 实例。
 * @param {String} options.cache   请求的 cache 模式: default 、 no-store 、 reload 、 no-cache 、 force-cache 或者 only-if-cached 。
 * @param {String} options.redirect  可用的 redirect 模式: follow (自动重定向), error (如果产生重定向将自动终止并且抛出一个错误), 或者 manual (手动处理重定向). 在Chrome中，Chrome 47之前的默认值是 follow，从 Chrome 47开始是 manual。
 * @param {String} options.referrer  一个 USVString 可以是 no-referrer、client或一个 URL。默认是 client。
 * @param {String} options.referrerPolicy  Specifies the value of the referer HTTP header. May be one of no-referrer、 no-referrer-when-downgrade、 origin、 origin-when-cross-origin、 unsafe-url 。
 * @param {String} options.integrity  包括请求的  subresource integrity 值 （ 例如： sha256-BpfBw7ivV8q2jLiT13fxDYAe2tJllusRSZ273h2nFSE=）。
 * @returns {Promise<Response, error>} 使用 Promise 异步返回处理结果
 */
export const request = (url, options) => (new Promise((resolve, reject) => {
    window.fetch(url, options).then(response => {
        if (response.ok) {
            if (DEBUG) {
                console.collapse(`HTTP ${(options && options.method) || 'GET'}`, 'blueBg', url, 'bluePale', 'OK', 'greenPale');
                console.log('options', options);
                console.log('response', response);
                console.log('body', response.body);
                console.groupEnd();
            }
            resolve(response);
        } else {
            const error = new Error(response.statusMessage || `Status code is ${response.status}.`);
            error.code = response.status === 401 ? 'STATUS_401' : (response.statusMessage || 'WRONG_STATUS');
            if (DEBUG) {
                console.collapse(`HTTP ${(options && options.method) || 'GET'}`, 'blueBg', url, 'bluePale', error.code || 'ERROR', 'redPale');
                console.log('options', options);
                console.log('error', error);
                console.log('response', response);
                console.groupEnd();
            }
            reject(error);
        }
        return response;
    }).catch(error => {
        error.code = 'WRONG_CONNECT';
        if (DEBUG) {
            console.collapse(`HTTP ${(options && options.method) || 'GET'}`, 'blueBg', url, 'bluePale', error.code || 'ERROR', 'redPale');
            console.log('options', options);
            console.log('error', error);
            console.groupEnd();
        }
        reject(error);
    });
}));

/**
 * 从 [Response](https://developer.mozilla.org/zh-CN/docs/Web/API/Response) 对象获取纯文本
 * @param {Response} response Response 对象
 * @returns {Promise<String, error>} 使用 Promise 异步返回处理结果
 */
export const getTextFromResponse = response => {
    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.toLowerCase().includes('charset=gb')) {
        return response.blob().then(blob => (new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                resolve(reader.result);
            };
            reader.onerror = reject;
            reader.readAsText(blob, 'GBK');
        })));
    }
    return response.text();
};

/**
 * 发起一个 POST 请求，并且将请求返回的结果当作纯文本处理
 * @param {String} url 请求地址
 * @param {Object} options 请求选项
 * @param {String} options.method 请求使用的方法，如 GET、POST
 * @param {Headers|Map<String, any>} options.headers  请求的头信息，形式为 Headers 的对象或包含 ByteString 值的对象字面量。
 * @param {String|Blob|BufferSource|FormData|URLSearchParams} options.body  请求的 body 信息：可能是一个 Blob、BufferSource、FormData、URLSearchParams 或者 USVString 对象。注意 GET 或 HEAD 方法的请求不能包含 body 信息。
mode: 请求的模式，如 cors、 no-cors 或者 same-origin。
 * @param {String} options.credentials  请求的 credentials，如 omit、same-origin 或者 include。为了在当前域名内自动发送 cookie ， 必须提供这个选项， 从 Chrome 50 开始， 这个属性也可以接受 FederatedCredential 实例或是一个 PasswordCredential 实例。
 * @param {String} options.cache   请求的 cache 模式: default 、 no-store 、 reload 、 no-cache 、 force-cache 或者 only-if-cached 。
 * @param {String} options.redirect  可用的 redirect 模式: follow (自动重定向), error (如果产生重定向将自动终止并且抛出一个错误), 或者 manual (手动处理重定向). 在Chrome中，Chrome 47之前的默认值是 follow，从 Chrome 47开始是 manual。
 * @param {String} options.referrer  一个 USVString 可以是 no-referrer、client或一个 URL。默认是 client。
 * @param {String} options.referrerPolicy  Specifies the value of the referer HTTP header. May be one of no-referrer、 no-referrer-when-downgrade、 origin、 origin-when-cross-origin、 unsafe-url 。
 * @param {String} options.integrity  包括请求的  subresource integrity 值 （ 例如： sha256-BpfBw7ivV8q2jLiT13fxDYAe2tJllusRSZ273h2nFSE=）。
 * @returns {Promise<String, error>} 使用 Promise 异步返回处理结果
 */
export const getText = (url, options) => (request(url, options).then(getTextFromResponse));

/**
 * 发起一个 POST 请求，并且将请求返回的结果当作纯文本处理
 * @param {String} url 请求地址
 * @param {Object} options 请求选项
 * @param {String} options.method 请求使用的方法，如 GET、POST
 * @param {Headers|Map<String, any>} options.headers  请求的头信息，形式为 Headers 的对象或包含 ByteString 值的对象字面量。
 * @param {String|Blob|BufferSource|FormData|URLSearchParams} options.body  请求的 body 信息：可能是一个 Blob、BufferSource、FormData、URLSearchParams 或者 USVString 对象。注意 GET 或 HEAD 方法的请求不能包含 body 信息。
mode: 请求的模式，如 cors、 no-cors 或者 same-origin。
 * @param {String} options.credentials  请求的 credentials，如 omit、same-origin 或者 include。为了在当前域名内自动发送 cookie ， 必须提供这个选项， 从 Chrome 50 开始， 这个属性也可以接受 FederatedCredential 实例或是一个 PasswordCredential 实例。
 * @param {String} options.cache   请求的 cache 模式: default 、 no-store 、 reload 、 no-cache 、 force-cache 或者 only-if-cached 。
 * @param {String} options.redirect  可用的 redirect 模式: follow (自动重定向), error (如果产生重定向将自动终止并且抛出一个错误), 或者 manual (手动处理重定向). 在Chrome中，Chrome 47之前的默认值是 follow，从 Chrome 47开始是 manual。
 * @param {String} options.referrer  一个 USVString 可以是 no-referrer、client或一个 URL。默认是 client。
 * @param {String} options.referrerPolicy  Specifies the value of the referer HTTP header. May be one of no-referrer、 no-referrer-when-downgrade、 origin、 origin-when-cross-origin、 unsafe-url 。
 * @param {String} options.integrity  包括请求的  subresource integrity 值 （ 例如： sha256-BpfBw7ivV8q2jLiT13fxDYAe2tJllusRSZ273h2nFSE=）。
 * @returns {Promise<String, error>} 使用 Promise 异步返回处理结果
 */
export const postText = async (url, options) => {
    if (options instanceof FormData) {
        options = {body: options};
    }
    const response = await request(url, Object.assign({method: 'POST'}, options));
    return response.text();
};

/**
 * 发起一个 GET 请求，并将请求结果视为 JSON 处理
 * @param {String} url 请求地址
 * @param {Object} options 请求选项
 * @param {String} options.method 请求使用的方法，如 GET、POST
 * @param {Headers|Map<String, any>} options.headers  请求的头信息，形式为 Headers 的对象或包含 ByteString 值的对象字面量。
 * @param {String|Blob|BufferSource|FormData|URLSearchParams} options.body  请求的 body 信息：可能是一个 Blob、BufferSource、FormData、URLSearchParams 或者 USVString 对象。注意 GET 或 HEAD 方法的请求不能包含 body 信息。
mode: 请求的模式，如 cors、 no-cors 或者 same-origin。
 * @param {String} options.credentials  请求的 credentials，如 omit、same-origin 或者 include。为了在当前域名内自动发送 cookie ， 必须提供这个选项， 从 Chrome 50 开始， 这个属性也可以接受 FederatedCredential 实例或是一个 PasswordCredential 实例。
 * @param {String} options.cache   请求的 cache 模式: default 、 no-store 、 reload 、 no-cache 、 force-cache 或者 only-if-cached 。
 * @param {String} options.redirect  可用的 redirect 模式: follow (自动重定向), error (如果产生重定向将自动终止并且抛出一个错误), 或者 manual (手动处理重定向). 在Chrome中，Chrome 47之前的默认值是 follow，从 Chrome 47开始是 manual。
 * @param {String} options.referrer  一个 USVString 可以是 no-referrer、client或一个 URL。默认是 client。
 * @param {String} options.referrerPolicy  Specifies the value of the referer HTTP header. May be one of no-referrer、 no-referrer-when-downgrade、 origin、 origin-when-cross-origin、 unsafe-url 。
 * @param {String} options.integrity  包括请求的  subresource integrity 值 （ 例如： sha256-BpfBw7ivV8q2jLiT13fxDYAe2tJllusRSZ273h2nFSE=）。
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const getJSON = (url, options) => request(url, options).then(response => response.json());

/**
 * 发起一个 POST 请求，并将请求结果视为 JSON 处理
 * @param {String} url 请求地址
 * @param {Object} options 请求选项
 * @param {String} options.method 请求使用的方法，如 GET、POST
 * @param {Headers|Map<String, any>} options.headers  请求的头信息，形式为 Headers 的对象或包含 ByteString 值的对象字面量。
 * @param {String|Blob|BufferSource|FormData|URLSearchParams} options.body  请求的 body 信息：可能是一个 Blob、BufferSource、FormData、URLSearchParams 或者 USVString 对象。注意 GET 或 HEAD 方法的请求不能包含 body 信息。
mode: 请求的模式，如 cors、 no-cors 或者 same-origin。
 * @param {String} options.credentials  请求的 credentials，如 omit、same-origin 或者 include。为了在当前域名内自动发送 cookie ， 必须提供这个选项， 从 Chrome 50 开始， 这个属性也可以接受 FederatedCredential 实例或是一个 PasswordCredential 实例。
 * @param {String} options.cache   请求的 cache 模式: default 、 no-store 、 reload 、 no-cache 、 force-cache 或者 only-if-cached 。
 * @param {String} options.redirect  可用的 redirect 模式: follow (自动重定向), error (如果产生重定向将自动终止并且抛出一个错误), 或者 manual (手动处理重定向). 在Chrome中，Chrome 47之前的默认值是 follow，从 Chrome 47开始是 manual。
 * @param {String} options.referrer  一个 USVString 可以是 no-referrer、client或一个 URL。默认是 client。
 * @param {String} options.referrerPolicy  Specifies the value of the referer HTTP header. May be one of no-referrer、 no-referrer-when-downgrade、 origin、 origin-when-cross-origin、 unsafe-url 。
 * @param {String} options.integrity  包括请求的  subresource integrity 值 （ 例如： sha256-BpfBw7ivV8q2jLiT13fxDYAe2tJllusRSZ273h2nFSE=）。
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const postJSON = async (url, options) => {
    if (options instanceof FormData) {
        options = {body: options};
    }
    const response = await request(url, Object.assign({method: 'POST'}, options));
    return response.json();
};

/**
 * 发起一个 GET 请求，并将请求结果视为 JSON 特殊对象处理，并且根据特殊对象上的 `status` 或 `result` 属性来判断是否请求成功，如果 `status` 或 `result` 属性为 `'ok'`、`'success'` 或 `200` 则表示请求成功
 * @param {String} url 请求地址
 * @param {Object} options 请求选项
 * @param {String} options.method 请求使用的方法，如 GET、POST
 * @param {Headers|Map<String, any>} options.headers  请求的头信息，形式为 Headers 的对象或包含 ByteString 值的对象字面量。
 * @param {String|Blob|BufferSource|FormData|URLSearchParams} options.body  请求的 body 信息：可能是一个 Blob、BufferSource、FormData、URLSearchParams 或者 USVString 对象。注意 GET 或 HEAD 方法的请求不能包含 body 信息。
mode: 请求的模式，如 cors、 no-cors 或者 same-origin。
 * @param {String} options.credentials  请求的 credentials，如 omit、same-origin 或者 include。为了在当前域名内自动发送 cookie ， 必须提供这个选项， 从 Chrome 50 开始， 这个属性也可以接受 FederatedCredential 实例或是一个 PasswordCredential 实例。
 * @param {String} options.cache   请求的 cache 模式: default 、 no-store 、 reload 、 no-cache 、 force-cache 或者 only-if-cached 。
 * @param {String} options.redirect  可用的 redirect 模式: follow (自动重定向), error (如果产生重定向将自动终止并且抛出一个错误), 或者 manual (手动处理重定向). 在Chrome中，Chrome 47之前的默认值是 follow，从 Chrome 47开始是 manual。
 * @param {String} options.referrer  一个 USVString 可以是 no-referrer、client或一个 URL。默认是 client。
 * @param {String} options.referrerPolicy  Specifies the value of the referer HTTP header. May be one of no-referrer、 no-referrer-when-downgrade、 origin、 origin-when-cross-origin、 unsafe-url 。
 * @param {String} options.integrity  包括请求的  subresource integrity 值 （ 例如： sha256-BpfBw7ivV8q2jLiT13fxDYAe2tJllusRSZ273h2nFSE=）。
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const getJSONData = async (url, options) => {
    const json = await getJSON(url, options);
    if (json) {
        const jsonResult = json.status || json.result;
        if (jsonResult === 'success' || jsonResult === 'ok' || jsonResult === 200) {
            return Promise.resolve(json.data);
        }
        const error = new Error(json.message || json.reason || `The server data result is ${jsonResult}`);
        error.code = 'WRONG_RESULT';
        return Promise.reject(error);
    }
    const error = new Error('Server return a null json.');
    error.code = 'WRONG_DATA';
    return Promise.reject(error);
};

/**
 * 发起一个 POST 请求，并将请求结果视为 JSON 特殊对象处理，并且根据特殊对象上的 `status` 或 `result` 属性来判断是否请求成功，如果 `status` 或 `result` 属性为 `'ok'`、`'success'` 或 `200` 则表示请求成功
 * @param {String} url 请求地址
 * @param {Object} options 请求选项
 * @param {String} options.method 请求使用的方法，如 GET、POST
 * @param {Headers|Map<String, any>} options.headers  请求的头信息，形式为 Headers 的对象或包含 ByteString 值的对象字面量。
 * @param {String|Blob|BufferSource|FormData|URLSearchParams} options.body  请求的 body 信息：可能是一个 Blob、BufferSource、FormData、URLSearchParams 或者 USVString 对象。注意 GET 或 HEAD 方法的请求不能包含 body 信息。
mode: 请求的模式，如 cors、 no-cors 或者 same-origin。
 * @param {String} options.credentials  请求的 credentials，如 omit、same-origin 或者 include。为了在当前域名内自动发送 cookie ， 必须提供这个选项， 从 Chrome 50 开始， 这个属性也可以接受 FederatedCredential 实例或是一个 PasswordCredential 实例。
 * @param {String} options.cache   请求的 cache 模式: default 、 no-store 、 reload 、 no-cache 、 force-cache 或者 only-if-cached 。
 * @param {String} options.redirect  可用的 redirect 模式: follow (自动重定向), error (如果产生重定向将自动终止并且抛出一个错误), 或者 manual (手动处理重定向). 在Chrome中，Chrome 47之前的默认值是 follow，从 Chrome 47开始是 manual。
 * @param {String} options.referrer  一个 USVString 可以是 no-referrer、client或一个 URL。默认是 client。
 * @param {String} options.referrerPolicy  Specifies the value of the referer HTTP header. May be one of no-referrer、 no-referrer-when-downgrade、 origin、 origin-when-cross-origin、 unsafe-url 。
 * @param {String} options.integrity  包括请求的  subresource integrity 值 （ 例如： sha256-BpfBw7ivV8q2jLiT13fxDYAe2tJllusRSZ273h2nFSE=）。
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const postJSONData = (url, options) => {
    if (options instanceof FormData) {
        options = {body: options};
    }
    return getJSONData(url, Object.assign({
        method: 'POST',
    }, options));
};

/**
 * 下载文件
 * @param {String} url 下载地址
 * @param {function(xhr: XMLHttpRequest)} beforeSend 上传之前的回调函数
 * @param {function(progress: number)} onProgress 上传进度变更的回调函数
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const downloadFile = (url, beforeSend, onProgress) => (new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
        if (xhr.status === 200) {
            const arrayBuffer = xhr.response;
            if (arrayBuffer) {
                resolve(arrayBuffer);
            } else {
                let error = new Error('File data is empty.');
                error = 'EMPTY_FILE_DATA';
                reject(error);
            }
        } else {
            let error = new Error('Status code is not 200.');
            error = 'WRONG_STATUS';
            reject(error);
        }
    };
    xhr.onProgress = e => {
        if (e.lengthComputable && onProgress) {
            onProgress((100 * e.loaded) / e.total);
        }
    };
    xhr.onerror = e => {
        const error = new Error('Download request error.');
        error.event = e;
        error.code = 'WRONG_CONNECT';
        reject(error);
    };
    xhr.onabort = e => {
        const error = new Error('Download request abort.');
        error.event = e;
        error.code = 'CONNECT_ABORT';
        reject(error);
    };

    xhr.open('GET', url);
    xhr.responseType = 'arraybuffer';
    if (beforeSend) {
        beforeSend(xhr);
    }
    xhr.send();
}));

/**
 * 上传文件到服务器
 * @param {FileData} file 要上传的文件对象
 * @param {String} serverUrl 上传的地址
 * @param {function(xhr: XMLHttpRequest)} beforeSend 上传之前的回调函数
 * @param {function(progress: number)} onProgress 上传进度变更的回调函数
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const uploadFile = (file, serverUrl, beforeSend = null, onProgress = null) => (new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
        if (xhr.status === 200) {
            const bodyText = xhr.responseText;
            try {
                const json = JSON.parse(bodyText);
                if (json.result === 'success' && json.data) {
                    resolve(json.data);
                } else {
                    const error = new Error(`The server returned wrong result: ${xhr.responseText}`);
                    error.code = 'WRONG_RESULT';
                    reject(error);
                }
            } catch (err) {
                if (bodyText.indexOf('user-deny-attach-upload') > 0) {
                    const error = new Error('Server denied the request.');
                    error.code = 'USER_DENY_ATTACT_UPLOAD';
                    reject(error);
                } else {
                    const error = new Error(`Unknown data content: ${bodyText}`);
                    error.code = 'WRONG_DATA';
                    reject(error);
                }
            }
        } else {
            let error = new Error('Status code is not 200.');
            error = 'WRONG_STATUS';
            reject(error);
        }
    };
    xhr.upload.onprogress = e => {
        if (e.lengthComputable && onProgress) {
            onProgress((100 * e.loaded) / e.total);
        }
    };
    xhr.onerror = e => {
        const error = new Error('Upload request error.');
        error.event = e;
        error.code = 'WRONG_CONNECT';
        reject(error);
    };
    xhr.onabort = e => {
        const error = new Error('Upload request abort.');
        error.event = e;
        error.code = 'CONNECT_ABORT';
        reject(error);
    };

    xhr.open('POST', serverUrl);
    xhr.setRequestHeader('X-FILENAME', encodeURIComponent(file.name));
    if (beforeSend) {
        beforeSend(xhr);
    }
    xhr.send(file.form || file);
}));

/**
 * 创建一个超时即失败的 Promise
 * @param {Promise<any>} promise Promise 对象
 * @param {number} time 超时时间，单位毫秒
 * @param {String} errorText 超时时的错误文本
 * @returns {Promise} 返回一个新的 Promise
 */
export const timeout = (promise, time = TIMEOUT_DEFAULT, errorText = 'timeout') => limitTimePromise(promise, time, errorText);

export default {
    request,
    getText,
    postText,
    getJSON,
    postJSON,
    getJSONData,
    postJSONData,
    downloadFile,
    uploadFile,
    timeout,
};
