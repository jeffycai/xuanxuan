import ContextMenu from '../components/context-menu';
import timeSquence from '../utils/time-sequence';
import Lang from './lang';
import {isWebUrl} from '../utils/html-helper';
import platform from '../platform';

/**
 * 平台提供的剪切板功能访问对象
 * @type {Object}
 * @private
 */
const clipboard = platform.access('clipboard');

/**
 * 平台提供的通用界面交互访问对象
 * @type {Object}
 * @private
 */
const platformUI = platform.access('ui');

/**
 * 存储所有上下文菜单生成器
 * @type {Object<string, Object>}
 * @private
 */
const contextMenuCreators = {};

/**
 * 判断一个上下文菜单项目是否是分隔线
 * @param {string|Object} item 要判断的上下文菜单项
 * @return {boolean}
 * @private
 */
const isDividerItem = item => {
    return item === 'divider' || item === '-' || item === 'separator' || item.type === 'divider';
};

/**
 * 判定上下文菜单项列表最后一项是否为分隔线，如果是则移除它
 * @param {Object[]} items 上下文菜单项列表
 * @return {Object[]} 修改后的上下文菜单项列表
 */
export const tryRemoveLastDivider = items => {
    if (items.length && isDividerItem(items[items.length - 1])) {
        items.pop();
    }
    return items;
};

/**
 * 判定上下文菜单项列表最后一项是否为分隔线，如果不是则添加一个分隔线项目到列表末尾
 * @param {Object[]} items 上下文菜单项列表
 * @return {Object[]} 修改后的上下文菜单项列表
 */
export const tryAddDividerItem = items => {
    if (items.length && !isDividerItem(items[items.length - 1])) {
        items.push('divider');
    }
    return items;
};

/**
 * 判定给定的上下文菜单生成器是否符合给定的名称
 * @param {Object<string, any>} creator 要判断的上下文菜单生成器
 * @param {?Function(context: Object)} creator.create 生成菜单项列表的回调函数，create 和 items 属性只能设置一个
 * @param {?Object[]} creator.items 固定的菜单项列表，create 和 items 属性只能设置一个
 * @param {?string} creator.id 生成器 ID，如果不指定则自动生成
 * @param {string|string[]} creator.match 匹配的上下文名称，多个上下文名称通过字符串数组或者使用英文逗号拼接为一个字符串
 * @param {?Function(context: Object)} createFunc 生成菜单项列表的回调函数
 * @param {string} contextName 上下文菜单名称
 * @return {boolean}
 */
export const isCreatorMatch = (creator, contextName) => {
    if (typeof creator.match === 'string') {
        creator.match = creator.match.split(',');
    }
    if (Array.isArray(creator.match)) {
        creator.match = new Set(creator.match);
    }
    return creator.match && creator.match.has(contextName);
};

/**
 * 通过上下文菜单生成器生成菜单项列表
 * @param {Object<string, any>} creator 上下文菜单生成器
 * @param {?Function(context: Object)} creator.create 生成菜单项列表的回调函数，create 和 items 属性只能设置一个
 * @param {?Object[]} creator.items 固定的菜单项列表，create 和 items 属性只能设置一个
 * @param {?string} creator.id 生成器 ID，如果不指定则自动生成
 * @param {string|string[]} creator.match 匹配的上下文名称，多个上下文名称通过字符串数组或者使用英文逗号拼接为一个字符串
 * @param {?Function(context: Object)} createFunc 生成菜单项列表的回调函数
 * @param {Object} context 上下文参数对象
 * @return {Object[]}
 */
const getMenuItemsFromCreator = (creator, context) => {
    const menuItems = creator.items || [];
    if (creator.create) {
        const newItems = creator.create(context);
        if (newItems && newItems.length) {
            menuItems.push(...newItems);
        }
    }
    return menuItems;
};

/**
 * 通过内部上下文菜单生成器获取指定上下文名称对应的上下文菜单项列表
 * @param {sring} contextName 上下文名称
 * @param {Object} context 上下文参数对象
 * @return {Object[]}
 */
const getInnerMenuItemsForContext = (contextName, context) => {
    const items = [];
    Object.keys(contextMenuCreators).forEach(creatorId => {
        const creator = contextMenuCreators[creatorId];
        if (isCreatorMatch(creator, contextName)) {
            const newItems = getMenuItemsFromCreator(creator, context);
            if (newItems.length) {
                tryAddDividerItem(items).push(...newItems);
            }
        }
    });
    return items;
};

/**
 * 将一个上下文菜单生成器注册到系统
 * @param {Object<string, any>} creator 上下文菜单生成器
 * @param {function(context: Object)} creator.create 生成菜单项列表的回调函数，create 和 items 属性只能设置一个
 * @param {?Object[]} creator.items 固定的菜单项列表，create 和 items 属性只能设置一个
 * @param {?string} creator.id 生成器 ID，如果不指定则自动生成
 * @param {string|string[]} creator.match 匹配的上下文名称，多个上下文名称通过字符串数组或者使用英文逗号拼接为一个字符串
 * @param {function(context: Object)} createFunc 生成菜单项列表的回调函数
 * @return {string} 生成器 ID
 */
export const addContextMenuCreator = (creator, createFunc) => {
    if (Array.isArray(creator)) {
        return creator.map(c => addContextMenuCreator(c));
    }
    if (typeof creator === 'string' || creator instanceof Set) {
        creator = {match: creator};
    }
    if (typeof createFunc === 'function') {
        creator.create = createFunc;
    } else if (Array.isArray(createFunc)) {
        creator.items = createFunc;
    }
    if (!creator.id) {
        creator.id = timeSquence();
    }
    if (typeof creator.match === 'string') {
        creator.match = creator.match.split(',');
    }
    if (Array.isArray(creator.match)) {
        creator.match = new Set(creator.match);
    }
    contextMenuCreators[creator.id] = creator;
    return creator.id;
};

/**
 * 从系统移除一个上下文菜单生成器
 * @param {string} creatorId 要移除的上下文生成器 ID
 * @returns {boolean} 如果返回 `true` 则为操作成功，否则为操作失败
 */
export const removeContextMenuCreator = creatorId => {
    if (contextMenuCreators[creatorId]) {
        delete contextMenuCreators[creatorId];
        return true;
    }
    return false;
};

/**
 * 获取指定上下文名称对应的上下文菜单项列表
 * @param {sring} contextName 上下文名称
 * @param {Object} [context={}] 上下文参数对象
 * @return {Object[]}
 */
export const getMenuItemsForContext = (contextName, context = {}) => {
    if (typeof contextName === 'string' && contextName.includes(',')) {
        contextName = contextName.split(',');
    }
    if (Array.isArray(contextName)) {
        const items = [];
        const {contexts, options} = context;
        let linkTarget = options && options.linkTarget;
        contextName.forEach(name => {
            name = name.trim();
            const theContext = Object.assign({}, context, contexts && contexts[name]);
            if (linkTarget && theContext.options && theContext.options.linkTarget) {
                linkTarget = false;
            } else if (theContext.options) {
                theContext.options.linkTarget = false;
            }
            items.push(...getMenuItemsForContext(name, theContext));
        });
        return items;
    }

    const {event, options} = context;
    const items = [];

    // Get context menu items for link target element
    let linkItemsCount = 0;
    if (event && options && options.linkTarget && contextName !== 'link') {
        const linkItems = getInnerMenuItemsForContext('link', context);
        if (linkItems && linkItems.length) {
            linkItemsCount = linkItems.length;
            items.push(...linkItems);
        }
    }

    // Get context menu items from inner creators
    const innerItems = getInnerMenuItemsForContext(contextName, context);
    if (innerItems && innerItems.length) {
        tryAddDividerItem(items).push(...innerItems);
    }

    // Get context menu items from extension creators
    if (global.ExtsRuntime && (!options || options.exts !== false)) {
        global.ExtsRuntime.exts.forEach(ext => {
            const extCreators = ext.getContextMenuCreators(context);
            if (extCreators && extCreators.length) {
                const extItems = [];
                extCreators.forEach(creator => {
                    if (isCreatorMatch(creator, contextName)) {
                        const newItems = getMenuItemsFromCreator(creator, context);
                        if (newItems.length) {
                            extItems.push(...newItems);
                        }
                    }
                });
                if (extItems.length) {
                    tryAddDividerItem(items);
                    extItems.forEach(extItem => {
                        items.push(ext.formatContextMenuItem(extItem));
                    });
                }
            }
        });
    }

    const textSelectItems = [];

    if (options && options.copy && platformUI.copySelectText) {
        let selectedText = document.getSelection().toString().trim();
        if (selectedText) {
            const newLinePos = selectedText.indexOf('\n');
            if (newLinePos > -1) selectedText = selectedText.substr(0, newLinePos);
            if (selectedText.length > 20) {
                selectedText = `${selectedText.substr(0, 20)}...`;
            }
            if (linkItemsCount < 3) {
                textSelectItems.push({
                    label: Lang.format('menu.copy.select', selectedText),
                    click: platformUI.copySelectText
                });
            }
        }
    }
    if (options && options.selectAll && platformUI.selectAllText) {
        textSelectItems.push({
            label: Lang.string('menu.selectAll'),
            icon: 'mdi-select',
            click: platformUI.selectAllText
        });
    }
    if (textSelectItems.length) {
        tryAddDividerItem(items).push(...textSelectItems);
    }

    return items;
};

/**
 * 在界面上显示上下文菜单
 * @param {string} contextName 上下文名称
 * @param {!Object} context 上下文参数对象
 * @param {!Event} context.event 触发上下文菜单的界面事件（例如用户点击事件）
 * @return {boolean} 如果为 `true` 则成功显示上下文菜单，如果为 `false` 则无法显示上下文菜单
 */
export const showContextMenu = (contextName, context) => {
    if (!context) {
        throw new Error('Context must be set.');
    }
    if (context instanceof Event) {
        context = {event: context};
    }
    const {event, options, callback} = context;
    if (!event) {
        throw new Error('Context and context.event must be set.');
    }

    const items = getMenuItemsForContext(contextName, context);

    if (DEBUG) {
        console.collapse('ContextMenu', 'greenBgLight', contextName, 'greenPale');
        console.log('context', context);
        console.log('items', items);
        console.log('contextMenuCreators', contextMenuCreators);
        console.groupEnd();
    }

    if (items.length) {
        if (event) {
            if ((!options || options.preventDefault !== false)) {
                event.preventDefault();
            }
            if ((!options || options.stopPropagation !== false)) {
                event.stopPropagation();
            }
        }
        if (options) {
            delete options.selectAll;
            delete options.copy;
            delete options.preventDefault;
            delete options.stopPropagation;
            delete options.linkTarget;
        }
        ContextMenu.show({x: event.clientX, y: event.clientY}, items, options, callback);
        return true;
    }
    return false;
};

// 添加链接上下文菜单生成器
addContextMenuCreator('link', context => {
    const {event, options, url} = context;
    const link = ((options && options.url ? options.url : (url || event.target.href)) || '').trim();
    if (isWebUrl(link)) {
        let linkText = document.getSelection().toString().trim();
        if (event && linkText === '') {
            linkText = event.target.innerText || (event.target.attributes.title ? event.target.attributes.title.value : '');
        }
        const items = [{
            label: Lang.string('common.openLink'),
            click: () => {
                platformUI.openExternal(link);
            },
            icon: 'mdi-open-in-new'
        }];
        if (clipboard && clipboard.writeText) {
            items.push({
                label: Lang.string('common.copyLink'),
                click: () => {
                    clipboard.writeText(link);
                },
                icon: 'mdi-link'
            });

            if (linkText && linkText !== link && `${linkText}/` !== link) {
                items.push({
                    label: Lang.format('common.copyFormat', linkText.length > 25 ? `${linkText.substr(0, 25)}…` : linkText),
                    click: () => {
                        clipboard.writeText(linkText);
                    },
                    icon: 'mdi-content-copy'
                });
            }
        }
        return items;
    }
});

if (clipboard && clipboard.writeText) {
    // 添加 Emoji 表情操作上下文菜单
    addContextMenuCreator('emoji', context => {
        const {emoji} = context;
        if (emoji) {
            return [{
                icon: 'mdi-emoticon-outline',
                label: Lang.string('common.copy'),
                click: () => {
                    clipboard.writeText(emoji);
                }
            }];
        }
    });
}
