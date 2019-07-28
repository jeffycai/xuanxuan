import UUID from 'uuid';
import md5 from 'md5';
import Entity from './entity';
import Member from './member';
import {matchScore} from '../../utils/search-score';
import {createDate} from '../../utils/date-helper';

/**
 * 将 data uri 数据转换为 Blob 对象
 * @param {string} dataURI data uri 格式数据
 * @return {Blob} Blob 对象
 */
export const dataURItoBlob = (dataURI) => {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs
    const byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to an ArrayBuffer
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    // write the ArrayBuffer to a blob, and you're done
    const bb = new Blob([ab], {type: mimeString});
    return bb;
};

/**
 * 搜索匹配分值表
 * @type {Object[]}
 * @private
 */
const MATCH_SCORE_MAP = [
    {name: 'name', equal: 100, include: 50},
    {name: 'category', equal: 100, prefix: ':'},
    {name: 'cgid', equal: 100, prefix: '#'},
    {name: 'senderId', equal: 100, prefix: '@'},
    {name: 'extName', equal: 100, prefix: '.'},
];

/**
 * 文件类型表
 * @type {Object[]}
 * @private
 */
const CATEGORIES = [
    {name: 'doc', like: new Set(['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'key', 'page', 'number', 'pdf', 'txt', 'md', 'rtf', 'wps', 'html', 'htm', 'chtml', 'epub', ''])},
    {name: 'image', like: new Set(['jpg', 'jpeg', 'sketch', 'psd', 'png', 'gif', 'tiff', 'ico', 'icns', 'svg'])},
    {name: 'program', like: new Set(['js', 'exe', 'app', 'dmg', 'msi', 'bat', 'sh'])}
];

/**
 * 文件数据类
 *
 * @export
 * @class FileData
 * @extends {Entity}
 */
export default class FileData extends Entity {
    /**
     * 文件类型表
     * @type {Object[]}
     */
    static CATEGORIES = CATEGORIES;

    /**
     * 实体名称
     * @type {string}
     */
    static NAME = 'FileData';

    /**
     * 数据库存储实体属性结构管理器
     *
     * @type {EntitySchema}
     * @static
     * @memberof FileData
     */
    static SCHEMA = Entity.SCHEMA.extend({
        cgid: {type: 'string', indexed: true},
        senderId: {type: 'int', indexed: true},
        size: {type: 'int', indexed: true},
        width: {type: 'int', indexed: false},
        height: {type: 'int', indexed: false},
        date: {type: 'timestamp', indexed: true},
        type: {type: 'string', indexed: true},
        name: {type: 'string', indexed: true},
        send: {
            type: 'int',
            indexed: true,
            getter: val => {
                if (val === -1) {
                    return true;
                }
                if (val === -2) {
                    return false;
                }
                return val;
            },
            setter: val => {
                if (val === true) {
                    return -1;
                }
                if (val === false) {
                    return -2;
                }
                return val;
            }
        },
    });

    /**
     * 创建一个文件类实例
     * @param {Object<string, any>} data 文件属性对象
     * @param {string} [entityType=FileData.NAME] 实体类型名称
     * @memberof FileData
     */
    constructor(data, entityType = FileData.NAME) {
        super(data, entityType);

        if (data.time) {
            /**
             * 文件创建日期
             * @type {number}
             */
            this.date = data.time;
        }
        if (data.originFile) {
            /**
             * 原始文件对象
             * @type {File|Object}
             */
            this.originFile = data.originFile;
        }
        if (data.path) {
            /**
             * 文件存储路径
             * @type {string}
             */
            this.path = data.path;
        }
    }

    /**
     * 确保 Gid 属性有可用的值
     * @memberof FileData
     * @return {void}
     */
    ensureGid() {
        if (!this.$.gid) {
            if (this.isOK) {
                this.$.gid = md5(`${this.name}:${this.date}:${this.id}`);
            } else {
                this.$.gid = UUID();
            }
        }
    }

    /**
     * 获取文件原始类型
     * @memberof FileData
     * @type {string}
     * @readonly
     */
    get originType() {
        const {originFile} = this;
        if (originFile) {
            if (originFile instanceof File) {
                return 'file';
            }
            if (originFile.base64) {
                return 'base64';
            }
            if (originFile.blob) {
                return 'blob';
            }
        }
        return null;
    }

    /**
     * 获取文件原始存储数据
     * @memberof FileData
     * @type {File|Blob|string}
     * @readonly
     */
    get originData() {
        const {originType, originFile} = this;
        if (originType && originFile) {
            if (originType === 'blob') {
                return originFile.blob;
            }
            if (originType === 'file') {
                return originFile;
            }
            if (originType === 'base64') {
                originFile.blob = dataURItoBlob(originFile.base64);
                return originFile.blob;
            }
        }
        return null;
    }

    /**
     * 获取文件访问地址
     *
     * @param {User} user 当前用户
     * @returns {string} 文件地址
     * @memberof FileData
     */
    getViewUrl(user) {
        const {originFile} = this;
        if (originFile) {
            if (!this._viewUrl) {
                this._viewUrl = originFile.path || this.localPath;
                if (this._viewUrl && !this._viewUrl.startsWith('http://') && !this._viewUrl.startsWith('https://') && !this._viewUrl.startsWith('file://')) {
                    this._viewUrl = `file://${this._viewUrl}`;
                }
            }
            if (!this._viewUrl) {
                if (originFile.blob) {
                    this._viewUrl = URL.createObjectURL(originFile.blob);
                } else {
                    this._viewUrl = originFile.base64;
                }
            }
            if (!this._viewUrl && (originFile instanceof File || originFile instanceof Blob)) {
                this._viewUrl = URL.createObjectURL(originFile);
            }
            if (!this._viewUrl) {
                this._viewUrl = this.makeUrl(user);
            }
        }
        return this._viewUrl;
    }

    /**
     * 获取上次为用户生成的文件访问地址
     *
     * @readonly
     * @memberof FileData
     * @type {string}
     */
    get viewUrl() {
        return this.getViewUrl();
    }

    /**
     * 获取数据库存储实体属性结构管理器
     *
     * @readonly
     * @memberof FileData
     * @type {EntitySchema}
     */
    // eslint-disable-next-line class-methods-use-this
    get schema() {
        return FileData.SCHEMA;
    }

    /**
     * 获取用于数据存储的简单对象
     *
     * @return {Object<string, any>} 用于的存储对象
     * @memberof FileData
     */
    plain() {
        const plainData = super.plain();
        delete plainData.path;
        delete plainData.originFile;
        return plainData;
    }

    /**
     * 获取存储对象的 JSON 字符串格式
     * @memberof FileData
     * @type {string}
     * @readonly
     */
    get json() {
        return JSON.stringify(this.plain());
    }

    /**
     * 获取文件对应的聊天 GID
     * @memberof FileData
     * @type {string}
     */
    get cgid() {
        return this.$get('cgid');
    }

    /**
     * 设置文件对应的聊天 GID
     * @param {string} gid 文件对应的聊天 GID
     * @memberof FileData
     */
    set cgid(gid) {
        this.$set('cgid', gid);
    }

    /**
     * 获取内部存储文件名
     * @memberof FileData
     * @type {string}
     * @readonly
     */
    get storageName() {
        return `${this.gid}.${this.extName}`;
    }

    /**
     * 获取文件创建日期
     * @memberof FileData
     * @type {Date} 文件创建日期
     */
    get date() {
        return createDate(this.$get('date'));
    }

    /**
     * 设置文件创建日期（时间戳格式）
     * @param {number} date 文件创建日期
     * @memberof FileData
     */
    set date(date) {
        this.$set('date', date);
    }

    /**
     * 获取文件创建日期（php 时间戳格式）
     * @memberof FileData
     * @type {number}
     */
    get time() {
        return Math.floor(this.date.getTime() / 1000);
    }

    /**
     * 设置文件创建日期（php 时间戳格式）
     * @param {number} time 文件创建日期（php 时间戳格式）
     * @memberof FileData
     */
    set time(time) {
        this.date = time;
    }

    /**
     * 获取文件发送者 ID
     * @memberof FileData
     * @type {string}
     */
    get senderId() {
        return this.$get('senderId');
    }

    /**
     * 判断指定的用户 ID 是否是当前文件的发送者
     * @memberof FileData
     * @param {string} userID 用户 ID
     * @return {boolean} 如果为 `true` 则为文件发送者，否则不是
     */
    isSender(userID) {
        return this.senderId === userID;
    }

    /**
     * 获取文件发送者
     * @memberof FileData
     * @type {Member}
     */
    get sender() {
        if (!this._sender) {
            return new Member({
                id: this.senderId
            });
        }
        return this._sender;
    }

    /**
     * 设置文件发送着
     * @param {Member} sendUser 文件发送着
     * @memberof FileData
     */
    set sender(sendUser) {
        if (sendUser) {
            this._sender = sendUser;
            this.$set('user', sendUser.id);
        }
    }

    /**
     * 根据系统成员数据获取当前文件发送者
     * @param {{get: function(id: string):Member}} appMembers 系统成员获取辅助对象
     * @returns {Member} 文件发送者
     * @memberof FileData
     */
    getSender(appMembers) {
        if (!this._sender) {
            this._sender = appMembers.get(this.senderId);
        }
        return this._sender;
    }

    /**
     * 获取文件类型
     * @memberof FileData
     * @type {string}
     */
    get type() {
        return this.$get('type');
    }

    /**
     * 设置文件类型
     * @param {string} type 文件类型
     * @memberof FileData
     */
    set type(type) {
        this.$set('type', type);
    }

    /**
     * 获取是否是图片类型
     * @memberof FileData
     * @type {boolean}
     * @readonly
     */
    get isImage() {
        const {type} = this;
        return type && type.startsWith('image');
    }

    /**
     * 获取文件大小，单位字节
     * @memberof FileData
     * @type {number}
     */
    get size() {
        return this.$get('size');
    }

    /**
     * 设置文件大小，单位字节
     * @param {number} size 文件大小，单位字节
     * @memberof FileData
     */
    set size(size) {
        this.$set('size', size);
    }

    /**
     * 获取图片宽度
     * @memberof FileData
     * @type {number}
     */
    get width() {
        return this.$get('width');
    }

    /**
     * 设置图片宽度
     * @param {number} width 图片宽度
     * @memberof FileData
     */
    set width(width) {
        this.$set('width', width);
    }

    /**
     * 获取图片高度
     * @memberof FileData
     * @type {number}
     */
    get height() {
        return this.$get('height');
    }

    /**
     * 设置图片高度
     * @param {number} height 图片高度
     * @memberof FileData
     */
    set height(height) {
        this.$set('height', height);
    }

    /**
     * 获取图片信息
     * @memberof FileData
     * @type {{width: number, height: number}}
     * @property {number} width 图片宽度
     * @property {number} height 图片高度
     * @readonly
     */
    get imageInfo() {
        const {width, height} = this;
        return width && height ? {width, height} : null;
    }

    /**
     * 获取文件名称
     * @memberof FileData
     * @type {string}
     */
    get name() {
        return this.$get('name');
    }

    /**
     * 设置文件名称
     * @param {string} name 文件名称
     * @memberof FileData
     */
    set name(name) {
        this.$set('name', name);
    }

    /**
     * 获取文件是否已经发送到服务器，此属性可能值包括：
     * - 0～100 的数字，表示发送到服务器的百分比；
     * - `false`，表示没有发送到服务器；
     * - `true`，表示已经成功发送到服务器。
     * @memberof FileData
     * @type {boolean|number}
     */
    get send() {
        return this.$get('send');
    }

    /**
     * 设置文件发送到服务器状态，此属性可能值包括：
     * - 0～100 的数字，表示发送到服务器的百分比；
     * - `false`，表示没有发送到服务器；
     * - `true`，表示已经成功发送到服务器。
     * @param {boolean|number} send 文件发送到服务器状态
     * @memberof FileData
     */
    set send(send) {
        this.$set('send', send);
    }

    /**
     * 获取是否已经发送到服务器
     * @memberof FileData
     * @readonly
     * @type {boolean}
     */
    get isOK() {
        return this.id && this.send === true;
    }

    /**
     * 获取文件扩展名，例如 `'txt'`
     * @memberof FileData
     * @type {string}
     * @readonly
     */
    get extName() {
        if (this._extName === undefined) {
            const {name} = this;
            const dotIndex = name.lastIndexOf('.');
            this._extName = dotIndex > -1 ? name.substr(dotIndex + 1) : '';
        }
        return this._extName;
    }

    /**
     * 获取获取文件所属类型
     * @memberof FileData
     * @type {string}
     * @readonly
     */
    get category() {
        if (!this._category) {
            this._category = 'other';
            const {extName} = this;
            if (extName) {
                for (const cat of CATEGORIES) {
                    if (cat.like.has(extName)) {
                        this._category = cat.name;
                        break;
                    }
                }
            }
        }
        return this._category;
    }

    /**
     * 获取文件与给定的关键字匹配分值
     * @memberof FileData
     * @param {string[]} keys 关键字列表
     * @return {number} 匹配的分值
     */
    getMatchScore(keys) {
        return matchScore(MATCH_SCORE_MAP, this, keys);
    }

    /**
     * 拼接文件访问地址
     * @memberof FileData
     * @param {User} user 当前用户
     * @return {string} 文件访问地址
     */
    makeUrl(user) {
        if (!this._url && user) {
            this._url = user.makeServerUrl(`download?fileName=${encodeURIComponent(this.name)}&time=${this.time || 0}&id=${this.id}&ServerName=${user.serverName}&gid=${user.id}&sid=${md5(user.sessionID + this.name)}`);
        }
        return this._url;
    }

    /**
     * 获取上次用户访问的地址
     * @memberof FileData
     * @type {string}
     */
    get url() {
        return this._url;
    }

    /**
     * 创建一个文件类对象
     *
     * @static
     * @param {Object|FileData} fileData 文件属性对象
     * @return {FileData} 一个文件类对象
     * @memberof FileData
     */
    static create(fileData) {
        if (fileData instanceof FileData) {
            return fileData;
        }
        if (fileData instanceof File || fileData.base64 || fileData.blob) {
            const originFile = fileData;
            fileData = {
                date: originFile.lastModifiedDate || new Date().getTime(),
                name: originFile.name,
                size: originFile.size,
                width: originFile.width,
                height: originFile.height,
                send: 0,
                type: originFile.type,
                originFile
            };
        }
        return new FileData(fileData);
    }
}
