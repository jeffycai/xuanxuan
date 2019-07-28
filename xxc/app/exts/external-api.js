import React from 'react';
import ReactDOM from 'react-dom';
import ReactSplitPane from 'react-split-pane';
import EmojionePicker from 'emojione-picker';
import marked from 'marked';
import md5 from 'md5';
import extractZip from 'extract-zip';
import emojione from 'emojione';
import DraftJs from 'draft-js';
import compareVersions from 'compare-versions';
import hotkeys from 'hotkeys-js';
import pinyin from 'pinyin';
import uuid from 'uuid';
import HTMLParser from 'htmlparser';
import platform from '../platform';
import components from '../components';
import lang from '../core/lang';
import utils from '../utils';
import app from '../core';
import views from '../views/external';

/**
 * 所有第三方 node 模块
 * @type {Map<string, any>}
 */
const nodeModules = {
    React,
    ReactDOM,
    ReactSplitPane,
    EmojionePicker,
    marked,
    md5,
    fs: platform.access('fs'),
    extractZip,
    emojione,
    DraftJs,
    HTMLParser,
    compareVersions,
    hotkeys,
    pinyin,
    uuid,
    get jquery() {
        return __non_webpack_require__('jquery'); // eslint-disable-line
    }
};

/**
 * 导出开放给扩展的模块
 * @type {Map<string, any>}
 */
export default {
    lang,
    components,
    utils,
    platform,
    app,
    views,
    nodeModules,
};
