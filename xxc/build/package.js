#!/usr/bin/env node

/* eslint-disable no-template-curly-in-string */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
/* eslint-disable prefer-template */
/* eslint-disable no-extend-native */

import chalk from 'chalk';
import program from 'commander';
import {spawn} from 'child_process';
import path from 'path';
import os from 'os';
import cpx from 'cpx';
import archiver from 'archiver';
import fse from 'fs-extra';
import pkg from '../package.json';
import {formatDate} from '../app/utils/date-helper';

// 所支持的平台类型
const PLATFORMS = new Set(['win', 'mac', 'linux', 'browser']);

// 所支持的架构类型
const ARCHS = new Set(['x32', 'x64']);

/**
 * 自定义格式化字符串
 * @param {string} str 要格式化的字符串
 * @param {string} format 格式定义，例如 '{0}'
 * @param {...any} args 格式化参数
 * @return {string} 格式化后的字符串
 * @example <caption>通过参数序号格式化</caption>
 *     var hello = $.format('${0} ${1}!', '\\${0}', 'Hello', 'world');
 *     // hello 值为 'Hello world!'
 * @example <caption>通过对象名称格式化</caption>
 *     var say = $.format('Say ${what} to ${who}', '\\${0}', {what: 'hello', who: 'you'});
 *     // say 值为 'Say hello to you'
 */
const customFormatString = (str, format, ...args) => {
    let result = str;
    if (args.length > 0) {
        let reg;
        if (args.length === 1 && (typeof args[0] === 'object')) {
            // eslint-disable-next-line prefer-destructuring
            args = args[0];
            Object.keys(args).forEach(key => {
                if (args[key] !== undefined) {
                    reg = new RegExp(`(${format.replace(0, key)})`, 'g');
                    result = result.replace(reg, args[key]);
                }
            });
        } else {
            for (let i = 0; i < args.length; i++) {
                if (args[i] !== undefined) {
                    reg = new RegExp(`(${format.replace(0, `[${i}]`)})`, 'g');
                    result = result.replace(reg, args[i]);
                }
            }
        }
    }
    return result;
};

// 判断字符串或数组是否为空
const isEmpty = val => val === undefined || val === null || !val.length;

// 复制文件
const copyFiles = (source, dest, options) => new Promise((resolve, reject) => {
    cpx.copy(source, dest, options, err => {
        if (err) {
            console.error(`复制文件失败，原路径：${source} 目标路径：${dest}`, err);
            reject(err);
        } else {
            console.log(`    ${chalk.green(chalk.bold('✓'))} 复制 ${chalk.underline(source)} → ${chalk.underline(dest)}`);
            resolve(dest);
        }
    });
});

// 获取当前操作系统平台类型
const getCurrentPlatform = () => {
    const osPlatform = os.platform();
    if (osPlatform === 'linux') {
        return 'linux';
    }
    if (osPlatform === 'darwin') {
        return 'mac';
    }
    if (osPlatform === 'win32') {
        return 'win';
    }
};

// 获取当前操作系统平台架构类型
const getCurrentArch = () => {
    if (os.arch().includes('32')) {
        return 'x32';
    }
    return 'x64';
};

// 格式化平台配置项
const formatPlatforms = (val) => {
    if (isEmpty(val)) {
        return [getCurrentPlatform()];
    }
    const platforms = new Set(Array.isArray(val) ? val : (val.toLowerCase().split(',')));
    const platformsSet = new Set();
    if (platforms.has('all') || platforms.has('*')) {
        return Array.from(PLATFORMS);
    }
    platforms.forEach((p) => {
        if (PLATFORMS.has(p)) {
            platformsSet.add(p);
        } else if (p === 'current') {
            const currentPlatoform = getCurrentPlatform();
            if (!isEmpty(currentPlatoform)) {
                platformsSet.add(currentPlatoform);
            }
        }
    });
    if (!platformsSet.size) {
        platformsSet.add(getCurrentPlatform());
    }
    return Array.from(platformsSet);
};

// 格式化架构配置项
const formatArchs = (val) => {
    if (isEmpty(val)) {
        return [getCurrentArch()];
    }
    const archs = new Set(Array.isArray(val) ? val : (val.toLowerCase().split(',')));
    const archsSet = new Set();
    if (archs.has('all') || archs.has('*')) {
        return Array.from(ARCHS);
    }
    archs.forEach((p) => {
        if (ARCHS.has(p)) {
            archsSet.add(p);
        } else if (p === 'current') {
            archsSet.add(getCurrentArch());
        }
    });
    if (!archsSet.size) {
        archsSet.add(getCurrentArch());
    }
    return Array.from(archsSet);
};

// 创建 zip 文件
const createZipFromDir = (file, dir, destDir = false) => {
    return new Promise((resolve, reject) => {
        const output = fse.createWriteStream(file);
        const archive = archiver('zip', {
            zlib: {level: 9}
        });
        archive.on('error', reject);
        archive.on('end', resolve);
        archive.pipe(output);
        archive.directory(dir, destDir);
        archive.finalize();
    });
};

// https://github.com/uxitten/polyfill/blob/master/string.polyfill.js
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padEnd
if (!String.prototype.padEnd) {
    String.prototype.padEnd = function padEnd(targetLength, padString) {
        // eslint-disable-next-line operator-assignment
        targetLength = targetLength >> 0; // floor if number or convert non-number to 0;
        padString = String((typeof padString !== 'undefined' ? padString : ' '));
        if (this.length > targetLength) {
            return String(this);
        }
        // eslint-disable-next-line operator-assignment
        targetLength = targetLength - this.length;
        if (targetLength > padString.length) {
            padString += padString.repeat(targetLength / padString.length); // append to original to ensure we are longer than needed
        }
        return String(this) + padString.slice(0, targetLength);
    };
}

// 处理命令行参数
program
    .version(pkg.version)
    .alias('npm run package --')
    .description(`${pkg.productName || pkg.name}的打包工具`)
    .option('-c, --config <config>', '打包配置名称或者指定打包配置文件所在路径', (val, defaultValue) => {
        if (isEmpty(val)) {
            const defaultConfig = fse.readJsonSync(path.resolve(__dirname, './build-config.default.json'), {throws: false});
            if (defaultConfig && !isEmpty(defaultConfig.name)) {
                return defaultConfig.name;
            }
            return defaultValue;
        }
        return val;
    }, '')
    .option('-s, --skipbuild', '是否忽略构建最终安装包，仅仅生成用于构建所需的配置文件', false)
    .option('-p, --platform <platform>', '需要打包的平台，可选值包括: "mac", "win", "linux", "browser", "current", 或者使用英文逗号拼接多个平台名称，例如 "win,mac", 特殊值 "current" 用于指定当前打包工具所运行的平台, 特殊值 "all" 或 "*" 用于指定所有平台（相当于 “mac,win,linux,browser”）', formatPlatforms, 'current')
    .option('-a, --arch <arch>', '需要打包的平台处理器架构类型, 可选值包括: "x32", "x64", 或者使用英文逗号拼接多个架构名称，例如 "x32,x64", 特殊值 "current" 用于快捷指定当前打包工具所运行的平台架构类型, 特殊值 "all" 或 "*" 用于指定所有架构类型（相当于 “x32,x64”）', formatArchs, 'current')
    .option('-d, --debug', '是否打包为方便调试的版本', false)
    .option('-b, --beta [beta]', '是否将版本标记为 Beta 版本', false)
    .option('-v, --verbose', '是否输出额外的信息', false)
    .option('-C, --clean', '存储安装包之前是否清空旧的安装包文件', false)
    .parse(process.argv);

console.log(chalk.magentaBright(chalk.bold(`───────────────┤ ${pkg.name.toUpperCase()} ${pkg.version}`) + ' 打包工具 ├───────────────'));

const appRootPath = path.resolve(__dirname, '../');
const configName = program.config;
const isCustomConfig = configName && configName !== '-';
const platforms = formatPlatforms(program.platform);
const archs = formatArchs(program.arch);
const isDebug = program.debug;
const isBeta = !!program.beta;
const {verbose} = program;
const isSkipBuild = program.skipbuild;
const isClean = program.clean;
const buildVersion = isBeta ? formatDate(new Date(), program.beta === true ? 'beta.yyyyMMddhhmm' : program.beta) : null;

// 输出配置选项
console.log(`
${chalk.cyanBright(chalk.bold('❖ 工具选项:'))}

    config:     ${isEmpty(configName) ? chalk.gray('<notset>') : chalk.bold(configName)} ${isCustomConfig ? chalk.magentaBright('[custom]') : ''}
    platform:   ${chalk.bold(platforms)}
    archs:      ${chalk.bold(archs)}
    debug:      ${isDebug ? chalk.bold('✓') : chalk.gray('𐄂')}
    beta:       ${isBeta ? chalk.bold('✓') : chalk.gray('𐄂')}
    skipBuild:  ${isSkipBuild ? chalk.bold('✓') : chalk.gray('𐄂')}
    clean:      ${isClean ? chalk.bold('✓') : chalk.gray('𐄂')}
    verbose:    ${verbose ? chalk.bold('✓') : chalk.gray('𐄂')}
    ${chalk.gray('(提示：使用 "-h" 或者 "--help" 命令行选项来查看所有可用命令行配置项)')}
`);

const config = {
    name: pkg.name,
    productName: pkg.productName,
    description: pkg.description,
    homepage: pkg.homepage,
    version: pkg.version,
    license: pkg.license,
    company: pkg.company,
    author: pkg.author,
    bugs: pkg.bugs,
    repository: pkg.repository,
    resourcePath: '',
    stylePath: '',
    mediaPath: 'media/',
    copyOriginMedia: true,
    buildVersion,
    artifactName: '${name}.${version}${env.PKG_BETA}${env.PKG_DEBUG}.${os}.${arch}.${ext}',
    macArtifactName: '${name}.${version}${env.PKG_BETA}${env.PKG_DEBUG}.${os}.${ext}',
    winArtifactName: '${name}.${version}${env.PKG_BETA}${env.PKG_DEBUG}.${os}${env.PKG_ARCH}.setup.${ext}',
    winZipArtifactName: '${name}.${version}${env.PKG_BETA}${env.PKG_DEBUG}.${os}${env.PKG_ARCH}.${ext}',
    linuxZipArtifactName: '${name}.${version}${env.PKG_BETA}${env.PKG_DEBUG}.${os}${env.PKG_ARCH}.${ext}',
    macZipArtifactName: '${name}.${version}${env.PKG_BETA}${env.PKG_DEBUG}.${os}.${ext}',
    buildZip: true,
    zipSubDir: true,
};
let configDirPath = null;
if (isCustomConfig) {
    if (configName.includes('/')) {
        const configFilePath = path.resolve(__dirname, configName);
        configDirPath = path.dirname(configFilePath);
        Object.assign(config, require(configFilePath));
    } else if (fse.existsSync(path.resolve(__dirname, `./build-config.${configName}.json`))) {
        Object.assign(config, fse.readJSONSync(path.resolve(__dirname, `./build-config.${configName}.json`), {throws: false}));
        configDirPath = __dirname;
    } else if (fse.existsSync(path.resolve(__dirname, `./build.${configName}/build-config.json`))) {
        Object.assign(config, fse.readJSONSync(path.resolve(__dirname, `./build.${configName}/build-config.json`), {throws: false}));
        configDirPath = path.join(__dirname, `./build.${configName}`);
    }
}

// 格式化时间
const formatTime = time => {
    return time >= 1000 ? formatDate(new Date(time), time > 3600000 ? 'h小时m分s秒' : time > 60000 ? 'm分s秒' : 's秒') : `${(time / 1000).toFixed(2)}秒`;
};

// 操作消耗时间表
let timeCostMap = {
    $default: true,
    'webpack-electron': 69930,
    'webpack-browser': 52164,
    'package-browser': 57402,
    'package-mac-x64': 246675,
    'package-mac-x32': 0,
    'package-win-x64': 46301,
    'package-win-x32': 40683,
    'package-linux-x64': 268699,
    'package-linux-x32': 287033,
};

// 获取操作消耗时间
const getTimeCost = (operation) => {
    if (timeCostMap.$default) {
        timeCostMap = Object.assign(timeCostMap, fse.readJSONSync(path.resolve(__dirname, './build-time-cost.json'), {throws: false}));
        delete timeCostMap.$default;
    }
    return operation ? timeCostMap[operation] : timeCostMap;
};

// 获取操作消耗时间文本
const getTimeCostText = operation => {
    const costTime = getTimeCost(operation);
    if (costTime) {
        return formatTime(costTime);
    }
};

// 保存操作消耗时间
const saveTimeCostMap = () => {
    if (timeCostMap) {
        fse.writeJSONSync(path.resolve(__dirname, './build-time-cost.json'), timeCostMap);
        console.log(`    ${chalk.green(chalk.bold('✓'))} 保存构建缓存文件 ${chalk.underline('./build-time-cost.json')}`);
    }
};

// 开始记录操作消耗时间
const startRecordCostTime = operation => {
    const costMap = getTimeCost();
    costMap[`${operation}-begin`] = new Date().getTime();
};

// 停止记录操作消耗时间
const finishRecordCostTime = operation => {
    const costMap = getTimeCost();
    const begin = costMap[`${operation}-begin`];
    if (!begin) {
        return;
    }
    const end = new Date().getTime();
    delete costMap[`${operation}-begin`];
    const cost = end - begin;
    costMap[operation] = cost;
    return cost;
};

// 输出预计耗时信息
const printEstimateInfo = operation => {
    const costTimeText = getTimeCostText(operation);
    if (costTimeText) {
        console.log(`    ${chalk.bold(chalk.magentaBright('♥︎'))} 请耐心等待，预计操作耗时 ${chalk.bold(chalk.red(costTimeText))}...${chalk.grey(`(${formatDate(new Date())} ${operation})`)}`);
    } else {
        console.log(`    ${chalk.bold(chalk.magentaBright('♥︎'))} 请耐心等待，这可能需要花费几分钟时间...${chalk.grey(`(${formatDate(new Date())} ${operation})`)}`);
    }
    startRecordCostTime(operation);
};

// 输出实际耗时信息
const printConsumeInfo = operation => {
    const estimateCostTimeText = getTimeCostText(operation);
    const costTime = finishRecordCostTime(operation);
    if (costTime) {
        const costTimeText = getTimeCostText(operation);
        if (estimateCostTimeText) {
            console.log(`    ${chalk.bold(chalk.magentaBright('⇒'))} 操作实际耗时 ${chalk.bold(chalk.red(costTimeText))}，预计耗时 ${chalk.bold(estimateCostTimeText)}${chalk.grey(`(${formatDate(new Date())} ${operation})`)}`);
        } else {
            console.log(`    ${chalk.bold(chalk.magentaBright('⇒'))} 操作实际耗时 ${chalk.bold(chalk.red(costTimeText))}${chalk.grey(`(${formatDate(new Date())} ${operation})`)}`);
        }
    }
};

// 输出打包配置
console.log(`${chalk.cyanBright(chalk.bold('❖ 打包配置:'))}\n`);
Object.keys(config).forEach((n) => {
    const nV = config[n];
    console.log(`    ${n}:`.padEnd(22) + (typeof nV === 'string' ? nV : JSON.stringify(nV)));
});
console.log();

const getArtifactName = (platform, arch, ext, name) => {
    const artifactName = config[`${name || platform}ArtifactName`] || config.artifactName;
    return customFormatString(artifactName, '\\${0}', Object.assign({}, config, {
        arch,
        platform,
        os: platform,
        beta: isBeta ? 'beta' : '',
        debug: isDebug ? 'debug' : '',
        ext,
        'env.PKG_BETA': isBeta ? '.beta' : '',
        'env.PKG_DEBUG': isDebug ? '.debug' : '',
        'env.PKG_ARCH': arch.includes('32') ? '32' : '64',
    }));
};

const electronBuilder = {
    productName: config.name,
    appId: config.appid || `com.cnezsoft.${config.name}`,
    compression: 'maximum',
    artifactName: config.artifactName,
    electronVersion: config.electronVersion,
    electronDownload: {mirror: 'https://npm.taobao.org/mirrors/electron/'},
    extraResources: [{
        from: 'app/build-in/',
        to: 'build-in'
    }, {
        from: 'app/lang/',
        to: 'lang'
    }],
    dmg: {
        contents: [{
            x: 130,
            y: 220
        }, {
            x: 410,
            y: 220,
            type: 'link',
            path: '/Applications'
        }],
        title: `${config.productName} ${config.version}`
    },
    files: [
        'dist/',
        'assets/',
        {
            from: (config.copyOriginMedia && config.mediaPath !== 'media/') ? 'media-build/' : config.mediaPath,
            to: 'media/'
        },
        'index.html',
        'main.js',
        'main.js.map',
        'package.json',
        'node_modules/',
        {
            from: '../resources/',
            to: 'resources'
        }
    ],
    win: {
        target: [
            'nsis'
        ]
    },
    linux: {
        target: [
            'deb',
            'rpm',
            'tar.gz'
        ],
        icon: 'icons',
        artifactName: config.linuxArtifactName || config.artifactName
    },
    mac: {
        icon: 'icon.icns',
        artifactName: config.macArtifactName || config.artifactName
    },
    nsis: {
        oneClick: false,
        allowToChangeInstallationDirectory: true,
        artifactName: config.winArtifactName || config.artifactName,
        deleteAppDataOnUninstall: false
    },
    directories: {
        app: 'app',
        buildResources: config.resourcePath ? path.resolve(configDirPath || __dirname, config.resourcePath) : 'resources',
        output: config.name === 'xuanxuan' ? `release/${config.version}${isBeta ? '-beta' : ''}` : `release/${config.name}-${config.version}${isBeta ? '-beta' : ''}`
    }
};

if (config.buildInPath) {
    electronBuilder.extraResources.push({
        from: path.resolve(configDirPath || __dirname, config.buildInPath),
        to: 'build-in'
    });
}

if (config.langPath) {
    electronBuilder.extraResources.push({
        from: path.resolve(configDirPath || __dirname, config.langPath),
        to: 'lang'
    });
}

// 安装包输出目录
const packagesPath = path.join(__dirname, '../', electronBuilder.directories.output);

// app/index.html 文件内容
let electronIndexHTML = null;

// 输出打包配置文件
const outputConfigFiles = () => {
    console.log(`${chalk.cyanBright(chalk.bold('❖ 创建打包配置文件:'))}\n`);

    // 输出 electron builder 配置文件
    fse.outputJsonSync('./build/electron-builder.json', electronBuilder, {spaces: 4});
    console.log(`    ${chalk.green(chalk.bold('✓'))} 创建 ${chalk.underline('./build/electron-builder.json')}`);

    if (!isSkipBuild) {
        const appPkg = Object.assign({
            name: config.name,
            productName: config.name,
            displayName: config.productName,
            version: config.version,
            description: config.description,
            main: './main.js',
            author: config.author,
            homepage: config.homepage,
            company: config.company,
            license: config.license,
            bugs: config.bugs,
            repository: config.repository,
            buildTime: new Date(),
            buildVersion: config.buildVersion,
            configurations: config.configurations
        }, config.pkg || null);

        // 输出应用 package.json 文件
        fse.outputJsonSync('./app/package.json', Object.assign({}, createPackageObj(), appPkg), {spaces: 4});
        console.log(`    ${chalk.green(chalk.bold('✓'))} 创建 ${chalk.underline('./app/package.json')}`);

        // 输出 manifest 文件
        fse.outputJsonSync('./app/manifest.json', {
            name: config.productName,
            start_url: 'index.html',
            display: 'standalone',
            background_color: '#fff',
            theme_color: '#3f51b5',
            description: config.description,
            icons: [{
                src: 'resources/icons/48x48.png',
                sizes: '48x48',
                type: 'image/png'
            }, {
                src: 'resources/icons/64x64.png',
                sizes: '64x64',
                type: 'image/png'
            }, {
                src: 'resources/icons/96x96.png',
                sizes: '96x96',
                type: 'image/png'
            }, {
                src: 'resources/icons/128x128.png',
                sizes: '128x128',
                type: 'image/png'
            }, {
                src: 'resources/icons/144x144.png',
                sizes: '144x144',
                type: 'image/png'
            }, {
                src: 'resources/icons/192x192.png',
                sizes: '192x192',
                type: 'image/png'
            }, {
                src: 'resources/icons/256x256.png',
                sizes: '256x256',
                type: 'image/png'
            }, {
                src: 'resources/icons/512x512.png',
                sizes: '512x512',
                type: 'image/png'
            }],
        }, {spaces: 4});
        console.log(`    ${chalk.green(chalk.bold('✓'))} 创建 ${chalk.underline('./app/manifest.json')}`);

        // 输出 index.build.html 文件
        electronIndexHTML = fse.readFileSync('./app/index.html', {encoding: 'utf-8'});
        fse.writeFileSync('./app/index.html', electronIndexHTML.replace(/<title>(.*)<\/title>/g, `<title>${config.productName}</title>`), {encoding: 'utf-8'});
        console.log(`    ${chalk.green(chalk.bold('✓'))} 更新 ${chalk.underline('./app/index.html')}`);
    }
    console.log();
};

// 生成 app/package.json 对象
const createPackageObj = () => ({
    name: pkg.name,
    productName: pkg.name,
    displayName: pkg.productName,
    version: pkg.version,
    description: pkg.description,
    main: './main.js',
    author: pkg.author,
    homepage: pkg.homepage,
    company: pkg.company,
    license: pkg.license,
    bugs: pkg.bugs,
    repository: pkg.repository,
    dependencies: pkg.appDependencies || {}
});

// 还原项目目录下的 package.json 文件
const revertConfigFiles = () => {
    fse.outputJsonSync('./app/package.json', createPackageObj(), {spaces: 4});
    console.log(`    ${chalk.green(chalk.bold('✓'))} 还原 ${chalk.underline('./app/package.json')}`);

    fse.outputFileSync(path.resolve(__dirname, '../app/style/custom.less'), '');
    console.log(`    ${chalk.green(chalk.bold('✓'))} 移除自定义样式 ${chalk.underline(path.resolve(__dirname, '../app/style/custom.less'))}`);

    fse.outputFileSync(path.resolve(__dirname, '../app/index.html'), electronIndexHTML.replace(/<title>(.*)<\/title>/g, `<title>${pkg.productName}</title>`), {encoding: 'utf-8'});
    console.log(`    ${chalk.green(chalk.bold('✓'))} 还原 ${chalk.underline(path.resolve(__dirname, '../app/index.html'))}`);
};

// 处理和编译应用源文件
const buildApp = (isBrowser = false) => {
    if (!isBrowser) {
        console.log(`${chalk.cyanBright(chalk.bold(`❖ 处理和编译应用源文件${isBrowser ? '[browser]' : isDebug ? ' [debug]' : ''}:`))}\n`);
    }
    return new Promise((resolve, reject) => {
        if (config.stylePath) {
            console.log(`${chalk.yellow(chalk.bold(`    [${isBrowser ? '浏览器端：' : ''}处理自定义样式]`))}`);
            fse.outputFileSync(path.resolve(__dirname, '../app/style/custom.less'), `@import "${path.resolve(configDirPath || __dirname, config.stylePath)}";`);
            console.log(`    ${chalk.green(chalk.bold('✓'))} 合并自定义样式 ${chalk.underline(path.resolve(configDirPath || __dirname, config.stylePath))} → ${chalk.underline(path.resolve(__dirname, '../app/style/custom.less'))}`);
            console.log();
        }
        console.log(`${chalk.yellow(chalk.bold(`    [${isBrowser ? '浏览器端：' : ''}使用 Webpack 进行编译]`))}`);
        printEstimateInfo(isBrowser ? 'webpack-browser' : 'webpack-electron');
        if (verbose) {
            console.log(chalk.yellow('══════════════════════════════════════════════════════════════'));
        }
        const cmd = spawn('npm', ['run', isBrowser ? 'build-browser' : isDebug ? 'build-debug' : 'build'], {shell: true, env: process.env, stdio: verbose ? 'inherit' : 'ignore'});
        cmd.on('close', code => {
            if (verbose) {
                console.log(chalk.yellow('══════════════════════════════════════════════════════════════'));
            }
            if (config.stylePath) {
                fse.outputFileSync(path.resolve(__dirname, '../app/style/custom.less'), '');
                console.log(`    ${chalk.green(chalk.bold('✓'))} 移除自定义样式 ${chalk.underline(path.resolve(__dirname, '../app/style/custom.less'))}`);
            }
            console.log(`    ${chalk.green(chalk.bold('✓'))} 编译完成 [result code: ${code}]`);
            printConsumeInfo(isBrowser ? 'webpack-browser' : 'webpack-electron');
            console.log();
            resolve(code);
        });
        cmd.on('error', spawnError => reject(spawnError));
    });
};

// 制作安装包
const createPackage = (osType, arch, debug = isDebug) => {
    return new Promise((resolve, reject) => {
        const params = [`--${osType}`];
        if (arch) {
            params.push(`--${arch === 'x32' ? 'ia32' : arch}`);
        }

        spawn('build', params, {
            shell: true,
            env: Object.assign({}, process.env, {
                SKIP_INSTALL_EXTENSIONS: debug ? 1 : 0,
                PKG_ARCH: arch.includes('32') ? '32' : '64',
                PKG_BETA: isBeta ? '.beta' : '',
                PKG_DEBUG: debug ? '.debug' : '',
            }),
            stdio: verbose ? 'inherit' : 'ignore'
        })
            .on('close', async code => {
                if (config.buildZip && osType !== 'mac') {
                    const zipDir = path.join(packagesPath, osType === 'mac' ? 'mac' : (arch.includes('32') ? `${osType}-ia32-unpacked` : `${osType}-unpacked`)); // eslint-disable-line
                    const zipFileName = getArtifactName(osType, arch, 'zip', `${osType}Zip`);
                    const zipFile = path.join(packagesPath, zipFileName);
                    await createZipFromDir(zipFile, zipDir, (config.zipSubDir && osType !== 'mac') ? (typeof config.zipSubDir === 'string' ? config.zipSubDir : config.name) : false); // eslint-disable-line
                    console.log(`    ${chalk.green(chalk.bold('✓'))} 创建压缩包 ${chalk.underline(path.relative(appRootPath, zipFile))}`);
                }
                resolve(code);
            })
            .on('error', spawnError => reject(spawnError));
    });
};

// 制作浏览器端安装包
const buildBrowser = async (destRoot) => {
    await buildApp(true);

    const copyDist = () => copyFiles('./app/web-dist/**/*', `${destRoot}/dist`);
    const copyMedia = () => copyFiles('./app/media/**/*', `${destRoot}/media`);
    const copyAssets = () => copyFiles('./app/assets/**/*', `${destRoot}/assets`);
    const copyIndexHTML = () => copyFiles('./app/index.html', destRoot);
    const copyPKG = () => copyFiles('./app/package.json', destRoot);
    const copyManifest = () => copyFiles('./app/manifest.json', destRoot);
    const copyIcons = () => copyFiles('./resources/**/*', `${destRoot}/resources`);
    const copyLang = () => copyFiles('./app/lang/**/*', destRoot);

    await Promise.all([copyDist(), copyMedia(), copyAssets(), copyIndexHTML(), copyPKG(), copyManifest(), copyIcons(), copyLang()]);

    // 创建 zip
    const zipFile = path.resolve(destRoot, '../', `${config.name}.${config.version}.${isBeta ? 'beta.' : ''}${isDebug ? 'debug.' : ''}browser.zip`);
    await createZipFromDir(zipFile, destRoot, false);
    console.log(`    ${chalk.green(chalk.bold('✓'))} 创建压缩包 ${chalk.underline(zipFile)}`);
};

// 执行打包
const build = async (callback) => {
    if (config.copyOriginMedia && config.mediaPath !== 'media/') {
        console.log(`${chalk.cyanBright(chalk.bold('❖ 处理自定义媒体文件:'))}\n`);
        const mediaBuildPath = path.resolve(__dirname, '../app/media-build');

        await fse.emptyDir(mediaBuildPath);
        console.log(`    ${chalk.green(chalk.bold('✓'))} 清空 ${chalk.underline(mediaBuildPath)}`);

        await fse.copy(path.resolve(__dirname, '../app/media'), mediaBuildPath, {overwrite: true});
        console.log(`    ${chalk.green(chalk.bold('✓'))} 复制 ${chalk.underline(path.resolve(__dirname, '../app/media'))} → ${chalk.underline(mediaBuildPath)}`);

        await fse.copy(path.resolve(configDirPath || __dirname, config.mediaPath), mediaBuildPath, {overwrite: true});
        console.log(`    ${chalk.green(chalk.bold('✓'))} 复制 ${chalk.underline(path.resolve(configDirPath || __dirname, config.mediaPath))} → ${chalk.underline(mediaBuildPath)}`);

        console.log();
    }

    let packageNum = 1;
    let packedNum = 0;
    const buildPlatforms = platforms;
    const archTypes = archs;
    const needPackageBrowser = buildPlatforms.includes('browser');
    const onlyPackageBrowser = needPackageBrowser && buildPlatforms.length === 1;

    console.log(`${chalk.cyanBright(chalk.bold('❖ 制作安装包:'))}\n`);

    if (isClean) {
        fse.emptyDirSync(packagesPath);
        console.log(`    ${chalk.green(chalk.bold('✓'))} 已清空目录安装包存储目录 ${chalk.underline(packagesPath)}\n`);
    }

    if (needPackageBrowser) {
        console.log(`${chalk.yellow(chalk.bold(`    [${packageNum++}.正在制作浏览器端部署包]`))}`);
        printEstimateInfo('package-browser');
        console.log();
        await buildBrowser(path.join(packagesPath, 'browser'));
        console.log(`    ${chalk.green(chalk.bold('✓'))} 已完成浏览器部署包\n`);
        printConsumeInfo('package-browser');

        packedNum++;
    }

    if (!onlyPackageBrowser) {
        await buildApp();
    }

    if (!onlyPackageBrowser) {
        for (let i = 0; i < buildPlatforms.length; ++i) {
            const platform = buildPlatforms[i];
            if (platform === 'browser') {
                continue;
            }

            for (let j = 0; j < archTypes.length; ++j) {
                const arch = archTypes[j];
                console.log(`${chalk.yellow(chalk.bold(`    [${packageNum}.正在制作安装包，平台 ${platform}，架构 ${arch}]`))}`);

                packageNum++;
                if (buildPlatforms[i] === 'mac' && archTypes[j] === 'x32') {
                    console.log(`    ${chalk.red(chalk.bold('𐄂'))} 不支持制作此平台安装包： ${platform}-${arch}\n`);
                    continue;
                }

                printEstimateInfo(`package-${platform}-${arch}`);

                if (verbose) {
                    console.log(chalk.yellow('══════════════════════════════════════════════════════════════'));
                }
                // eslint-disable-next-line no-await-in-loop
                await createPackage(platform, arch, isDebug);

                if (verbose) {
                    console.log(chalk.yellow('══════════════════════════════════════════════════════════════'));
                }
                console.log(`    ${chalk.green(chalk.bold('✓'))} 已完成 ${chalk.bold(platform)}-${chalk.bold(arch)}\n`);
                printConsumeInfo(`package-${platform}-${arch}`);
                console.log();

                packedNum++;
            }
        }
    }

    console.log(chalk.green(`    ${chalk.bold('✓')} 共计 ${packedNum} 个平台的安装包制作完成，安装包已存放在如下位置：`));
    console.log(`      ${chalk.bold('→')} ${chalk.underline(chalk.bold(packagesPath))}`);

    if (callback) {
        callback();
    }
};

const printEstimateSummary = () => {
    const buildPlatforms = platforms;
    const archTypes = archs;
    const needPackageBrowser = buildPlatforms.includes('browser');
    const onlyPackageBrowser = needPackageBrowser && buildPlatforms.length === 1;

    let costTime = 1000;
    if (!isSkipBuild) {
        if (needPackageBrowser) {
            costTime += getTimeCost('package-browser');
        }
        if (!onlyPackageBrowser) {
            costTime += getTimeCost('webpack-electron');
            for (let i = 0; i < buildPlatforms.length; ++i) {
                const platform = buildPlatforms[i];
                if (platform === 'browser') {
                    continue;
                }

                for (let j = 0; j < archTypes.length; ++j) {
                    const arch = archTypes[j];
                    costTime += getTimeCost(`package-${platform}-${arch}`);
                }
            }
        }
        console.log(`    ${chalk.bold(chalk.magentaBright('♥︎'))} 预计完成所有操作耗时 ${chalk.bold(chalk.red(formatTime(costTime)))}...\n`);
    }
    return costTime;
};

// 执行脚本任务
const main = async () => {
    const startTime = new Date().getTime();
    const estimateTime = printEstimateSummary();

    outputConfigFiles();

    if (!isSkipBuild) {
        await build();
    }
    revertConfigFiles();

    saveTimeCostMap();

    console.log(`    ${chalk.bold(chalk.magentaBright('⇒'))} 所有操作完成实际耗时 ${chalk.bold(chalk.red(formatTime(new Date().getTime() - startTime)))}，预计耗时 ${chalk.bold(formatTime(estimateTime))}`);
};

main();
