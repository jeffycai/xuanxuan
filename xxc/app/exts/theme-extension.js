import Extension from './base-extension';
import Theme from './theme';

/**
 * 主题扩展类
 *
 * @export
 * @class ThemeExtension
 * @extends {Extension}
 */
export default class ThemeExtension extends Extension {
    /**
     * 创建一个主题扩展类实例
     * @param {Object} pkg 扩展的 package.json 文件数据
     * @param {Object} data 扩展的运行时数据
     * @memberof ThemeExtension
     */
    constructor(pkg, data) {
        super(pkg, data);

        if (!this.isTheme) {
            throw new Error(`Cannot create a theme extension from the type '${this.type}'.`);
        }

        /**
         * 主题扩展中定义的所有主题
         * @type {Theme[]}
         * @private
         */
        this._themes = [];

        const {themes} = this._pkg;
        if (themes && themes.length) {
            this._themes = themes.map(themeData => {
                return new Theme(themeData, this);
            });
        } else {
            this.addError('themes', 'At least one theme must be set with "themes" attribute in package.json for theme extension.');
        }
    }

    /**
     * 获取主题扩展中定义的所有主题
     * @memberof ThemeExtension
     * @type {Theme[]}
     */
    get themes() {
        return this._themes;
    }

    /**
     * 根据主题名称获取主题对象
     *
     * @param {string} name 主题名称
     * @return {Theme} 主题对象
     * @memberof ThemeExtension
     */
    getTheme(name) {
        return this.themes.find(x => x.name === name);
    }
}
