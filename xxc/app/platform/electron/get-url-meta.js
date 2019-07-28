import cheerio from 'cheerio';
import {request, getTextFromResponse} from '../common/network';
import limitTimePromise from '../../utils/limit-time-promise';

/**
 * 网址解析类
 *
 * @export
 * @class UrlMeta
 */
export class UrlMeta {
    /**
     * 创建一个网址解析类实例
     * @param {string} url 要解析的网址
     * @memberof UrlMeta
     */
    constructor(url) {
        /**
         * 要解析的网址
         * @type {string}
         */
        this.url = url;

        /**
         * 要解析的网址实例
         * @type {URL}
         */
        this.parsedUrl = new URL(this.url);

        /**
         * 要解析的网址协议类型
         * @type {string}
         */
        this.scheme = this.parsedUrl.protocol;

        /**
         * 要解析的网址主机地址
         * @type {string}
         */
        this.host = this.parsedUrl.host;

        /**
         * 要解析的网址根地址
         * @type {string}
         */
        this.rootUrl = `${this.scheme}//${this.host}`;
    }

    /**
     * 根据给定的 Fetch 响应数据解析网址信息
     *
     * @param {Response} response Fetch 响应数据
     * @param {AbortController} controller Fetch 控制对象
     * @returns {Promise<UrlMeta, Error>} 使用 Promise 异步返回处理结果
     * @memberof UrlMeta
     */
    inspectFromResponse(response, controller) {
        this.response = response;
        const contentType = response.headers.get('content-type');
        this.contentTypeOrigin = contentType;
        if (contentType.startsWith('image')) {
            this.contentType = 'image';
            if (controller) {
                controller.abort();
            }
        } else if (contentType.startsWith('video')) {
            this.contentType = 'video';
            if (controller) {
                controller.abort();
            }
        } else if (contentType.startsWith('text')) {
            this.contentType = 'page';
            return getTextFromResponse(response).then(documentSource => {
                this.document = documentSource;
                this.parsedDocument = cheerio.load(documentSource);
                return Promise.resolve(this);
            });
        } else if (controller) {
            controller.abort();
        }
        return Promise.resolve(this);
    }

    /**
     * 获取当前网址是否是普通网页
     * @memberof GetUrlMeta
     * @type {boolean}
     */
    get isPage() {
        return this.contentType === 'page';
    }

    /**
     * 获取当前网址是否是图片
     * @memberof GetUrlMeta
     * @type {boolean}
     */
    get isImage() {
        return this.contentType === 'image';
    }

    /**
     * 获取当前网址是否是视频
     * @memberof GetUrlMeta
     * @type {boolean}
     */
    get isVideo() {
        return this.contentType === 'video';
    }

    /**
     * 获取网页标题
     * @memberof GetUrlMeta
     * @type {string}
     */
    get title() {
        if (!this.isPage) {
            return this.url;
        }
        if (this._title === undefined) {
            /**
             * 网页标题缓存
             * @type {string}
             * @private
             */
            this._title = this.parsedDocument('head > title').text() || null;
        }
        return this._title;
    }

    /**
     * 获取网页标题
     * @memberof GetUrlMeta
     * @type {string}
     */
    get ogTitle() {
        if (!this.isPage) {
            return this.url;
        }
        if (this._ogTitle === undefined) {
            /**
             * 网页标题缓存
             * @type {string}
             * @private
             */
            this._ogTitle = this.parsedDocument("meta[property='og:title']").attr('content') || null;
        }
        return this._ogTitle;
    }

    /**
     * 获取网页标题
     * @memberof GetUrlMeta
     * @type {string}
     */
    get ogDescription() {
        if (!this.isPage) {
            return '';
        }
        if (this._ogDescription === undefined) {
            /**
             * 网页标题缓存
             * @type {string}
             * @private
             */
            this._ogDescription = this.parsedDocument("meta[property='og:description']").attr('content') || null;
        }
        return this._ogDescription;
    }

    /**
     * 获取 OG 类型
     * @memberof GetUrlMeta
     * @type {string}
     */
    get ogType() {
        if (this._ogType === undefined) {
            /**
             *  OG 类型缓存
             * @type {string}
             * @private
             */
            this._ogType = this.parsedDocument("meta[property='og:type']").attr('content') || null;
        }
        return this._ogType;
    }

    /**
     * 获取网页更新时间
     * @memberof GetUrlMeta
     * @type {string}
     */
    get ogUpdatedTime() {
        if (this._ogUpdatedTime === undefined) {
            /**
             * 网页更新时间缓存
             * @type {string}
             * @private
             */
            this._ogUpdatedTime = this.parsedDocument("meta[property='og:updated_time']").attr('content') || null;
        }
        return this._ogUpdatedTime;
    }

    /**
     * 获取本地化名称
     * @memberof GetUrlMeta
     * @type {string}
     */
    get ogLocale() {
        if (this._ogLocale === undefined) {
            /**
             * 本地化名称缓存
             * @type {string}
             * @private
             */
            this._ogLocale = this.parsedDocument("meta[property='og:locale']").attr('content') || null;
        }
        return this._ogLocale;
    }

    /**
     * 获取链接
     * @memberof GetUrlMeta
     * @type {string[]}
     */
    get links() {
        if (this._links === undefined) {
            /**
             * 链接缓存
             * @type {string}
             * @private
             */
            this._links = this.parsedDocument('a').map((i, elem) => this.parsedDocument(elem).attr('href'));
        }
        return this._links;
    }

    /**
     * 获取 Meta 描述
     * @memberof GetUrlMeta
     * @type {string}
     */
    get metaDescription() {
        if (this._metaDescription === undefined) {
            /**
             * Meta 描述缓存
             * @type {string}
             * @private
             */
            this._metaDescription = this.parsedDocument("meta[name='metaDescription']").attr('content') || null;
        }
        return this._metaDescription;
    }

    /**
     * 获取次要描述
     * @memberof GetUrlMeta
     * @type {string}
     */
    get secondaryDescription() {
        if (this._secondaryDescription === undefined) {
            this._secondaryDescription = null;
            this.parsedDocument('p').each((i, elem) => {
                if (this._secondaryDescription !== undefined) {
                    return;
                }

                const text = this.parsedDocument(elem).text();

                // If we found a paragraph with more than
                if (text.length >= 120) {
                    /**
                     * 次要描述缓存
                     * @type {string}
                     * @private
                     */
                    this._secondaryDescription = text;
                }
            });
        }
        return this._secondaryDescription;
    }

    /**
     * 获取网页描述
     * @memberof GetUrlMeta
     * @type {string}
     */
    get description() {
        if (!this.isPage) {
            return '';
        }
        return this.metaDescription || this.secondaryDescription;
    }

    /**
     * 获取关键字
     * @memberof GetUrlMeta
     * @type {string[]}
     */
    get keywords() {
        if (this._keywords === undefined) {
            const keywordsString = this.parsedDocument("meta[name='keywords']").attr('content');

            if (keywordsString) {
                /**
                 * 关键字缓存
                 * @type {string}
                 * @private
                 */
                this._keywords = keywordsString.split(',');
            } else {
                this._keywords = [];
            }
        }
        return this._keywords;
    }

    /**
     * 获取作者
     * @memberof GetUrlMeta
     * @type {string}
     */
    get author() {
        if (this._author === undefined) {
            /**
             * 作者缓存
             * @type {string}
             * @private
             */
            this._author = this.parsedDocument("meta[name='author']").attr('content') || null;
        }
        return this._author;
    }

    /**
     * 获取网页编码
     * @memberof GetUrlMeta
     * @type {string}
     */
    get charset() {
        if (this._charset === undefined) {
            /**
             * 网页编码缓存
             * @type {string}
             * @private
             */
            this._charset = this.parsedDocument('meta[charset]').attr('charset') || null;
        }
        return this._charset;
    }

    /**
     * 获取图片
     * @memberof GetUrlMeta
     * @type {string}
     */
    get image() {
        if (!this.isPage) {
            return null;
        }
        if (this._image === undefined) {
            const img = this.parsedDocument("meta[property='og:image']").attr('content');
            if (img) {
                /**
                 * 图片缓存
                 * @type {string}
                 * @private
                 */
                this._image = this.getAbsolutePath(img);
            } else {
                this._image = null;
            }
        }
        return this._image;
    }

    /**
     * 获取Feeds 地址
     * @memberof GetUrlMeta
     * @type {string}
     */
    get feeds() {
        if (this._feeds === undefined) {
            /**
             * Feeds 地址缓存
             * @type {string}
             * @private
             */
            this._feeds = this.parseFeeds('rss') || this.parseFeeds('atom') || null;
        }
        return this._feeds;
    }

    /**
     * 获取 Favicons
     * @memberof GetUrlMeta
     * @type {string}
     */
    get favicons() {
        if (this._favicons === undefined) {
            /**
             * Favicons 缓存
             * @type {string}
             * @private
             */
            this._favicons = this.parseFavicons('shortcut icon').concat(
                this.parseFavicons('icon'),
                this.parseFavicons('apple-touch-icon'),
            ) || null;
        }
        return this._favicons;
    }

    /**
     * 获取首要 Favicon
     * @memberof GetUrlMeta
     * @type {string}
     */
    get favicon() {
        /**
         * 首要 Favicon 缓存
         * @type {string}
         * @private
         */
        return this.favicons[0];
    }

    /**
     * 提取 Feeds 地址
     * @param {string} format Feeds 格式
     * @private
     * @memberof UrlMeta
     * @return {string[]} Feeds 地址列表
     */
    parseFeeds(format) {
        const feeds = this.parsedDocument(`link[type='application/${format}+xml']`).map((i, elem) => this.parsedDocument(elem).attr('href'));

        return feeds;
    }

    /**
     * 获取绝对地址
     *
     * @param {string} href 路径
     * @return {string} 绝对地址
     * @memberof UrlMeta
     * @private
     */
    getAbsolutePath(href) {
        if ((/^(http:|https:)?\/\//i).test(href)) {
            return href;
        }
        if (!(/^\//).test(href)) {
            href = `/${href}`;
        }
        return this.rootUrl + href;
    }

    /**
     * 提取 Favicons 地址
     *
     * @param {string} format 格式
     * @returns {string} Favicons 地址
     * @memberof UrlMeta
     * @private
     */
    parseFavicons(format) {
        if (format === 'favicon.ico') {
            return [{
                href: this.getAbsolutePath('favicon.ico'),
                sizes: '',
            }];
        }
        if (!this.isPage) {
            return [];
        }
        const favicons = this.parsedDocument(`link[rel='${format}']`).map((i, elem) => {
            const href = this.parsedDocument(elem).attr('href');
            const sizes = this.parsedDocument(elem).attr('sizes');
            return {
                href: this.getAbsolutePath(href),
                sizes: sizes || ''
            };
        });

        return [].slice.call(favicons);
    }
}

/**
 * 解析网页地址所指向的页面信息
 * @param {string} url 网页地址
 * @return {UrlMeta} 页面信息
 */
export default (url) => {
    const controller = new AbortController();
    return limitTimePromise(request(url, {signal: controller.signal}), 5000).then(response => new UrlMeta(url).inspectFromResponse(response, controller));
};
