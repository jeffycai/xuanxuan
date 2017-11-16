import Path from 'path';
import StringHelper from '../utils/string-helper';
import ExtensionConfig from './extension-config';
import timeSequence from '../utils/time-sequence';
import SearchScore from '../utils/search-score';
import PinYin from '../utils/pinyin';

export const TYPES = {
    app: 'app',
    theme: 'theme',
    plugin: 'plugin',
};

const MATCH_SCORE_MAP = [
    {name: 'name', equal: 100, include: 50},
    {name: 'displayName', equal: 100, include: 50},
    {name: 'pinyinNames', equal: 50, include: 25, array: true},
    {name: 'description', include: 25},
    {name: 'keywords', equal: 50, include: 10, array: true},
    {name: 'type', equal: 100, prefix: '#'},
    {name: 'author', equal: 100, prefix: '@'},
    {name: 'publisher', equal: 100, prefix: '@'},
    {name: 'homepage', include: 25},
];

export default class Extension {
    static TYPES = TYPES;

    constructor(pkgData, data) {
        const pkg = Object.assign({}, pkgData, pkgData.xxext);
        if (pkg.xxext) {
            delete pkg.xxext;
        }

        this._type = TYPES[pkg.type];
        if (!this._type) {
            this._type = TYPES.plugin;
            this.addError('type', `Unknown extension type (${pkg.type}), set to ‘${this._type}’ temporarily.`);
        }
        this._name = pkg.name;
        if (StringHelper.isEmpty(pkg.name) || !(/[A-Za-z0-9\_-]+/.test(pkg.name))) {
            this._safeName = `extension-${timeSequence()}`;
            this.addError('name', `Extension name(${pkg.name}) is not valid, use random name '${this._safeName}'.`);
        }

        this._pkg = pkg;

        this._config = new ExtensionConfig(this.name, this.configurations);

        this._data = Object.assign({}, data);
    }

    addError(name, error) {
        if (!error) {
            error = name;
            name = '_';
        }

        if (!this._errors) {
            this._errors = [];
        }
        if (DEBUG) {
            console.color(`Extension.${this.name}`, 'greenBg', name, 'greenPale', error, 'red');
        }
        this._errors.push({name, error});
    }

    get errors() {
        return this._errors;
    }

    get hasError() {
        return this._errors && this._errors.length;
    }

    get pinyinNames() {
        if (!this._pinyinName) {
            this._pinyinName = PinYin(this.displayName, 'default', false);
        }
        return this._pinyinName;
    }

    get config() {
        return this._config;
    }

    get displayName() {
        return StringHelper.ifEmptyThen(this._pkg.displayName, this._name);
    }

    get type() {
        return this._type;
    }

    get name() {
        return this._safeName || this._name;
    }

    get isTheme() {
        return this._type === TYPES.theme;
    }

    get isPlugin() {
        return this._type === TYPES.plugin;
    }

    get isApp() {
        return this._type === TYPES.app;
    }

    get buildIn() {
        return this._pkg.buildIn;
    }

    get configurations() {
        return this._pkg.configurations || [];
    }

    get pkg() {return this._pkg;}
    get accentColor() {return this._pkg.accentColor;}
    get description() {return this._pkg.description;}
    get version() {return this._pkg.version;}
    get author() {return this._pkg.author;}
    get publisher() {return this._pkg.publisher;}
    get license() {return this._pkg.license;}
    get homepage() {return this._pkg.homepage;}
    get keywords() {return this._pkg.keywords;}
    get engines() {return this._pkg.engines;}
    get repository() {return this._pkg.repository;}
    get bugs() {return this._pkg.bugs;}
    get lazy() {return this._pkg.lazy;}

    get mainFile() {
        const mainFile = this.pkg.main;
        if (mainFile && !this._mainFile) {
            this._mainFile = Path.join(this.localPath, mainFile);
        }
        return this._mainFile;
    }

    get icon() {
        const icon = this._pkg.icon;
        if (icon && !this._icon) {
            if (icon.length > 1 && !icon.startsWith('http://') && !icon.startsWith('https://') && !icon.startsWith('mdi-') && !icon.startsWith('icon')) {
                this._icon = Path.join(this.localPath, icon);
            } else {
                this._icon = icon;
            }
        }
        return this._icon;
    }

    get authorName() {
        const author = this.author;
        return author && (author.name || author);
    }

    get storeData() {
        return {
            data: this._data,
            pkg: this._pkg
        };
    }

    get data() {
        return this._data;
    }

    get installTime() {
        return this._data.installTime;
    }

    set installTime(time) {
        this._data.installTime = time;
        this.updateTime = time;
    }

    get updateTime() {
        return this._data.updateTime;
    }

    set updateTime(time) {
        this._data.updateTime = time;
    }

    // get devPath() {
    //     return this.isDev ? this.localPath : null;
    // }

    // set devPath(devPath) {
    //     this.localPath = devPath;
    //     this.isDev = true;
    // }

    get localPath() {
        return this._data.localPath;
    }

    set localPath(localPath) {
        this._data.localPath = localPath;
    }

    get isDev() {
        return this._data.isDev;
    }

    set isDev(flag) {
        this._data.isDev = flag;
    }

    get hasModule() {
        return this.mainFile;
    }

    /**
     * 重新载入扩展
     */
    loadModule(api) {
        if (this.mainFile) {
            const start = new Date().getTime();
            this._module = __non_webpack_require__(this.mainFile);

            this.callModuleMethod('onAttach', this, api);

            this._loadTime = new Date().getTime() - start;
            this._loaded = true;

            if (DEBUG) {
                console.collapse('Extension Attach', 'greenBg', this.name, 'greenPale', `spend time: ${this._loadTime}ms`, 'orange');
                console.log('extension', this);
                console.log('module', this._module);
                console.groupEnd();
            }
        }
        return this._module;
    }

    get isModuleLoaded() {
        return this._loaded;
    }

    get needRestart() {
        return this.mainFile && !this._loaded;
    }

    detach() {
        this.callModuleMethod('onDetach', this);
        this._module = null;
        if (DEBUG) {
            console.collapse('Extension Detach', 'greenBg', this.name, 'greenPale');
            console.log('extension', this);
            console.groupEnd();
        }
    }

    get hasReplaceViews() {
        return this._module && this._module.replaceViews;
    }

    get replaceViews() {
        return this.module.replaceViews;
    }

    /**
     * 获取上次加载此扩展所花费的时间，单位为毫秒
     */
    get loadTime() {
        return this._loadTime;
    }

    get module() {
        return this._module || this.loadModule();
    }

    callModuleMethod(methodName, ...params) {
        const extModule = this.module;
        if (extModule && extModule[methodName]) {
            return extModule[methodName](...params);
        }
    }

    getMatchScore(keys) {
        return SearchScore.matchScore(MATCH_SCORE_MAP, this, keys);
    }
}
