import RecordRTC from 'recordrtc';
import {
    desktopCapturer, screen as Screen, remote as Remote, clipboard,
} from 'electron';
import ui from './ui';
import {saveImage, createFromPath} from './image';
import env from './env';
import RemoteEvents, {ipcOnce} from './remote';

/* This is NEEDED because RecordRTC is badly written */
global.html2canvas = (canvas, obj) => {
    obj.onrendered(canvas);
};

/**
 * 保存上次获取的媒体流数据
 * @type {MediaStream}
 * @private
 */
let lastSteam = null;

/**
 * 停止媒体流
 * @private
 * @return {void}
 */
const stopStream = () => {
    if (lastSteam) {
        lastSteam.stop();
        lastSteam = null;
    }
};

/**
 * 获取媒体流
 * @param {number} sourceId 媒体 ID
 * @private
 * @returns {Promise<MediaStream>} 使用 Promise 异步返回处理结果
 */
const getStream = sourceId => {
    return new Promise((resolve, reject) => {
        stopStream();
        desktopCapturer.getSources({types: ['screen']}, (error, sources) => {
            if (error) {
                reject(error);
                return;
            }

            const display = getDisplay(sourceId);
            const displayIndex = Screen.getAllDisplays().findIndex(item => item.id === sourceId);

            const mediaConfig = {
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: sources[displayIndex].id,
                        maxWidth: display.size.width,
                        maxHeight: display.size.height,
                        minWidth: display.size.width,
                        minHeight: display.size.height
                    }
                }
            };

            navigator.webkitGetUserMedia(mediaConfig, stream => {
                lastSteam = stream;
                resolve(stream);
            }, reject);
        });
    });
};

/**
 * 获取视频流
 * @param {MediaStream} stream 媒体流
 * @private
 * @returns {Promise<HTMLVideoElement>} 使用 Promise 异步返回处理结果
 */
const getVideo = stream => {
    return new Promise(resolve => {
        const video = document.createElement('video');
        video.autoplay = true;
        video.src = URL.createObjectURL(stream);
        video.addEventListener('playing', () => {
            resolve(video);
        });
    });
};

/**
 * 创建 Canvas 元素
 * @param {number} width Canvas 宽度
 * @param {number} height Canvas 高度
 * @return {HTMLCanvasElement} Canvas 元素
 * @private
 */
const getCanvas = (width, height) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
};

/**
 * 在 Canvas 上绘制视频帧
 * @param {{ctx: CanvasRenderingContext2D, video: HTMLVideoElement, x: number, y: number, width: number, height: number, availTop: number}} param0 帧参数
 * @return {void}
 */
const drawFrame = ({
    ctx, video, x, y, width, height,
}) => {
    ctx.drawImage(video, x, y, width, height, 0, 0, width, height);
};

/**
 * 获取 Canvas 元素上的图像
 * @param {HTMLCanvasElement} canvas Canvas 元素
 * @return {string} 以 DataUrl 格式返回图片内容
 */
const getFrameImage = canvas => {
    return canvas.toDataURL();
};

/**
 * 获取媒体 Display 信息
 * @param {number} id 媒体 ID
 * @return {Electron.Display} Electron Display 对象
 */
const getDisplay = id => {
    if (id) {
        return Screen.getAllDisplays().find(item => item.id === id);
    }
    return Screen.getPrimaryDisplay();
};

/**
 * 获取帧循环函数
 * @param {function} fn 回调函数
 * @return {function} 帧循环函数
 */
const getLoop = fn => {
    let requestId;
    const callFn = () => {
        requestId = requestAnimationFrame(callFn);
        fn();
    };
    callFn();
    return () => {
        cancelAnimationFrame(requestId);
    };
};

/**
 * 开始录屏
 * @param {{canvas: HTMLCanvasElement, video: HTMLVideoElement, x: number, y: number, width: number, height: number, availTop: number}} param0 帧参数
 * @return {{stop: function, pause: function, resume: function}} 录屏操作对象
 */
const startRecording = ({
    canvas, video, x, y, width, height, availTop
}) => {
    const recorder = RecordRTC(canvas, {type: 'canvas'});
    const ctx = canvas.getContext('2d');
    const stopLoop = getLoop(() => drawFrame({
        ctx, video, x, y, width, height, availTop
    }));

    recorder.startRecording();

    return {
        stop() {
            return new Promise(resolve => {
                stopLoop();
                recorder.stopRecording(() => {
                    recorder.getDataURL(url => resolve({url, width, height}));
                });
            });
        },
        pause() {
            recorder.pauseRecording();
        },
        resume() {
            recorder.resumeRecording();
        }
    };
};

/**
 * 获取指定媒体屏幕快照
 * @param {{x: number, y: number, width: number, height: number, sourceId: number}} param0 快照参数
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const takeScreenshot = ({
    x = 0, y = 0, width = 0, height = 0, sourceId = 0
}) => {
    const display = getDisplay(sourceId);
    const availTop = window.screen.availTop - display.bounds.y;
    sourceId = display.id;

    if (!width) {
        // eslint-disable-next-line prefer-destructuring
        width = display.bounds.width;
    }
    if (!height) {
        // eslint-disable-next-line prefer-destructuring
        height = display.bounds.height;
    }

    return getStream(sourceId)
        .then(getVideo)
        .then(video => {
            const canvas = getCanvas(width, height);
            const ctx = canvas.getContext('2d');
            drawFrame({
                ctx, video, x, y, width, height, availTop,
            });
            stopStream();
            return getFrameImage(canvas);
        }).catch(error => {
            stopStream();
            return Promise.reject(error);
        });
};

/**
 * 获取所有媒体屏幕快照
 * @param {{x: number, y: number, width: number, height: number, sourceId: number}[]} options 快照参数
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const takeAllScreenshots = (options) => {
    if (!options) {
        options = Screen.getAllDisplays().map(item => {
            return {
                x: 0,
                y: 0,
                width: item.bounds.width,
                height: item.bounds.height,
                sourceId: item.id
            };
        });
    }
    if (Array.isArray(options)) {
        return Promise.all(options.map(option => {
            return takeScreenshot(option);
        }));
    }
    return takeScreenshot(options);
};

/**
 * 获取指定媒体屏幕视频
 * @param {{x: number, y: number, width: number, height: number, sourceId: number}} param0 屏幕视频参数
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const captureVideo = ({
    x, y, width, height, sourceId
}) => {
    const display = getDisplay(sourceId);
    const availTop = window.screen.availTop - display.bounds.y;
    sourceId = display.id;
    return getStream(sourceId)
        .then(getVideo)
        .then(video => {
            const canvas = getCanvas(width, height);
            return startRecording({
                canvas, video, x, y, width, height, availTop
            });
        });
};

/**
 * 获取屏幕快照并保存为图片
 * @param {{x: number, y: number, width: number, height: number, sourceId: number}} options 屏幕快照参数
 * @param {string} filePath 图片保存路径
 * @param {boolean} hideCurrentWindow 是否隐藏当前窗口
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const saveScreenshotImage = (options, filePath, hideCurrentWindow) => {
    if (!options) {
        options = {};
    }
    if (!filePath) {
        filePath = ui.makeTmpFilePath('.png');
    }
    const processImage = base64Image => {
        if (hideCurrentWindow) {
            ui.browserWindow.show();
        }
        return saveImage(base64Image, filePath);
    };
    if (hideCurrentWindow && ui.browserWindow.isVisible()) {
        if (env.isWindowsOS) {
            const hideWindowTask = () => {
                ui.browserWindow.hide();
                return new Promise((resolve, reject) => {
                    setTimeout(resolve, 600);
                });
            };
            return hideWindowTask().then(() => {
                return takeScreenshot(options);
            }).then(processImage);
        }
        ui.browserWindow.hide();
    }
    return takeScreenshot(options).then(processImage);
};

/**
 * 打开截图窗口
 * @param {{path: string}|FileData} file 快照图片对象
 * @param {Electron.Display} display Electron Display 对象
 * @param {function} onClosed 窗口关闭时的回调函数
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const openCaptureScreenWindow = (file, display, onClosed) => {
    return new Promise((resolve, reject) => {
        const bounds = {
            x: display ? display.bounds.x : 0,
            y: display ? display.bounds.y : 0,
            width: display ? display.bounds.width : window.screen.width,
            height: display ? display.bounds.height : window.screen.height,
        };
        const captureWindow = new Remote.BrowserWindow({
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
            minWidth: bounds.width,
            minHeight: bounds.height,
            alwaysOnTop: !DEBUG,
            autoHideMenuBar: true,
            fullscreen: true,
            frame: false,
            show: false,
            movable: false,
            thickFrame: false,
            titleBarStyle: 'hidden',
            resizable: false,
            skipTaskbar: true,
        });
        if (DEBUG) {
            captureWindow.openDevTools();
        }
        captureWindow.loadURL(`file://${ui.appRoot}/index.html?fromWindow=${ui.browserWindowName}#image-cutter/${encodeURIComponent(file.path)}`);
        captureWindow.webContents.on('did-finish-load', () => {
            captureWindow.setBounds(bounds);
            captureWindow.show();
            captureWindow.focus();
            resolve(captureWindow);
        });
        if (onClosed) {
            captureWindow.on('closed', onClosed);
        }
    });
};

/**
 * 存储当前是否正在截屏中
 * @type {boolean}
 * @private
 */
let isCapturing = false;

/**
 * 获取屏幕快照并进行截图操作
 * @param {number|string} [screenSources=0] 如果为 `0` 或 `'all'` 则为所有屏幕截图，否则指定一个屏幕媒体 ID 针对指定的屏幕进行截图
 * @param {boolean} [hideCurrentWindow=false] 获取屏幕快照时是否隐藏当前窗口
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const captureAndCutScreenImage = (screenSources = 0, hideCurrentWindow = false) => {
    if (isCapturing) {
        return Promise.reject(new Error('The capture window is already opened.'));
    }
    isCapturing = true;
    if (!screenSources || screenSources === 'all') {
        const displays = Screen.getAllDisplays();
        screenSources = displays.map(display => {
            display.sourceId = display.id;
            return display;
        });
    }
    if (!Array.isArray(screenSources)) {
        screenSources = [screenSources];
    }
    hideCurrentWindow = hideCurrentWindow && ui.browserWindow.isVisible();
    return new Promise((resolve, reject) => {
        const captureScreenWindows = [];
        const eventId = ipcOnce(RemoteEvents.EVENT.capture_screen, (e, image) => {
            if (captureScreenWindows) {
                captureScreenWindows.forEach(captureWindow => {
                    captureWindow.close();
                });
            }
            if (hideCurrentWindow) {
                ui.browserWindow.show();
                ui.browserWindow.focus();
            }
            if (image) {
                const filePath = ui.makeTmpFilePath('.png');
                saveImage(image.data, filePath).then(savedImage => {
                    if (savedImage && savedImage.path) {
                        clipboard.writeImage(createFromPath(savedImage.path));
                    }

                    resolve(savedImage);
                    return savedImage;
                }).catch(reject);
            } else if (DEBUG) {
                console.log('No capture image.');
            }
            isCapturing = false;
        });
        const onWindowClosed = () => {
            RemoteEvents.off(eventId);
            isCapturing = false;
        };
        const takeScreenshots = () => {
            return Promise.all(screenSources.map(screenSource => {
                return saveScreenshotImage(screenSource, '').then(file => {
                    return openCaptureScreenWindow(file, screenSource, onWindowClosed).then(captureWindow => {
                        captureScreenWindows.push(captureWindow);
                        return Promise.resolve();
                    });
                });
            }));
        };
        if (hideCurrentWindow) {
            ui.browserWindow.hide();
            setTimeout(() => {
                takeScreenshots();
            }, env.isWindowsOS ? 600 : 0);
        } else {
            takeScreenshots();
        }
    });
};

export default {
    takeScreenshot,
    captureVideo,
    takeAllScreenshots,
    saveScreenshotImage,
    captureAndCutScreenImage
};
