import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import HTML from '../../utils/html-helper';
import StringHelper from '../../utils/string-helper';
import DateHelper from '../../utils/date-helper';
import Lang from '../../core/lang';
import InputControl from '../../components/input-control';
import SelectBox from '../../components/select-box';
import Button from '../../components/button';
import {createTodo} from '../../core/todo';
import {showMessager} from '../../components/messager';

/**
 * 将时间字符串转换为秒数
 * @param {string} time 时间字符串，例如 `'12:00'`
 * @return {number} 秒数
 * @private
 */
const timeToInt = time => {
    if (time) {
        const timeNums = time.split(':').map(x => {
            return Number.parseInt(x, 10);
        });
        return (timeNums[0] * 60) + timeNums[1];
    }
    return 0;
};

/**
 * TodoEditer 组件 ，显示待办编辑界面
 * @class TodoEditer
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example
 * import TodoEditer from './todo-editer';
 * <TodoEditer />
 */
export default class TodoEditor extends PureComponent {
    /**
     * TodoEditer 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof TodoEditer
     */
    static replaceViewPath = 'todo/TodoEditer';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof TodoEditer
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
        defaultTodo: PropTypes.object,
        onRequestClose: PropTypes.func,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof TodoEditer
     * @static
     */
    static defaultProps = {
        className: null,
        defaultTodo: null,
        onRequestClose: null,
    };

    /**
     * React 组件构造函数，创建一个 TodoEditer 组件实例，会在装配之前被调用。
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
            todo: props.defaultTodo || {},
            loading: false,
            errorMessage: '',
            errorControl: ''
        };

        if (!this.state.todo.date) {
            this.state.todo.date = DateHelper.formatDate(new Date(), 'yyyy-MM-dd');
        }
    }

    /**
     * 处理待办属性变更事件
     * @param {string} name 属性名称
     * @param {string} val 属性值
     * @memberof TodoEditer
     * @private
     * @return {void}
     */
    handleTodoChange(name, val) {
        const {todo, errorControl} = this.state;
        todo[name] = val;
        const newState = {todo: Object.assign({}, todo), errorMessage: ''};
        if (name === errorControl) {
            newState.errorControl = '';
        }
        this.setState(newState);
    }

    /**
     * 检查待办属性
     * @memberof TodoEditer
     * @private
     * @return {void}
     */
    checkTodo() {
        const {todo} = this.state;
        if (StringHelper.isEmpty(todo.name)) {
            this.setState({errorControl: 'name', errorMessage: Lang.format('common.requiredField.format', Lang.string('todo.label.name'))});
            return false;
        }
        if (StringHelper.isEmpty(todo.date)) {
            this.setState({errorControl: 'date', errorMessage: Lang.format('common.requiredField.format', Lang.string('todo.label.date'))});
            return false;
        }
        const isBeginEmpty = StringHelper.isEmpty(todo.begin);
        const isEndEmpty = StringHelper.isEmpty(todo.end);
        if (isBeginEmpty !== isEndEmpty) {
            this.setState({errorControl: isBeginEmpty ? 'begin' : 'end', errorMessage: Lang.string('todo.beginAndEndBothRequired')});
            return false;
        }
        if (!isBeginEmpty && !isEndEmpty) {
            const beginVal = timeToInt(todo.begin);
            const endVal = timeToInt(todo.end);
            console.log('>', beginVal, todo.begin, endVal, todo.end, endVal < beginVal);
            if (endVal < beginVal) {
                this.setState({errorControl: 'end', errorMessage: Lang.string('todo.beginMustBeforeEnd')});
                return false;
            }
        }
        return true;
    }

    /**
     * 处理提交代码按钮点击事件
     * @memberof TodoEditer
     * @private
     * @return {void}
     */
    handleSubmitBtnClick = () => {
        if (this.checkTodo()) {
            this.setState({loading: true}, () => {
                const {todo} = this.state;
                createTodo(todo).then(newTodo => {
                    const state = {loading: false};
                    if (newTodo && newTodo.id) {
                        showMessager(Lang.string('todo.createSuccess'), {type: 'success'});
                        if (this.props.onRequestClose) {
                            this.props.onRequestClose();
                        }
                    } else {
                        state.errorMessage = Lang.error('COMMON_ERROR');
                    }
                    this.setState(state);
                    return newTodo;
                });
            });
        }
    };

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof TodoEditer
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            className,
            defaultTodo,
            onRequestClose,
            ...other
        } = this.props;

        const {todo, loading, errorMessage, errorControl} = this.state;

        return (<div
            {...other}
            className={HTML.classes('app-todo-editor relative load-indicator has-padding-v', className, {loading, disabled: loading})}
        >
            {errorMessage ? <div className="box red rounded space-sm">{errorMessage}</div> : null}
            <InputControl
                className={errorControl === 'name' ? 'has-error' : ''}
                value={todo.name}
                label={Lang.string('todo.label.name')}
                autoFocus
                placeholder={Lang.string('common.required')}
                onChange={this.handleTodoChange.bind(this, 'name')}
            />
            <div className={`control${errorControl === 'desc' ? ' has-error' : ''}`}>
                <label>{Lang.string('todo.label.desc')}</label>
                <textarea
                    className="textarea rounded"
                    rows="10"
                    value={todo.desc}
                    placeholder={`${Lang.string('todo.label.desc')} (${Lang.string('todo.input.desc.hint')})`}
                    onChange={e => this.handleTodoChange('desc', e.target.value)}
                />
            </div>
            <div className="row gutter-sm">
                <div className="cell">
                    <div className="control">
                        <label>{Lang.string('todo.label.pri')}</label>
                        <SelectBox value={todo.pri} options={[1, 2, 3, 4, '']} onChange={this.handleTodoChange.bind(this, 'pri')} />
                    </div>
                </div>
                <div className="cell">
                    <InputControl
                        className={errorControl === 'date' ? 'has-error' : ''}
                        inputType="date"
                        value={todo.date}
                        label={Lang.string('todo.label.date')}
                        placeholder={Lang.string('todo.label.date') + Lang.string('common.required')}
                        onChange={this.handleTodoChange.bind(this, 'date')}
                    />
                </div>
                <div className="cell">
                    <div className="row">
                        <div className="cell">
                            <InputControl
                                className={errorControl === 'begin' ? 'has-error' : ''}
                                inputType="time"
                                value={todo.begin}
                                label={Lang.string('todo.label.begin')}
                                onChange={this.handleTodoChange.bind(this, 'begin')}
                            />
                        </div>
                        <div className="cell">
                            <InputControl
                                className={errorControl === 'end' ? 'has-error' : ''}
                                inputType="time"
                                value={todo.end}
                                label={Lang.string('todo.label.end')}
                                onChange={this.handleTodoChange.bind(this, 'end')}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="has-padding-v toolbar">
                <Button className="primary btn-wide" label={Lang.string('common.confirm')} onClick={this.handleSubmitBtnClick} /> &nbsp;
                <Button className="primary-pale text-primary btn-wide" label={Lang.string('common.cancel')} onClick={onRequestClose} />
            </div>
        </div>);
    }
}
