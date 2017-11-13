import React, {Component, PropTypes} from 'react';
import HTML from '../../utils/html-helper';
import App from '../../core';

class MessageContentTextView extends Component {
    static propTypes = {
        className: PropTypes.string,
        message: PropTypes.object.isRequired,
        contentConverter: PropTypes.func,
    };

    static defaultProps = {
        className: null,
        contentConverter: null,
    };

    render() {
        let {
            message,
            className,
            contentConverter,
            ...other
        } = this.props;

        const content = message.renderedTextContent(App.im.ui.linkMembersInText);

        return (<div
            {...other}
            className={HTML.classes('app-message-content-text markdown-content', className, {
                'is-content-block': message.isBlockContent
            })}
            dangerouslySetInnerHTML={{__html: contentConverter ? contentConverter(content) : content}}
        />);
    }
}

export default MessageContentTextView;
