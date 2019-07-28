import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../utils/html-helper';
import TabPane from './tab-pane';

/**
 * Tabs 组件 ，显示一个标签页控件
 * @class Tabs
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @property {string}  navClassName 导航类名
 * @example
 * <Tabs />
 */
export default class Tabs extends PureComponent {
    /**
     * 标签页面板组件
     * @constructor TabPane
     * @static
     * @memberof Tabs
     */
    static TabPane = TabPane;

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof Tabs
     * @type {Object}
     */
    static propTypes = {
        navClassName: PropTypes.string,
        activeClassName: PropTypes.string,
        tabPaneClass: PropTypes.string,
        contentClassName: PropTypes.string,
        className: PropTypes.string,
        children: PropTypes.any,
        cache: PropTypes.bool,
        defaultActivePaneKey: PropTypes.any,
        onPaneChange: PropTypes.func,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof Tabs
     * @static
     */
    static defaultProps = {
        navClassName: '',
        activeClassName: 'active',
        contentClassName: 'active',
        tabPaneClass: '',
        className: '',
        cache: false,
        defaultActivePaneKey: null,
        onPaneChange: null,
        children: null,
    };

    /**
     * React 组件构造函数，创建一个 Tabs 组件实例，会在装配之前被调用。
     * @see https://react.docschina.org/docs/react-component.html#constructor
     * @param {Object?} props 组件属性对象
     * @constructor
     */
    constructor(props) {
        super(props);

        /**
         * React 组件状态对象
         * @see https://react.docschina.org/docs/state-and-lifecycle.html
         * @member {object}
         */
        this.state = {
            activePaneKey: props.defaultActivePaneKey
        };
    }

    /**
     * 处理导航变更事件
     * @param {string} key 变更后的当前标签页 Key 值
     * @memberof Tabs
     * @private
     * @return {void}
     */
    handleNavClick(key) {
        const {activePaneKey} = this.state;
        if (key !== activePaneKey) {
            const oldKey = activePaneKey;
            this.setState({activePaneKey: key}, () => {
                const {onPaneChange} = this.props;
                if (onPaneChange) {
                    onPaneChange(key, oldKey);
                }
            });
        }
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof Tabs
     * @return {ReactNode}
     */
    render() {
        let {
            defaultActivePaneKey,
            cache,
            navClassName,
            tabPaneClass,
            activeClassName,
            contentClassName,
            onPaneChange,
            className,
            children,
            ...other
        } = this.props;

        const {activePaneKey} = this.state;

        if (!Array.isArray(children)) {
            children = [children];
        }

        return (
            <div className={classes('tabs', className)} {...other}>
                <nav className={classes('nav', navClassName)}>
                    {
                        children.map(item => {
                            return <a key={item.key} className={item.key === activePaneKey ? activeClassName : ''} onClick={this.handleNavClick.bind(this, item.key)}>{item.props.label}</a>;
                        })
                    }
                </nav>
                <div className={classes('content', contentClassName)}>
                    {
                        children.map(item => {
                            if (item.key === activePaneKey) {
                                return <div key={item.key} className={classes('tab-pane active', tabPaneClass)}>{item}</div>;
                            }
                            if (cache) {
                                return <div key={item.key} className={classes('tab-pane hidden', tabPaneClass)}>{item}</div>;
                            }
                            return null;
                        })
                    }
                </div>
            </div>
        );
    }
}

export {TabPane, Tabs};
