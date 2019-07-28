import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import HTML from '../utils/html-helper';
import Icon from './icon';
import Avatar from './avatar';

/**
 * ListItem 组件 ，显示一个列表项
 * @class ListItem
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example
 * <ListItem />
 */
export default class ListItem extends PureComponent {
    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof ListItem
     * @type {Object}
     */
    static propTypes = {
        type: PropTypes.string,
        avatar: PropTypes.any,
        icon: PropTypes.any,
        title: PropTypes.any,
        subtitle: PropTypes.any,
        children: PropTypes.any,
        actions: PropTypes.any,
        className: PropTypes.string,
        divider: PropTypes.bool,
    }

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof ListItem
     * @static
     */
    static defaultProps = {
        avatar: null,
        icon: null,
        title: null,
        subtitle: null,
        children: null,
        actions: null,
        className: null,
        divider: false,
        type: 'a'
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ListItem
     * @return {ReactNode}
     */
    render() {
        const {
            type,
            avatar,
            icon,
            title,
            subtitle,
            children,
            actions,
            divider,
            className,
            ...other
        } = this.props;

        const iconView = Icon.render(icon);
        const avatarView = Avatar.render(avatar, iconView);

        let titleView = null;
        if (title) {
            if (React.isValidElement(title)) {
                titleView = title;
            } else if (title) {
                titleView = <div className="title">{title}</div>;
            }
        }
        let subtitleView = null;
        if (subtitle) {
            if (React.isValidElement(subtitle)) {
                subtitleView = subtitle;
            } else if (subtitle) {
                subtitleView = <div className="subtitle">{subtitle}</div>;
            }
        }
        let contentView = null;
        const multiLines = subtitleView || children;
        if (multiLines) {
            contentView = (<div className="content">
                {titleView}
                {subtitleView}
                {children}
            </div>);
        } else {
            contentView = titleView;
        }

        return React.createElement(type, {
            className: HTML.classes(
                'app-list-item',
                className,
                {divider, 'with-avatar': !!avatarView, 'multi-lines': multiLines}
            ),
            ...other
        }, avatarView, iconView, contentView, actions);
    }
}
