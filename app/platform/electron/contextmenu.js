import {remote} from 'electron';

const Menu = remote.Menu;

const createContextMenu = menu => {
    if (Array.isArray(menu) && !menu.popup) {
        menu = Menu.buildFromTemplate(menu);
    }
    return menu;
};

const popupContextMenu = (menu, x, y) => {
    if (typeof x === 'object') {
        y = x.clientY;
        x = x.clientX;
    }
    menu = createContextMenu(menu);
    menu.popup(this.browserWindow, x, y);
};

export default {
    createContextMenu,
    popupContextMenu
};
