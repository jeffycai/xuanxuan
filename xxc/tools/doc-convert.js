#!/usr/bin/env node

const chalk = require('chalk');
const program = require('commander');
const path = require('path');
const fse = require('fs-extra');

const ifEmptyStringThen = (text, defaultText) => {
    if (text === undefined || text === null || !text.length) {
        if (defaultText === null || defaultText === undefined) {
            defaultText = '';
        }
        return defaultText;
    }
    return text;
};
const defualtConversions = {
    upperCase: (text) => text.toUpperCase(),
    lowerCase: (text) => text.toLowerCase(),
    '??': ifEmptyStringThen,
    '>': (obj, key, defaultText) => {
        if (obj === null || typeof obj !== 'object') {
            obj = {};
        }
        return ifEmptyStringThen(obj[key], defaultText);
    },
    encodeURIComponent,
    decodeURIComponent
};

function replaceConfig(content, config, conversions, prefixKey) {
    config[''] = '';
    // eslint-disable-next-line no-restricted-syntax
    for (const key in config) {
        // eslint-disable-next-line no-prototype-builtins
        if (config.hasOwnProperty(key)) {
            let value = config[key];
            if (typeof value === 'function') {
                value = value();
            }
            if (typeof value === 'object' && value !== null) {
                content = replaceConfig(content, value, conversions, key);
            }
            const regStr = `\\$\\{(${(prefixKey !== undefined && prefixKey !== null) ? (`${prefixKey}\\.`) : ''}${key}:?[^\\}]*)\\}`;
            content = content.replace(new RegExp(regStr, 'g'), (_, match) => {
                const matchArr = match.split(':');
                let result = (value === null || value === undefined) ? '' : value;
                if (matchArr.length > 1) {
                    for (let i = 1; i < matchArr.length; ++i) {
                        const conversionInfo = matchArr[i].split(',');
                        const conversionName = conversionInfo.shift();
                        const conversion = conversions[conversionName] || defualtConversions[conversionName];
                        if (typeof conversion === 'function') {
                            conversionInfo.splice(0, 0, result);
                            result = conversion(...conversionInfo);
                        }
                    }
                }
                return result;
            });
        }
    }
    return content;
}

program
    .option('-c, --config <config>', '配置文件路径')
    .option('-s, --src <src>', '原文件路径')
    .option('-d, --dest <src>', '生成文件路径')
    .option('-t, --toc', '是否加入 toc 目录')
    .parse(process.argv);

let {src, dest} = program;
src = path.resolve(__dirname, src);
const fileName = path.basename(src);
if (!dest) {
    const fileNameArr = fileName.split('.');
    if (fileNameArr.length > 1) {
        fileNameArr[fileNameArr.length - 2] = `${fileNameArr[fileNameArr.length - 2]}-convert`;
    } else {
        fileNameArr[fileNameArr.length - 1] = `${fileNameArr[fileNameArr.length - 1]}-convert`;
    }
    dest = path.join(path.dirname(src), fileNameArr.join('.'));
}

const configFile = program.config;
const config = fse.readJsonSync(configFile, {throws: false});

let content = fse.readFileSync(src, {encoding: 'utf-8'});
content = replaceConfig(content, config, defualtConversions);

const lines = content.split('\n');
if (program.toc && !content.includes('[TOC]')) {
    lines.splice(lines[0].startsWith('# ') ? 1 : 0, 0, '\n[TOC]');
}
lines.forEach((line, index) => {
    if (line.startsWith('?> ') || line.startsWith('!> ')) {
        lines[index] = `>${line.substr(2)}`;
    }
    if (line.endsWith(' **')) {
        if (line.startsWith('## ** ')) {
            lines[index] = `## ${line.substr(6, line.length - 8)}`;
        } else if (line.startsWith('### ** ')) {
            lines[index] = `### ${line.substr(7, line.length - 9)}`;
        } else if (line.startsWith('#### ** ')) {
            lines[index] = `#### ${line.substr(8, line.length - 10)}`;
        } else if (line.startsWith('##### ** ')) {
            lines[index] = `##### ${line.substr(9, line.length - 11)}`;
        } else if (line.startsWith('###### ** ')) {
            lines[index] = `### ${line.substr(10, line.length - 12)}`;
        }
    }
});
content = lines.join('\n');

fse.outputFileSync(dest, content, {encoding: 'utf-8'});

console.log(chalk.green(`✓ ${chalk.underline(dest)}`));
