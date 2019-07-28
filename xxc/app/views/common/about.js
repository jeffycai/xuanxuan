import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import Config from '../../config';
import {classes} from '../../utils/html-helper';
import Lang from '../../core/lang';
import _BuildInfo from './build-info'; // eslint-disable-line
import PoweredInfo from './powered-info';
import pkg from '../../package.json';
import withReplaceView from '../with-replace-view';

/**
 * UserAvatar 可替换组件形式
 * @type {Class<UserAvatar>}
 * @private
 */
const BuildInfo = withReplaceView(_BuildInfo);

/**
 * About 组件 ，显示应用关于界面
 * @class About
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example
 * import About from './about';
 * <About />
 */
export default class About extends PureComponent {
    /**
     * About 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof About
     */
    static replaceViewPath = 'common/About';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof About
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof About
     * @static
     */
    static defaultProps = {
        className: null,
    };

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof About
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            className,
            ...other
        } = this.props;

        let showPoweredBy = Config.ui['app.showPoweredBy'];
        if (showPoweredBy === 'auto') {
            showPoweredBy = pkg.name !== 'xuanxuan';
        }

        return (
            <div
                {...other}
                className={classes('app-about center-content space', className)}
            >
                <section className="text-center">
                    <img src={`${Config.media['image.path']}logo.png`} alt="logo" />
                    <BuildInfo className="space-sm" />
                    {Config.pkg.homepage ? <div className="space-xl"><a target="_blank" className="btn rounded text-primary strong" href={Config.pkg.homepage}><strong>{Config.pkg.homepage}</strong></a></div> : null}
                    {Config.pkg.license ? <div><a target="_blank" className="btn rounded" href="https://github.com/easysoft/xuanxuan/blob/master/LICENSE">{`Open source license ${Config.pkg.license}`}</a></div> : null}
                    {Config.pkg.company ? <div><a target="_blank" className="btn rounded" href="http://cnezsoft.com/">{Lang.format('common.copyrightFormat', {year: new Date().getFullYear(), name: Config.pkg.company})}</a></div> : null}
                    {Config.ui.about ? <div>{Config.ui.about}</div> : null}
                    <div><a target="_blank" className="btn rounded" href="http://emojione.com/">Thanks to EmojiOne for providing free emoji icons</a></div>
                    {showPoweredBy && <PoweredInfo className="btn rounded strong text-important"> http://xuan.im</PoweredInfo>}
                </section>
            </div>
        );
    }
}
