import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../../utils/html-helper';
import getFileIcon from '../../utils/mdi-file-icon';
import {formatBytes} from '../../utils/string-helper';
import {formatDate} from '../../utils/date-helper';
import Icon from '../../components/icon';
import Avatar from '../../components/avatar';
import Messager from '../../components/messager';
import Lang, {isJustLangSwitched} from '../../core/lang';
import App from '../../core';
import _UserAvatar from './user-avatar';
import FileData from '../../core/models/file-data';
import withReplaceView from '../with-replace-view';
import platform from '../../platform';

// 从平台功能访问对象获取功能模块对象
const {dialog, ui: platformUI} = platform.modules;

/**
 * UserAvatar 可替换组件形式
 * @type {Class<UserAvatar>}
 * @private
 */
const UserAvatar = withReplaceView(_UserAvatar);

/**
 * 检查当前平台是否是浏览器
 * @type {boolean}
 * @private
 */
const isBrowserPlatform = platform.isType('browser');

/**
 * FileListItem 组件 ，显示文件列表条目界面
 * @class FileListItem
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import FileListItem from './file-list-item';
 * <FileListItem />
 */
export default class FileListItem extends Component {
    /**
     * FileListItem 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof FileListItem
     */
    static replaceViewPath = 'common/FileListItem';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof FileListItem
     * @type {Object}
     */
    static propTypes = {
        file: PropTypes.object.isRequired,
        smallIcon: PropTypes.bool,
        showSender: PropTypes.bool,
        className: PropTypes.string,
        showDate: PropTypes.bool,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof FileListItem
     * @static
     */
    static defaultProps = {
        className: 'flex-middle',
        smallIcon: false,
        showSender: false,
        showDate: false,
    };

    /**
     * React 组件构造函数，创建一个 FileListItem 组件实例，会在装配之前被调用。
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
        this.state = {
            download: false,
            localPath: '',
        };
    }

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof FileListItem
     * @return {void}
     */
    componentDidMount() {
        this.checkLocalPath();
    }

    /**
     * React 组件生命周期函数：`shouldComponentUpdate`
     * 让React知道当前状态或属性的改变是否不影响组件的输出。默认行为是在每一次状态的改变重渲，在大部分情况下你应该依赖于默认行为。
     *
     * @param {Object} nextProps 即将更新的属性值
     * @param {Object} nextState 即将更新的状态值
     * @returns {boolean} 如果返回 `true` 则继续渲染组件，否则为 `false` 而后的 `UNSAFE_componentWillUpdate()`，`render()`， 和 `componentDidUpdate()` 将不会被调用
     * @memberof FileListItem
     */
    shouldComponentUpdate(nextProps, nextStates) {
        return isJustLangSwitched() || nextStates.download !== this.state.download || nextStates.localPath !== this.state.localPath || nextProps.className !== this.props.className || nextProps.smallIcon !== this.props.smallIcon || nextProps.showSender !== this.props.showSender || nextProps.showDate !== this.props.showDate || nextProps.file !== this.props.file || nextProps.file.send !== this.props.file.send || nextProps.file.id !== this.props.file.id || nextProps.file.name !== this.props.file.name;
    }

    /**
     * React 组件生命周期函数：`componentDidUpdate`
     * componentDidUpdate()会在更新发生后立即被调用。该方法并不会在初始化渲染时调用。
     *
     * @param {Object} prevProps 更新前的属性值
     * @param {Object} prevState 更新前的状态值
     * @see https://doc.react-china.org/docs/react-component.html#componentDidUpdate
     * @private
     * @memberof FileListItem
     * @return {void}
     */
    componentDidUpdate() {
        this.checkLocalPath();
    }

    /**
     * 检查文件在本地是否存在
     * @memberof FileListItem
     * @returns {boolean} 如果返回 `true` 则为存在，否则为不存在
     * @private
     */
    checkLocalPath() {
        const {localPath} = this.state;
        let {file} = this.props;
        file = FileData.create(file);
        if (!isBrowserPlatform && file.send === true && localPath !== false && !localPath) {
            App.im.files.checkCache(file).then(existsPath => {
                this.setState({localPath: existsPath});
            }).catch(error => {
                if (DEBUG) {
                    console.error('API.checkCache error', error);
                }
                this.setState({localPath: false});
            });
        }
    }

    /**
     * 处理点击下载按钮事件
     * @param {FileData} file 文件对象
     * @memberof FileListItem
     * @private
     * @return {void}
     */
    handleDownloadBtnClick(file) {
        if (dialog.showSaveDialog) {
            dialog.showSaveDialog({
                title: Lang.string('dialog.fileSaveTo'),
                filename: file.name
            }, filename => {
                if (filename) {
                    file.path = filename;
                    this.setState({download: 0});
                    App.im.files.downloadFile(file, progress => {
                        this.setState({download: progress});
                    }).then(theFile => {
                        this.setState({download: false, localPath: filename});
                        return Messager.show(Lang.format('file.fileSavedAt.format', filename), {
                            actions: [{
                                label: Lang.string('file.open'),
                                click: () => {
                                    platformUI.openFileItem(filename);
                                }
                            }, {
                                label: Lang.string('file.openFolder'),
                                click: () => {
                                    platformUI.showItemInFolder(filename);
                                }
                            }]
                        });
                    }).catch(error => {
                        this.setState({download: false});
                        if (error) {
                            Messager.show(Lang.error(error), {type: 'danger'});
                        }
                    });
                }
            });
        }
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof FileListItem
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        let {
            file,
            className,
            smallIcon,
            showSender,
            showDate,
            ...other
        } = this.props;

        file = FileData.create(file);

        const fileName = file.name;
        const ext = fileName.substr(fileName.lastIndexOf('.'));
        let fileStatus = null;
        let actions = null;
        if (file.send === false) {
            fileStatus = <span className="text-danger small">{Lang.string('file.uploadFailed')} </span>;
        } else if (typeof file.send === 'number') {
            const percent = Math.floor(file.send);
            actions = <Avatar className="avatar secondary outline small circle" label={`${percent}%`} />;
        } else if (file.send === true) {
            file.makeUrl(App.profile.user);
            if (isBrowserPlatform) {
                actions = <div className="hint--top" data-hint={Lang.string('file.download')}><a href={file.url} download={fileName} target="_blank" className="btn iconbutton text-primary rounded"><Icon name="download" /></a></div>;
            } else {
                const {localPath, download} = this.state;
                if (download !== false) {
                    fileStatus = <span className="text-primary small">{Lang.string('file.downloading')} </span>;
                    actions = <Avatar className="avatar secondary outline small circle" label={`${Math.floor(download)}%`} />;
                } else if (localPath) {
                    actions = [
                        <div key="action-open" className="hint--top" data-hint={Lang.string('file.open')}><button onClick={platformUI.openFileItem.bind(this, localPath)} type="button" className="btn iconbutton text-primary rounded"><Icon name="open-in-app" /></button></div>,
                        <div key="action-open-folder" className="hint--top-left" data-hint={Lang.string('file.openFolder')}><button onClick={platformUI.showItemInFolder.bind(this, localPath)} type="button" className="btn iconbutton text-primary rounded"><Icon name="folder-outline" /></button></div>,
                        <div key="action-download" className="hint--top" data-hint={Lang.string('file.download')}><button onClick={this.handleDownloadBtnClick.bind(this, file)} type="button" className="btn iconbutton text-primary rounded"><Icon name="download" /></button></div>
                    ];
                } else {
                    actions = <div className="hint--top" data-hint={Lang.string('file.download')}><button onClick={this.handleDownloadBtnClick.bind(this, file)} type="button" className="btn iconbutton text-primary rounded"><Icon name="download" /></button></div>;
                }
            }
        }

        const sender = showSender && file.senderId && App.members.get(file.senderId);

        return (
            <div
                {...other}
                className={classes('app-file-list-item item row flex-middle single', className)}
            >
                {smallIcon ? null : <Avatar skin={{code: ext, pale: true}} className="flex-none" icon={getFileIcon(ext)} />}
                <div className="content">
                    <div className="title">{fileName}</div>
                    <div className="sub-content">
                        {fileStatus}
                        {sender ? <span><UserAvatar size={16} user={sender} /> <small className="muted">{sender.displayName}</small></span> : null}
                        <span className="muted small">{formatBytes(file.size)}</span>
                        {showDate && <span className="small muted">{formatDate(file.date)}</span>}
                    </div>
                </div>
                {actions && <div className="actions">{actions}</div>}
            </div>
        );
    }
}
