import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../../utils/html-helper';
import {getChatCategories} from '../../core/im/im-chats';
import Lang from '../../core/lang';
import InputControl from '../../components/input-control';
import Radio from '../../components/radio';
import RadioGroup from '../../components/radio-group';
import SelectBox from '../../components/select-box';

/**
 * ChatAddCategory 组件 ，显示一个添加聊天分类界面
 * @class ChatAddCategory
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example <caption>组件类调用方式</caption>
 * import ChatAddCategory from './chat-add-category';
 * <ChatAddCategory />
 */
export default class ChatAddCategory extends Component {
    /**
     * ChatAddCategory 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof ChatAddCategory
     */
    static replaceViewPath = 'chats/ChatAddCategory';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof ChatAddCategory
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
        children: PropTypes.any,
        chat: PropTypes.any.isRequired,
        onCategoryChange: PropTypes.func,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof ChatAddCategory
     * @static
     */
    static defaultProps = {
        className: null,
        children: null,
        onCategoryChange: null,
    };

    /**
     * React 组件构造函数，创建一个 ChatAddCategory 组件实例，会在装配之前被调用。
     * @see https://react.docschina.org/docs/react-component.html#constructor
     * @param {Object?} props 组件属性对象
     * @constructor
     */
    constructor(props) {
        super(props);
        const {chat} = props;

        /**
         * 全部分类信息
         * @type {Object[]}
         * @private
         */
        this.allCategories = getChatCategories(chat.isOne2One ? 'contact' : 'group');

        /**
         * 原始分类名称
         * @type {string}
         * @private
         */
        this.originCategory = chat.category;

        /**
         * React 组件状态对象
         * @see https://react.docschina.org/docs/state-and-lifecycle.html
         * @type {object}
         */
        this.state = {
            type: (this.allCategories && this.allCategories.length) ? 'modify' : 'create',
            selectName: this.originCategory,
            newName: ''
        };
    }

    /**
     * 获取当前用户选择的分类
     * @memberof ChatAddCategory
     * @type {{type: string, name: string}}
     */
    get category() {
        const {type, newName, selectName} = this.state;
        return {type, name: type === 'create' ? newName : selectName};
    }

    /**
     * 触发分类变更事件
     * @private
     * @return {void}
     * @memberof ChatAddCategory
     */
    changeCategory = () => {
        const {onCategoryChange} = this.props;
        const {type, newName, selectName} = this.state;
        if (onCategoryChange) {
            onCategoryChange(type === 'create' ? newName : selectName, type);
        }
    };

    /**
     * 处理分类类型变更事件事件
     * @param {string} type 分类类型
     * @memberof ChatAddCategory
     * @private
     * @return {void}
     */
    handleRadioGroupChange = type => {
        this.setState({type}, () => {
            const control = (type === 'create' ? this.inputGroup : this.selectBox);
            if (control) {
                control.focus();
            }
            this.changeCategory();
        });
    };

    /**
     * 处理新的分类名称变更事件
     * @param {string} newName 新名称
     * @param {Event} e 事件对象
     * @memberof ChatAddCategory
     * @private
     * @return {void}
     */
    handleNewNameChange = (newName, e) => {
        this.setState({newName}, this.changeCategory);
        e.stopPropagation();
    };

    /**
     * 处理所选分类名称变更事件
     * @param {string} selectName 所选分类名称
     * @param {Event} e 事件对象
     * @memberof ChatAddCategory
     * @private
     * @return {void}
     */
    handleSelectNameChange = (selectName, e) => {
        this.setState({selectName}, this.changeCategory);
        e.stopPropagation();
    };

    /**
     * 检查新的分类名称是否已经存在
     * @memberof ChatAddCategory
     * @returns {boolean} 如果返回 `true` 则为是已经存在，否则为不是已经存在
     */
    isNewNameExist() {
        const {newName} = this.state;
        return newName && this.allCategories.find(x => x.id === newName);
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ChatAddCategory
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            chat,
            className,
            children,
            onCategoryChange,
            ...other
        } = this.props;

        const {type, newName, selectName} = this.state;

        const isTypeCreate = type === 'create';
        let createView = null;
        if (isTypeCreate) {
            createView = (
                <div className="sub-control">
                    <InputControl
                        ref={e => {this.inputGroup = e;}}
                        value={newName}
                        onChange={this.handleNewNameChange}
                        label={false}
                        placeholder={Lang.string('chats.menu.group.createTip')}
                        helpText={this.isNewNameExist() ? Lang.string('chats.menu.group.existsTip') : null}
                    />
                </div>
            );
        }

        let modifyView = null;
        const hasExistCategory = this.allCategories && this.allCategories.length;
        if (!isTypeCreate && hasExistCategory) {
            const options = this.allCategories.map(x => {
                let {title} = x;
                if (!x.id) {
                    const defaultTitle = Lang.string('chats.menu.group.default');
                    if (defaultTitle !== title) {
                        title += ` (${defaultTitle})`;
                    }
                } else if (x.id === this.originCategory) {
                    title += ` (${Lang.string('chats.menu.group.current')})`;
                }
                return {label: title, value: x.id};
            });
            modifyView = (
                <div className="sub-control">
                    <SelectBox ref={e => {this.selectBox = e;}} value={selectName} onChange={this.handleSelectNameChange} options={options} />
                </div>
            );
        }

        const langAddExist = Lang.string('chats.menu.group.addExist');
        return (
            <div className={classes('app-chats-add-category', className)} {...other}>
                {children}
                <RadioGroup onChange={this.handleRadioGroupChange}>
                    <Radio name="chat-category" disabled={!hasExistCategory} label={hasExistCategory ? langAddExist : <span>{langAddExist} (<small>{Lang.string('chats.menu.group.noCategoryToAdd')}</small>)</span>} checked={!isTypeCreate} value="modify">{modifyView}</Radio>
                    <Radio name="chat-category" label={Lang.string('chats.menu.group.create')} checked={isTypeCreate} value="create">{createView}</Radio>
                </RadioGroup>
            </div>
        );
    }
}
