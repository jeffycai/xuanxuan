import Extension, {TYPES} from './base-extension';
import AppExtension from './app-extension';
import PluginExtension from './plugin-extension';
import ThemeExtension from './theme-extension';

/**
 * 创建一个扩展类实例
 * @param {Object} pkg 扩展的 package.json 文件数据
 * @param {Object} [data=null] 扩展的运行时数据
 * @param {boolean} [buildIn=false] 是否为内置扩展
 * @return {Extension|AppExtension|PluginExtension|ThemeExtension} 扩展类实例
 */
export const createExtension = (pkg, data = null, buildIn = false) => {
    if (pkg.pkg && !data) {
        data = pkg.data;
        pkg = pkg.pkg;
    }

    if (buildIn !== true) {
        if (pkg && pkg.buildIn) {
            delete pkg.buildIn;
        }
        if (data && data.buildIn) {
            delete data.buildIn;
        }
    } else if (pkg.buildIn && pkg.buildIn.localPath) {
        data.localPath = pkg.buildIn.localPath;
    }

    if (typeof data !== 'object') {
        data = null;
    }

    switch (pkg.type) {
    case TYPES.app:
        return new AppExtension(pkg, data);
    case TYPES.plugin:
        return new PluginExtension(pkg, data);
    case TYPES.theme:
        return new ThemeExtension(pkg, data);
    default:
        return new Extension(pkg, data);
    }
};

/**
 * 设置扩展所属的用户
 * @param {User} user 用户对象
 * @return {void}
 */
export const setExtensionUser = user => {
    Extension.user = user;
};

export {AppExtension, PluginExtension, ThemeExtension};
export default Extension;
