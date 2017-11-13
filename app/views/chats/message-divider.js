import React, {Component, PropTypes} from 'react';
import HTML from '../../utils/html-helper';
import DateHelper from '../../utils/date-helper';
import Lang from '../../lang';

class MessageDivider extends Component {
    static propTypes = {
        className: PropTypes.string,
        children: PropTypes.any,
        date: PropTypes.number,
    };

    static defaultProps = {
        className: null,
        date: null,
        children: null,
    };

    render() {
        const {
            date,
            className,
            children,
            ...other
        } = this.props;

        let dateStr = null;
        if (date) {
            dateStr = DateHelper.formatDate(date, 'YYYY-M-d');
            if (DateHelper.isToday(date)) {
                dateStr = `${Lang.string('time.today')} ${dateStr}`;
            } else if (DateHelper.isYestoday(date)) {
                dateStr = `${Lang.string('time.yestoday')} ${dateStr}`;
            }
        }

        return (<div className={HTML.classes('app-message-divider', className)} {...other}>
            <div className="content">{dateStr}{children}</div>
        </div>);
    }
}

export default MessageDivider;
