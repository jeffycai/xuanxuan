import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import HTML from '../utils/html-helper';
import Icon from './icon';
import Lang from '../core/lang';

/**
 * Pager 组件 ，显示一个分页控件
 * @class Pager
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example
 * <Pager />
 */
export default class Pager extends PureComponent {
    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof Pager
     * @type {Object}
     */
    static propTypes = {
        page: PropTypes.number,
        recTotal: PropTypes.number,
        recPerPage: PropTypes.number,
        pageRecCount: PropTypes.number,
        className: PropTypes.string,
        onPageChange: PropTypes.func,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof Pager
     * @static
     */
    static defaultProps = {
        page: 1,
        recTotal: 0,
        recPerPage: 20,
        onPageChange: null,
        className: null,
        pageRecCount: 0,
    };

    /**
     * 处理上一页按钮点击事件
     * @param {Event} event 事件对象
     * @memberof Pager
     * @private
     * @return {void}
     */
    handlePrevBtnClick = event => {
        if (this.props.page > 1) {
            this.props.onPageChange(this.props.page - 1);
        }
    }

    /**
     * 处理下一页按钮点击事件
     * @param {Event} event 事件对象
     * @memberof Pager
     * @private
     * @return {void}
     */
    handleNextBtnClick = event => {
        if (this.props.page < this.totalPage) {
            this.props.onPageChange(this.props.page + 1);
        }
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof Pager
     * @return {ReactNode}
     */
    render() {
        const {
            page,
            className,
            recTotal,
            pageRecCount,
            recPerPage,
            onPageChange,
            ...other
        } = this.props;

        this.totalPage = Math.ceil(recTotal / recPerPage);

        return (<div {...other} className={HTML.classes('pager flex flex-middle', className)}>
            <div className="hint--bottom" data-hint={Lang.string('pager.prev')}>
                <button disabled={page <= 1} type="button" className="iconbutton btn rounded" onClick={this.handlePrevBtnClick}><Icon name="chevron-left" /></button>
            </div>
            {recTotal ? <div className="hint--bottom" data-hint={((page - 1) * recPerPage + 1) + ' ~ ' + Math.min(recTotal, (page - 1) * recPerPage + pageRecCount) + ' / ' + recTotal}><strong>{page}</strong> / <strong>{this.totalPage}</strong></div> : null}
            <div className="hint--bottom" data-hint={Lang.string('pager.next')}>
                <button disabled={page >= this.totalPage} type="button" className="iconbutton btn rounded" onClick={this.handleNextBtnClick}><Icon name="chevron-right" /></button>
            </div>
        </div>);
    }
}
