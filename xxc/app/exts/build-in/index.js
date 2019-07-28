// eslint-disable-next-line import/no-unresolved
import path from 'path';
import platform from '../../platform';
import Config from '../../config';
import Lang from '../../core/lang';

export default () => {
    /**
     * 内置扩展清单
     * @type {Object[]}
     */
    const exts = [{
        name: 'home',
        displayName: Lang.string('exts.home.label'),
        description: Lang.string('exts.home.desc'),
        buildIn: {
            fixed: true,
            asDefault: true,
        },
        type: 'app',
        appIcon: 'mdi-apps',
        appAccentColor: '#3f51b5',
        appType: 'insideView',
    }, {
        name: 'extensions',
        displayName: Lang.string('exts.extensions.label'),
        description: Lang.string('exts.extensions.desc'),
        buildIn: {},
        type: 'app',
        appIcon: 'mdi-puzzle',
        appAccentColor: '#00c853',
        appType: 'insideView',
    }, {
        name: 'themes',
        displayName: Lang.string('exts.themes.label'),
        description: Lang.string('exts.themes.desc'),
        buildIn: {},
        type: 'app',
        appIcon: 'mdi-airballoon',
        appAccentColor: '#f50057',
        appType: 'insideView',
    }, {
        name: 'files',
        displayName: Lang.string('exts.files.label'),
        description: Lang.string('exts.files.desc'),
        buildIn: {},
        type: 'app',
        appIcon: 'mdi-folder',
        appAccentColor: '#ff9100',
        appType: 'insideView',
    }];

    /**
     * 从运行时配置中加载内置扩展
     * @type {Object[]}
     * @private
     */
    const internals = Config.exts && Config.exts.internals;
    if (Array.isArray(internals) && internals.length) {
        exts.push(...internals);
    }

    /**
     * 内置扩展清单文件读取的内置扩展列表
     * @type {Object[]}
     * @private
     */
    const buildIns = platform.call('buildIn.getBuildInExtensions');

    if (buildIns && Array.isArray(buildIns)) {
        const buildInPath = platform.access('buildIn.buildInPath');
        buildIns.forEach(extConfig => {
            if (typeof extConfig === 'string') {
                const extPkgPath = path.join(buildInPath, extConfig, 'package.json');
                const extPkg = platform.fs.readJsonSync(extPkgPath, {throws: false});
                if (extPkg && extPkg.name === extConfig) {
                    extConfig = extPkg;
                }
            }
            if (extConfig && (typeof extConfig === 'object')) {
                extConfig.buildIn = {
                    localPath: path.join(buildInPath, extConfig.name)
                };
                exts.push(extConfig);
                if (DEBUG) {
                    console.collapse('Extension local', 'greenBg', extConfig.name, 'greenPale');
                    console.log('ext', extConfig);
                    console.groupEnd();
                }
            }
        });
    }
    return exts;
};
