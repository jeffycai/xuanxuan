import React from 'react';
import EmojiPicker from 'emojione-picker';
import Popover from '../../components/popover';
import Lang from '../../core/lang';
import profile from '../../core/profile';
import Emojione from '../../components/emojione';

/**
 * Emoji 分类信息
 * @type {Map<string, {title: string, emoji: string}>}
 * @private
 */
const emojioneCategories = {
    people: {
        title: Lang.string('emoji.category.people', '表情与人物'),
        emoji: 'smile'
    },
    nature: {
        title: Lang.string('emoji.category.nature', '动物与自然'),
        emoji: 'hamster'
    },
    food: {
        title: Lang.string('emoji.category.food', '食物与饮料'),
        emoji: 'pizza'
    },
    activity: {
        title: Lang.string('emoji.category.activity', '活动'),
        emoji: 'soccer'
    },
    travel: {
        title: Lang.string('emoji.category.travel', '旅行与地点'),
        emoji: 'earth_americas'
    },
    objects: {
        title: Lang.string('emoji.category.objects', '物体'),
        emoji: 'bulb'
    },
    symbols: {
        title: Lang.string('emoji.category.symbols', '符号'),
        emoji: 'clock9'
    },
    flags: {
        title: Lang.string('emoji.category.flags', '旗帜'),
        emoji: 'flag_gb'
    }
};

/**
 * 显示 Emoji 选择提示面板
 * @param {{x: number, y: number}} position 提示框显示位置
 * @param {function(data: Object)} onSelectEmoji 当选择 Emoji 表情时的回调函数
 * @param {function} callback 回调函数
 * @return {void}
 */
export const showEmojiPopover = (position, onSelectEmoji, callback) => {
    const popoverId = 'app-emoji-popover';
    const {enableSearchInEmojionePicker} = profile.userConfig;
    return Popover.show(
        position,
        <EmojiPicker
            categories={emojioneCategories}
            style={{height: 260, width: 280}}
            search={enableSearchInEmojionePicker ? true : undefined}
            searchPlaceholder={enableSearchInEmojionePicker ? Lang.string('common.search') : undefined}
            emojione={{imagePathPNG: Emojione.imagePathPNG, imageType: Emojione.imageType}}
            onChange={data => {
                if (onSelectEmoji) {
                    onSelectEmoji(data);
                }
                Popover.hide(popoverId);
            }}
        />,
        {
            id: popoverId, width: 280, height: 261, cache: true
        },
        callback
    );
};

export default {
    show: showEmojiPopover,
};
