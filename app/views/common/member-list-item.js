import React, {Component, PropTypes} from 'react';
import HTML from '../../utils/html-helper';
import {UserAvatar} from './user-avatar';
import StatusDot from './status-dot';
import Member from '../../core/models/member';
import replaceViews from '../replace-views';

class MemberListItem extends Component {
    static get MemberListItem() {
        return replaceViews('common/member-list-item', MemberListItem);
    }

    static propTypes = {
        member: PropTypes.instanceOf(Member).isRequired,
        avatarSize: PropTypes.number,
        showStatusDot: PropTypes.bool,
        className: PropTypes.string,
        avatarClassName: PropTypes.string,
        title: PropTypes.any,
        children: PropTypes.any,
    }

    static defaultProps = {
        avatarSize: 30,
        showStatusDot: true,
        className: 'flex-middle',
        avatarClassName: null,
        title: null,
        children: null,
    };

    render() {
        const {
            member,
            avatarSize,
            avatarClassName,
            showStatusDot,
            className,
            children,
            title,
            ...other
        } = this.props;

        let titleView = null;
        if (title) {
            if (React.isValidElement(title)) {
                titleView = title;
            } else {
                titleView = <div className="title">{title}</div>;
            }
        } else {
            titleView = <div className="title">{member.displayName}</div>;
        }

        return (<a
            {...other}
            className={HTML.classes('app-member-list-item item', className)}
        >
            <UserAvatar className={avatarClassName} size={avatarSize} user={member} />
            {showStatusDot && <StatusDot status={member.status} />}
            {titleView}
            {children}
        </a>);
    }
}

export default MemberListItem;
