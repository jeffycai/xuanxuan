import Path from 'path';
import StringHelper from '../utils/string-helper';
import PinYin from '../utils/pinyin';
import {matchScore} from '../utils/search-score';

/**
 * 主题样式表注入类型：
 * - 追加方式（`append`）：将 css 文件作为默认样式表的补充，即挂在在默认主题样式的后面；
 * - 覆盖方式（`override`）：将 css 文件替换原来的默认样式表。
 * @type {Map<string, string>}
 * @private
 */
const INJECT_TYPE = {
    append: 'append',
    override: 'override',
};

/**
 * 搜索匹配分值表
 * @type {Object[]}
 * @private
 */
const MATCH_SCORE_MAP = [
    {
        name: 'name', equal: 100, include: 50
    }, {
        name: 'displayName', equal: 100, include: 50
    }, {
        name: 'pinyinNames', equal: 50, include: 25, array: true
    }, {
        name: 'description', include: 25
    }, {
        name: 'author', equal: 100, prefix: '@'
    }, {
        name: 'publisher', equal: 100, prefix: '@'
    }, {
        name: 'extKeywords', equal: 50, include: 10, array: true
    }, {
        name: 'extDisplayName', equal: 50, include: 25
    }, {
        name: 'extName', equal: 50, include: 25
    }, {
        name: 'extPinyinNames', equal: 50, include: 25, array: true
    },
];

/**
 * 界面主题类
 *
 * @export
 * @class Theme
 */
export default class Theme {
    /**
     * 创建一个界面主题类实例
     * @param {Object} data 主题属性对象
     * @param {string} data.name 主题的名称，同一个扩展中的主题名称不能相同
     * @param {string} data.displayName 主题在界面上显示的名称
     * @param {string} data.color 主题的主色调
     * @param {string} data.style 主题对应的 css 文件
     * @param {string} data.inject 主题的载入方式
     * @param {ThemeExtension} extension 主题所属的扩展
     * @memberof Theme
     */
    constructor(data, extension) {
        if (!data) {
            throw new Error('Theme error: The "data" prama can not be empty.');
        }
        if (!extension) {
            throw new Error('Theme error: The "extension" prama can not be empty.');
        }

        this._extension = extension;
        this._data = data;
    }

    /**
     * 获取主题的主色调
     * @memberof Theme
     * @type {string}
     */
    get color() {
        return this._data.color;
    }

    /**
     * 获取主题所属的扩展
     * @memberof Theme
     * @type {ThemeExtension}
     */
    get extension() {
        return this._extension;
    }

    /**
     * 获取主题的名称，同一个扩展中的主题名称不能相同
     * @memberof Theme
     * @type {string}
     */
    get name() {
        return this._data.name;
    }

    /**
     * 获取主题在界面上显示的名称
     * @memberof Theme
     * @type {string}
     */
    get displayName() {
        return StringHelper.ifEmptyThen(this._data.displayName, this.name);
    }

    /**
     * 获取主题名称的拼音形式字符串
     * @type {string}
     * @readonly
     * @memberof Theme
     */
    get pinyinNames() {
        if (!this._pinyinName) {
            this._pinyinName = PinYin(this.displayName, 'default', false);
        }
        return this._pinyinName;
    }

    /**
     * 获取主题编号
     * @memberof Theme
     * @type {string}
     */
    get id() {
        if (!this._id) {
            this._id = `${this.extension.name}:${this.name}`;
        }
        return this._id;
    }

    /**
     * 获取主题的载入方式，目前支持 `'inject'` 和 `'append'`
     * @memberof Theme
     * @type {string}
     */
    get inject() {
        return INJECT_TYPE[this._data.inject] || INJECT_TYPE.append;
    }

    /**
     * 获取是否为追加载入方式（`append`）
     * @memberof Theme
     * @type {boolean}
     */
    get isAppend() {
        return this.inject === INJECT_TYPE.append;
    }

    /**
     * 获取是否为覆盖载入方式（`override`）
     * @memberof Theme
     * @type {boolean}
     */
    get isOverride() {
        return this.inject === INJECT_TYPE.override;
    }

    /**
     * 获取主题对应的 CSS 样式表文件路径
     * @memberof Theme
     * @type {string}
     */
    get styleFile() {
        const {style} = this._data;
        if (style && !this._styleFile) {
            if (!style.startsWith('https://') && !style.startsWith('http://')) {
                this._styleFile = `file://${Path.join(this.extension.localPath, style)}`;
            } else {
                this._styleFile = style;
            }
        }
        return this._styleFile;
    }

    /**
     * 获取预览图片地址
     *
     * @readonly
     * @memberof Theme
     * @type {string}
     */
    get preview() {
        const {preview} = this._data;
        if (preview && !this._preview) {
            if (!preview.startsWith('https://') && !preview.startsWith('http://')) {
                this._preview = Path.join(this.extension.localPath, preview);
            } else {
                this._preview = preview;
            }
        }
        return this._preview;
    }

    /**
     * 获取主题作者（实际为主题所属扩展的作者）
     * @memberof Theme
     * @type {string}
     */
    get author() {return this.extension.author;}

    /**
     * 获取主题发布者（实际为主题所属扩展的发布者）
     * @memberof Theme
     * @type {string}
     */
    get publisher() {return this.extension.publisher;}

    /**
     * 获取主题关键字（实际为主题所属扩展的关键字）
     * @memberof Theme
     * @type {string[]}
     */
    get extKeywords() {return this.extension.keywords;}

    /**
     * 获取主题扩展显示名称
     * @memberof Theme
     * @type {string}
     */
    get extDisplayName() {return this.extension.displayName;}

    /**
     * 获取主题扩展扩展名称
     * @memberof Theme
     * @type {string}
     */
    get extName() {return this.extension.name;}

    /**
     * 获取主题扩展扩展名称拼音字符串
     * @memberof Theme
     * @type {string}
     */
    get extPinyinNames() {return this.extension.pinyinNames;}

    /**
     * 获取主题扩展描述
     * @memberof Theme
     * @type {string}
     */
    get extDescription() {return this.extension.description;}

    /**
     * 获取主题与给定的关键字匹配分值
     * @memberof Member
     * @param {string[]} keys 关键字列表
     * @return {number} 匹配的分值
     */
    getMatchScore(keys) {
        return matchScore(MATCH_SCORE_MAP, this, keys);
    }
}
