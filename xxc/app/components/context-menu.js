import React from 'react';
import Display from './display';
import {classes} from '../utils/html-helper';
import Icon from './icon';
import timeSequence from '../utils/time-sequence';

/**
 * 显示上下文菜单
 * @param {{x: Number, y: Number}} position 菜单显示位置，需要提供 X 和 Y 轴坐标
 * @param {!Object[]} menus 菜单项列表
 * @param {?Object} props DisplayLayer 组件属性
 * @param {?function} callback 操作完成时的回调函数
 * @return {DisplayLayer}
 * @function
 */
export const showContextMenu = (position, menus, props = {}, callback = null) => {
    let {
        className,
        onItemClick,
        menuClassName,
        itemClassName,
        content,
        style,
    } = props;

    if (!position && DEBUG) {
        throw new Error('Position is not defined to show the popover.');
    }

    if (!props.id) {
        props.id = timeSequence();
    }

    const handleItemClick = (item, idx, e) => {
        let clickResult = null;
        if (onItemClick) {
            clickResult = onItemClick(item, idx, e);
        }
        if (item.click) {
            clickResult = item.click(item, idx, e);
        }
        if (clickResult !== false) {
            Display.remove(props.id);
        }
    };
    let hasIconLeft = false;
    const itemsView = menus.map((item, idx) => {
        if (typeof item === 'string') {
            if (item === '-' || item === 'divider' || item === 'separator') {
                item = {type: 'divider'};
            } else {
                item = {label: item};
            }
        }
        const {
            id,
            className: thisItemClassName,
            hidden,
            click,
            url,
            render,
            type,
            disabled,
            data,
            icon,
            ...other
        } = item;
        if (hidden) {
            return null;
        }
        if (render) {
            return render(item);
        }
        if (type === 'divider' || type === 'separator') {
            return <div key={id || idx} className={classes('divider', thisItemClassName)} {...other} />;
        }
        const iconView = icon && Icon.render(icon, {className: 'item-left-icon'});
        if (iconView) {
            hasIconLeft = true;
        }
        return (
            <a href={url} onClick={handleItemClick.bind(null, item, idx)} key={id || idx} className={classes('item', itemClassName, thisItemClassName, {disabled})} {...other}>
                {iconView}
                {item.label && <span className="title">{item.label}</span>}
                {item.checked && <Icon name="check" />}
            </a>
        );
    });
    content = (
        <div className={classes('list dropdown-menu', menuClassName, {'has-icon-left': hasIconLeft})}>
            {itemsView}
            {content}
        </div>
    );

    const x = position.x || 0;
    const y = position.y || 0;
    style = Object.assign({
        maxWidth: window.innerWidth, maxHeight: window.innerHeight, left: x, top: y
    }, style);

    className = classes('contextmenu layer', className);

    props = Object.assign({backdropClassName: 'clean', animation: false}, props, {
        className, style, content, plugName: 'contextmenu'
    });
    delete props.menuClassName;  // eslint-disable-line
    delete props.itemClassName; // eslint-disable-line
    delete props.onItemClick; // eslint-disable-line

    return Display.show(props, display => {
        const ele = display.displayElement;
        let newX = x;
        let newY = y;
        const eleWidth = ele.clientWidth;
        const eleHeight = ele.clientHeight;

        if (position.direction) {
            switch (position.direction) {
            case 'top':
                newX -= eleWidth / 2;
                newY -= eleHeight;
                break;
            case 'top-left':
                newX -= eleWidth;
                newY -= eleHeight;
                break;
            case 'top-right':
                newY -= eleHeight;
                break;
            case 'left':
                newX -= eleWidth / 2;
                newY -= eleHeight / 2;
                break;
            case 'right':
                newY -= eleHeight / 2;
                break;
            case 'bottom':
                newX -= eleWidth / 2;
                break;
            case 'bottom-left':
                newX -= eleWidth;
                break;
            }
        }
        if (position.offsetX) {
            newX += position.offsetX;
        }
        if (position.offsetY) {
            newY += position.offsetY;
        }
        newX = Math.floor(Math.max(0, Math.min(window.innerWidth - eleWidth, newX)));
        newY = Math.floor(Math.max(0, Math.min(window.innerHeight - eleHeight, newY)));
        if (newX !== x || newY !== y) {
            display.setStyle({top: newY, left: newX, opacity: 1});
        } else {
            display.setStyle({opacity: 1});
        }
    }, callback);
};

export default {
    show: showContextMenu,
    hide: Display.hide,
    remove: Display.remove
};
