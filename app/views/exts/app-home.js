import React, {Component, PropTypes} from 'react';
import HTML from '../../utils/html-helper';
import Lang from '../../lang';
import AppAvatar from '../../components/app-avatar';
import SearchControl from '../../components/search-control';
import Button from '../../components/button';
import Exts from '../../exts';
import ROUTES from '../common/routes';
import App from '../../core';
import replaceViews from '../replace-views';

export default class AppHome extends Component {
    static get AppHome() {
        return replaceViews('exts/app-home', AppHome);
    }

    static propTypes = {
        className: PropTypes.string,
    };

    static defaultProps = {
        className: null,
    };

    constructor(props) {
        super(props);
        this.state = {
            search: '',
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

    handleSearchChange = search => {
        this.setState({search});
    };

    render() {
        const {
            className,
        } = this.props;

        const {search} = this.state;
        const apps = search ? Exts.all.searchApps(search) : Exts.all.apps;

        return (<div className={HTML.classes('app-ext-home dock column single', className)}>
            <header className="app-ext-home-header app-ext-common-header has-padding heading divider flex-none">
                <div className="title text-gray small">{Lang.format(search ? 'ext.home.findAppsCount.format' : 'ext.home.appsCount.format', apps.length)}</div>
                <div className="search-box">
                    <SearchControl onSearchChange={this.handleSearchChange} />
                </div>
                <nav className="toolbar">
                    <div className="nav-item hint--bottom-left has-padding-sm" data-hint={Lang.string('ext.home.manageInExtensionsApp')}>
                        <Button type="a" href={`#${ROUTES.exts.app.id('extensions/type=app')}`} className="iconbutton rounded" icon="settings-box text-gray icon-2x" />
                    </div>
                    {/* <div className="nav-item hint--bottom-left has-padding-sm" data-hint={Lang.string('ext.home.addMoreApps')}>
                        <Button className="iconbutton rounded" icon="plus-box text-gray icon-2x" />
                    </div> */}
                </nav>
            </header>
            <div className="app-exts-apps row has-padding flex-auto scroll-y content-start">
                {
                    apps.map(app => {
                        if (app.isFixed || app.hidden) {
                            return null;
                        }
                        return <AppAvatar key={app.name} title={app.description} href={`#${ROUTES.exts.app.id(app.name)}`} avatar={{auto: app.appIcon, skin: {code: app.appAccentColor}, className: 'rounded shadow-1'}} label={app.displayName} />;
                    })
                }
            </div>
        </div>);
    }
}
