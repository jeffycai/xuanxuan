import React, {Component, PropTypes} from 'react';
import HTML from '../../utils/html-helper';
import Lang from '../../lang';
import SearchControl from '../../components/search-control';
import Button from '../../components/button';
import OpenedApp from '../../exts/opened-app';
import Exts from '../../exts';
import ExtensionListItem from './extension-list-item';
import App from '../../core';
import ExtensionDetailDialog from './extension-detail-dialog';

const extensionTypes = [
    {type: '', label: Lang.string('ext.extensions.all')},
    {type: 'app', label: Lang.string('ext.extensions.apps')},
    {type: 'plugin', label: Lang.string('ext.extensions.plugins')},
    {type: 'theme', label: Lang.string('ext.extensions.themes')},
];

export default class ExtensionsView extends Component {
    static propTypes = {
        className: PropTypes.string,
        app: PropTypes.instanceOf(OpenedApp).isRequired,
    };

    static defaultProps = {
        className: null,
    };

    constructor(props) {
        super(props);
        const {app} = props;
        this.state = {
            search: '',
            showInstalled: true,
            type: (app.params && app.params.type) ? app.params.type : ''
        };
    }

    componentDidMount() {
        this.onExtChangeHandler = Exts.all.onExtensionChange(() => {
            this.forceUpdate();
        });
    }

    componentWillUnmount() {
        App.events.off(this.onExtChangeHandler);
    }

    handleNavItemClick(extType) {
        this.props.app.params = {type: extType.type};
        this.setState({type: extType.type});
    }

    handleSearchChange = search => {
        this.setState({search});
    };

    handleSettingBtnClick(ext, e) {
        const menuItems = Exts.ui.createSettingContextMenu(ext);
        App.ui.showContextMenu({x: e.clientX, y: e.clientY, target: e.target}, menuItems);
        e.preventDefault();
        e.stopPropagation();
    }

    handleExtensionItemClick(ext, e) {
        ExtensionDetailDialog.show(ext);
    }

    handleInstallBtnClick = () => {
        Exts.ui.installExtension();
    }

    render() {
        const {
            className,
            app,
        } = this.props;

        const {search, type} = this.state;
        const extensions = search ? Exts.all.search(search, type) : Exts.all.getTypeList(type);

        return (<div className={HTML.classes('app-ext-extensions', className)}>
            <header className="app-ext-extensions-header has-padding heading divider">
                <nav className="nav">
                    {
                        extensionTypes.map(extType => {
                            return <a key={extType.type} onClick={this.handleNavItemClick.bind(this, extType)} className={extType.type === type ? 'active' : ''}>{extType.label}</a>;
                        })
                    }
                </nav>
                <div className="flex-auto">
                    <SearchControl onSearchChange={this.handleSearchChange} />
                </div>
                <nav className="toolbar flex-none">
                    <div className="nav-item has-padding-sm hint--left" data-hint={Lang.string('ext.extensions.installLocalExtTip')}>
                        <Button onClick={this.handleInstallBtnClick} className="rounded outline green hover-solid" icon="package-variant" label={Lang.string('ext.extensions.installLocalExtension')} />
                    </div>
                </nav>
            </header>
            <div className="app-exts-list list has-padding multi-lines with-avatar">
                <div className="heading">
                    <div className="title">{Lang.string(search ? 'ext.extensions.searchResult' : 'ext.extensions.installed')}{type ? ` - ${Lang.string('ext.type.' + type)}` : ''} ({extensions.length})</div>
                </div>
                {
                    extensions.map(ext => {
                        const onContextMenu = this.handleSettingBtnClick.bind(this, ext);
                        return (<ExtensionListItem
                            showType={!type}
                            key={ext.name}
                            onContextMenu={onContextMenu}
                            onSettingBtnClick={onContextMenu}
                            onClick={this.handleExtensionItemClick.bind(this, ext)}
                            className="item flex-middle"
                            extension={ext}
                        />);
                    })
                }
            </div>
        </div>);
    }
}
