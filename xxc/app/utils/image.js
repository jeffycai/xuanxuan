/** @module image */

/**
 * 获取图片尺寸信息
 * @param {string} imagePath 图片地址
 * @param {?Object.<string, any>} options 参数
 * @todo 使得参数可用
 * @return {Promise<{width: number, height: number}>}
 * @function
 */
export const getImageInfo = (imagePath, options = null) => {
    return new Promise((resolve, reject) => {
        options = Object.assign({
            thumbnail: {width: 50, height: 50}
        }, options);

        const img = new Image();
        img.onload = () => {
            const info = {width: img.width, height: img.height};
            if (options.thumbnail) {
                // todo: return thumbnail
            }
            resolve(info);
        };
        img.onerror = () => {
            reject();
        };
        img.src = imagePath;
    });
};

/**
 * 裁剪图片
 * @param {string} imagePath 图片地址
 * @param {{x: number, y: number, width: number, height: number}} select 裁剪区域
 * @return {Promise<{width: number, height: number, type: string, data: string}>}
 * @function
 */
export const cutImage = (imagePath, select) => {
    return new Promise((resolve, reject) => {
        let img = document.createElement('img');
        let canvas = document.createElement('canvas');
        canvas.width = select.width;
        canvas.height = select.height;

        img.onload = () => {
            let display = canvas.getContext('2d');
            display.drawImage(img, select.x, select.y, select.width, select.height, 0, 0, select.width, select.height);
            resolve({
                width: select.width, height: select.height, type: 'png', data: canvas.toDataURL('image/png'),
            });
            img = canvas = display = null;
        };

        img.onerror = () => {
            reject(new Error('Cant not get user media.'));
            img = canvas = null;
        };

        if (!imagePath.startsWith('https://') && !imagePath.startsWith('http://') && !imagePath.startsWith('file://')) {
            imagePath = `file://${imagePath}`;
        }
        img.src = imagePath;
    });
};

export default {
    getImageInfo,
    cutImage,
};
