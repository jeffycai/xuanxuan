import Extension from './base-extension';

/**
 * 插件扩展类
 *
 * @export
 * @class PluginExtension
 * @extends {Extension}
 */
export default class PluginExtension extends Extension {
    /**
     * 创建一个插件扩展类实例
     * @param {Object} pkg 扩展的 package.json 文件数据
     * @param {Object} [data=null] 扩展的运行时数据
     * @memberof PluginExtension
     */
    constructor(pkg, data = null) {
        super(pkg, data);

        if (!this.isPlugin) {
            throw new Error(`Cannot create a plugin extension from the type '${this.type}'.`);
        }

        if (!pkg.main && !(pkg.buildIn && pkg.buildIn.module)) {
            this.pkg.main = 'index.js';
            this.addError('main', 'The main attribute must be set when the extension type is plugin, set to "index.js" temporarily.');
        }
    }
}
