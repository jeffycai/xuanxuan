import React, {Component, PropTypes} from 'react';
import Platform from 'Platform';
import InputControl from './input-control';

const isWindowsOS = Platform.env.isWindowsOS;

class HotkeyInputControl extends Component {
    static defaultProps = {
        defaultValue: '',
        onChange: null,
        inputProps: null,
    };

    static propTypes = {
        defaultValue: PropTypes.string,
        onChange: PropTypes.func,
        inputProps: PropTypes.object,
    }

    constructor(props) {
        super(props);
        this.state = {
            value: props.defaultValue,
        };
    }

    changeValue(value) {
        if (this.props.onChange) {
            this.props.onChange(value);
        }
        this.inputControl.setValue(value);
        this.setState({value});
    }

    handleKeyDownEvent = e => {
        if (e.keyCode === 8 || e.cod === 'Backspace') {
            this.changeValue('');
            return;
        }
        let shortcut = [];
        if (e.metaKey) {
            shortcut.push(isWindowsOS ? 'Windows' : 'Command');
        }
        if (e.ctrlKey) {
            shortcut.push('Ctrl');
        }
        if (e.altKey) {
            shortcut.push('Alt');
        }
        if (e.shiftKey) {
            shortcut.push('Shift');
        }
        if (e.key && e.key !== 'Meta' && e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Shift') {
            shortcut.push(e.key);
        }
        shortcut = shortcut.join('+');
        this.changeValue(shortcut);
        e.preventDefault();
    }

    getValue() {
        return this.state.value;
    }

    render() {
        const {
            onChange,
            defaultValue,
            inputProps,
            ...other
        } = this.props;

        return (<InputControl
            {...other}
            ref={e => {this.inputControl = e;}}
            defaultValue={defaultValue}
            inputProps={Object.assign({onKeyDown: this.handleKeyDownEvent}, inputProps)}
        />);
    }
}

export default HotkeyInputControl;
