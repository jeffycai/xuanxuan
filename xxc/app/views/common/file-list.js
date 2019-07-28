import React, {Component} from 'react';
import PropTypes from 'prop-types';
import HTML from '../../utils/html-helper';
import _FileListItem from './file-list-item';
import ListItem from '../../components/list-item';
import Lang from '../../core/lang';
import Config from '../../config';
import withReplaceView from '../with-replace-view';
/**
 * FileListItem 可替换组件形式
 * @type {Class<FileListItem>}
 * @private
 */
const FileListItem = withReplaceView(_FileListItem);

/**
 * FileList 组件 ，显示文件列表界面
 * @class FileList
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import FileList from './file-list';
 * <FileList />
 */
export default class FileList extends Component {
    /**
     * FileList 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof FileList
     */
    static replaceViewPath = 'common/FileList';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof FileList
     * @type {Object}
     */
    static propTypes = {
        files: PropTypes.array.isRequired,
        listItemProps: PropTypes.object,
        className: PropTypes.string,
        startPageSize: PropTypes.number,
        morePageSize: PropTypes.number,
        defaultPage: PropTypes.number,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof FileList
     * @static
     */
    static defaultProps = {
        className: null,
        listItemProps: null,
        startPageSize: Config.ui['page.start.size'] || 20,
        morePageSize: Config.ui['page.more.size'] || 20,
        defaultPage: 1,
    };

    /**
     * React 组件构造函数，创建一个 FileList 组件实例，会在装配之前被调用。
     * @see https://react.docschina.org/docs/react-component.html#constructor
     * @param {Object?} props 组件属性对象
     * @constructor
     */
    constructor(props) {
        super(props);

        /**
         * React 组件状态对象
         * @see https://react.docschina.org/docs/state-and-lifecycle.html
         * @type {object}
         */
        this.state = {page: props.defaultPage};
    }

    /**
     * 处理显示更多事件
     * @param {Event} event 事件对象
     * @memberof FileList
     * @private
     * @return {void}
     */
    handleRequestMorePage = () => {
        const {page} = this.state;
        this.setState({page: page + 1});
    };

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof FileList
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            files,
            className,
            listItemProps,
            startPageSize,
            morePageSize,
            defaultPage,
            ...other
        } = this.props;

        const listViews = [];
        if (files) {
            const {page} = this.state;
            const maxIndex = page ? Math.min(files.length, startPageSize + (page > 1 ? (page - 1) * morePageSize : 0)) : files.length;
            for (let i = 0; i < maxIndex; i += 1) {
                const file = files[i];
                let itemProps = null;
                if (typeof listItemProps === 'function') {
                    itemProps = listItemProps(file);
                } else {
                    itemProps = listItemProps;
                }
                listViews.push(<FileListItem {...itemProps} key={`${i}-${file.id}`} file={file} />);
            }
            const notShowCount = files.length - maxIndex;
            if (notShowCount) {
                listViews.push(<ListItem key="showMore" icon="chevron-double-down" className="flex-middle item muted" title={<span className="title small">{Lang.format('common.clickShowMoreFormat', notShowCount)}</span>} onClick={this.handleRequestMorePage} />);
            }
        }

        return (
            <div
                {...other}
                className={HTML.classes('app-file-list list', className)}
            >
                {listViews}
            </div>
        );
    }
}
