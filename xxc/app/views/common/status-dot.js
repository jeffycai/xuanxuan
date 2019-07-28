import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {classes, rem} from '../../utils/html-helper';
import {STATUS} from '../../core/models/member';
import Lang from '../../core/lang';
import App from '../../core';

/**
 * 状态颜色表
 * @type {Map<string, string>}
 * @private
 */
const statusColors = {
    unverified: '#ccc',
    disconnect: '#ccc',
    logined: '#18ffff',
    online: '#00e676',
    busy: '#ffab00',
    away: '#ff1744',
};

/**
 * StatusDot 组件 ，显示状态原典标识
 * @class StatusDot
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example
 * import StatusDot from './status-dot';
 * <StatusDot />
 */
export default class StatusDot extends PureComponent {
    /**
     * StatusDot 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof StatusDot
     */
    static replaceViewPath = 'common/StatusDot';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof StatusDot
     * @type {Object}
     */
    static propTypes = {
        size: PropTypes.number,
        className: PropTypes.string,
        label: PropTypes.any,
        style: PropTypes.object,
        status: PropTypes.any,
    }

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof StatusDot
     * @static
     */
    static defaultProps = {
        size: 14,
        className: 'circle',
        style: null,
        label: null,
        status: null,
    };

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof StatusDot
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        let {
            size,
            className,
            style,
            status,
            label,
            ...other
        } = this.props;

        if (App.profile.isUserOnline) {
            status = STATUS.getName(status);
        } else {
            status = 'disconnect';
        }
        style = Object.assign({
            backgroundColor: statusColors[status],
            border: '1px solid #fff'
        }, style);

        if (size) {
            size = rem(size);
            style.width = size;
            style.height = size;
        }

        const dotView = <span className={classes('inline-block status-dot', className, `status-${status}`)} style={style} {...other} />;

        if (label) {
            if (label === true) {
                label = Lang.string(`member.status.${status === 'unverified' ? 'offline' : status}`);
            }
            return <div className="app-member-status">{dotView} &nbsp; <span className="status-label muted">{label}</span></div>;
        }
        return dotView;
    }
}
