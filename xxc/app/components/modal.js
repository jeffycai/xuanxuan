import React from 'react';
import Display from './display';
import HTML from '../utils/html-helper';
import Icon from './icon';
import timeSequence from '../utils/time-sequence';
import Lang from '../core/lang';
import InputControl from './input-control';

/** @module modal */

/**
 * 检查应用运行的操作系统类型是否是 Windows
 * @type {boolean}
 * @private
 * @constant
 */
const isWindowsOS = window.navigator.userAgent.includes('Windows');

/**
 * 默认按钮类名
 * @type {Object}
 * @private
 */
const DEFAULT_CLASS_NAMES = {
    submit: 'primary',
    primary: 'primary',
    secondary: 'text-red red-pale',
    cancel: 'primary-pale text-primary'
};

/**
 * 显示对话框
 * @param {?Object} props DisplayLayer 组件属性
 * @param {?Function} callback 操作完成时的回调函数
 * @return {DisplayLayer}
 * @function
 */
export const showModal = (props = {}, callback = null) => {
    let {
        title,
        closeButton,
        actions,
        onAction,
        onSubmit,
        onCancel,
        className,
        headingClassName,
    } = props;

    if (closeButton === undefined) {
        closeButton = true;
    }

    if (!props.id) {
        props.id = timeSequence();
    }

    className = HTML.classes('modal layer rounded', className || '');

    if (actions === undefined) {
        actions = true;
    }
    if (actions === true) {
        actions = [{type: 'submit'}, {type: 'cancel'}];
    } else if (actions === 'submit') {
        actions = [{type: 'submit'}];
    } else if (actions === 'cancel') {
        actions = [{type: 'cancel'}];
    }
    let footer = null;
    if (actions && actions.length) {
        actions = actions.map((act, idx) => {
            if (!act.order) {
                act.order = idx;
                switch (act.type) {
                case 'submit':
                    act.order += isWindowsOS ? (-9000) : 9000;
                    break;
                case 'primary':
                    act.order += isWindowsOS ? (-8000) : 8000;
                    break;
                case 'secondary':
                    act.order += isWindowsOS ? (-7000) : 7000;
                    break;
                case 'cancel':
                    act.order += isWindowsOS ? (9000) : -9000;
                    break;
                }
            }
            if (act.type && !act.className) {
                act.className = DEFAULT_CLASS_NAMES[act.type];
            }
            if (!act.label && act.type) {
                act.label = act.type === 'submit' ? Lang.string('common.confirm') : act.type === 'cancel' ? Lang.string('common.cancel') : act.type.toUpperCase();
            }
            return act;
        });

        actions = actions.sort((act1, act2) => {
            return act1.order - act2.order;
        });

        const handleActionClick = (action, e) => {
            let actionResult = null;
            if (onAction) {
                actionResult = onAction(action, e);
            }
            if (onSubmit && action.type === 'submit') {
                actionResult = onSubmit(action, e);
            }
            if (onCancel && action.type === 'cancel') {
                actionResult = onCancel(action, e);
            }
            if (action.click) {
                actionResult = action.click(action, e);
            }
            if (actionResult !== false) {
                Display.hide(props.id);
            }
        };

        footer = (<footer className="footer toolbar">
            {
                actions.map((action, actionIndex) => {
                    return <button className={HTML.classes('btn', action.className, action.type ? `action-${action.type}` : null)} type="button" onClick={handleActionClick.bind(null, action)} key={action.id || actionIndex} title={action.label}>{action.label}</button>;
                })
            }
        </footer>);
    }

    const header = (title || closeButton) ? (<header className={HTML.classes('heading', headingClassName)}>
        <div className="title">{title}</div>
        {closeButton && <nav style={{overflow: 'visible'}} data-hint={Lang.string('common.close')} className="nav hint--bottom"><a className="close" onClick={() => (Display.remove(props.id))}><Icon name="close" /></a></nav>}
    </header>) : null;

    props = Object.assign({}, props, {className, header, footer, closeButton, plugName: 'modal'});
    delete props.title;
    delete props.closeButton;
    delete props.actions;
    delete props.onAction;
    delete props.onSubmit;
    delete props.onCancel;
    delete props.headingClassName;

    return Display.show(props, callback);
};

/**
 * 显示警告对话框
 * @param {String|ReactNode|Function} content 对话框内容
 * @param {?Object} props DisplayLayer 组件属性
 * @param {?Function} callback 操作完成时的回调函数
 * @return {DisplayLayer}
 * @function
 */
export const showAlert = (content, props, callback) => {
    return showModal(Object.assign({
        modal: true,
        content,
        actions: 'submit'
    }, props), callback);
};

/**
 * 显示确认对话框
 * @param {String|ReactNode|Function} content 对话框内容
 * @param {?Object} props DisplayLayer 组件属性
 * @param {?Function} callback 操作完成时的回调函数
 * @return {DisplayLayer}
 * @function
 */
export const showConfirm = (content, props, callback) => {
    return new Promise(resolve => {
        let resolved = false;
        showModal(Object.assign({
            closeButton: false,
            modal: true,
            content,
            actions: true,
            onAction: action => {
                if (!resolved) {
                    resolved = true;
                    resolve(action.type === 'submit');
                }
            },
            onHidden: () => {
                if (!resolved) {
                    resolve(false);
                }
            }
        }, props), callback);
    });
};

/**
 * 显示询问用户输入值的对话框
 * @param {String|ReactNode|Function} title 标题
 * @param {string} defaultValue 默认值
 * @param {?Object} props DisplayLayer 组件属性
 * @param {?Function} callback 操作完成时的回调函数
 * @return {DisplayLayer}
 * @function
 */
export const showPrompt = (title, defaultValue, props, callback) => {
    const inputProps = props && props.inputProps;
    const onSubmit = props && props.onSubmit;
    if (inputProps) {
        delete props.inputProps;
    }
    if (onSubmit) {
        delete props.onSubmit;
    }
    return new Promise(resolve => {
        let resolved = false;
        let value = defaultValue;
        showModal(Object.assign({
            closeButton: false,
            modal: true,
            title,
            content: <InputControl
                autoFocus
                defaultValue={defaultValue}
                onChange={newValue => {
                    value = newValue;
                }}
                {...inputProps}
            />,
            actions: true,
            onAction: action => {
                if (action.type === 'submit') {
                    if (onSubmit && onSubmit(value) === false) {
                        return false;
                    }
                    resolved = true;
                    resolve(value);
                }
            },
            onHidden: () => {
                if (!resolved) {
                    resolve(defaultValue);
                }
            }
        }, props), callback);
    });
};

export default {
    show: showModal,
    alert: showAlert,
    confirm: showConfirm,
    prompt: showPrompt,
    hide: Display.hide,
    remove: Display.remove
};
