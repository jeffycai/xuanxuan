import React, {Component, PropTypes} from 'react';
import HTML from '../utils/html-helper';
import Icon from './icon';
import Heading from './heading';
import ListItem from './list-item';

/**
 * GroupList component
 *
 * @export
 * @class GroupList
 * @extends {Component}
 */
export default class GroupList extends Component {
    /**
     * Default properties values
     *
     * @static
     * @memberof GroupList
     * @return {Object}
     */
    static defaultProps = {
        headingCreator: null,
        itemCreator: null,
        group: null,
        className: null,
        children: null,
        defaultExpand: true,
        toggleWithHeading: true,
        collapseIcon: 'chevron-right',
        expandIcon: 'chevron-down',
        hideEmptyGroup: true
    }

    /**
     * Properties types
     *
     * @static
     * @memberof GroupList
     * @return {Object}
     */
    static propTypes = {
        headingCreator: PropTypes.func,
        itemCreator: PropTypes.func,
        group: PropTypes.object,
        className: PropTypes.string,
        children: PropTypes.any,
        defaultExpand: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
        toggleWithHeading: PropTypes.bool,
        hideEmptyGroup: PropTypes.bool,
        collapseIcon: PropTypes.string,
        expandIcon: PropTypes.string,
    }

    static render(list, props) {
        return list.map((item, index) => {
            if (item.type === 'group' || item.list) {
                if (props.hideEmptyGroup && (!item.list || !item.list.length)) {
                    return null;
                }
                return (<GroupList
                    key={item.id || index}
                    group={(props && props.listConverter) ? props.listConverter(item) : item}
                    itemCreator={props && props.itemCreator}
                    toggleWithHeading={props && props.toggleWithHeading}
                    headingCreator={props && props.headingCreator}
                    defaultExpand={props && props.defaultExpand}
                    expandIcon={props && props.expandIcon}
                    collapseIcon={props && props.collapseIcon}
                    hideEmptyGroup={props && props.hideEmptyGroup}
                />);
            }
            if (props && props.itemCreator) {
                return props && props.itemCreator(item, index);
            }
            return <ListItem key={item.id || index} {...item} />;
        });
    }

    constructor(props) {
        super(props);
        let {defaultExpand} = props;
        if (typeof defaultExpand === 'function') {
            defaultExpand = defaultExpand(props.group, this);
        }
        this.state = {
            expand: defaultExpand
        };
    }

    toggle(expand, callback) {
        if (expand === undefined) {
            expand = !this.state.expand;
        }
        this.setState({expand}, callback);
    }

    expand(callback) {
        this.toggle(true, callback);
    }

    collapse(callback) {
        this.toggle(false, callback);
    }

    handleHeadingClick = e => {
        this.toggle();
    }

    /**
     * React render method
     *
     * @returns
     * @memberof GroupList
     */
    render() {
        const {
            headingCreator,
            hideEmptyGroup,
            itemCreator,
            group,
            toggleWithHeading,
            defaultExpand,
            expandIcon,
            collapseIcon,
            className,
            children,
            ...other
        } = this.props;

        const {
            title,
            list,
        } = group;

        let headingView = null;
        if (headingCreator) {
            headingView = headingCreator(group, this);
        } else if (title) {
            if (React.isValidElement(title)) {
                headingView = title;
            } else if (typeof title === 'object') {
                headingView = <Heading {...title} />;
            } else if (title) {
                const icon = this.state.expand ? expandIcon : collapseIcon;
                let iconView = null;
                if (icon) {
                    if (React.isValidElement(icon)) {
                        iconView = icon;
                    } else if (typeof icon === 'object') {
                        iconView = <Icon {...icon} />;
                    } else {
                        iconView = <Icon name={icon} />;
                    }
                }
                headingView = (<header onClick={toggleWithHeading ? this.handleHeadingClick : null} className="heading">
                    {iconView}
                    <div className="title">{title}</div>
                </header>);
            }
        }

        return (<div
            className={HTML.classes('app-group-list list', className, {'is-expand': this.state.expand, 'is-collapse': !this.state.expand})}
            {...other}
        >
            {headingView}
            {this.state.expand && list && GroupList.render(list, this.props)}
            {children}
        </div>);
    }
}
