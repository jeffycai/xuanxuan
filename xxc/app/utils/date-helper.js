/** @module date-helper */

import {formatString} from './string-helper';

/**
 * 一天的总毫秒数
 * @type {number}
 * @const
 */
export const TIME_DAY = 24 * 60 * 60 * 1000;

/**
 * 创建一个 Date 对象
 * @param {Date|number|String} [date=null] 用于创建 Date 对象的日期时间表达值，如果留空则创建当前系统时间对象
 * @return {Date}
 * @function
 */
export const createDate = (date = null) => {
    if (!date) {
        return new Date();
    }
    if (!(date instanceof Date)) {
        if (typeof date === 'number' && date < 10000000000) {
            date *= 1000;
        }
        date = new Date(date);
    }
    return date;
};

/**
 * 生成 PHP 时间戳
 * @param {Date|number|String} date 日期时间表达值
 * @return {number}
 * @function
 */
export const createPhpTimestramp = date => {
    return Math.floor(createDate(date).getTime() / 1000);
};

/**
 * 判断两个日期是否是在同一天
 * @param {Date|number|String} date1 第一个日期时间表达值
 * @param {?Date|number|String} date2 第二个日期时间表达值，如果留空则使用当前系统时间
 * @return {boolean}
 * @function
 */
export const isSameDay = (date1, date2) => {
    if (!date2) {
        date2 = new Date();
    }
    date1 = createDate(date1);
    date2 = createDate(date2);
    return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate();
};

/**
 * 判断两个日期是否是在同一年
 * @param {Date|number|String} date1 第一个日期时间表达值
 * @param {?Date|number|String} date2 第二个日期时间表达值，如果留空则使用当前系统时间
 * @return {boolean}
 * @function
 */
export const isSameYear = (date1, date2) => {
    if (!date2) {
        date2 = new Date();
    }
    return createDate(date1).getFullYear() === createDate(date2).getFullYear();
};

/**
 * 判断两个日期是否是在同一个月
 * @param {Date|number|String} date1 第一个日期时间表达值
 * @param {?Date|number|String} date2 第二个日期时间表达值，如果留空则使用当前系统时间
 * @return {boolean}
 * @function
 */
export const isSameMonth = (date1, date2) => {
    if (!date2) {
        date2 = new Date();
    }
    date1 = createDate(date1);
    date2 = createDate(date2);
    return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
};

/**
 * 判断指定的日期是否是在今天
 * @param {Date|number|String} date 要判断的日期时间表达值
 * @param {Date|number|String} [now=null] 作为今天判断依据的日期，如果留空则使用当前系统时间
 * @return {boolean}
 * @function
 */
export const isToday = (date, now = null) => (isSameDay(now || new Date(), date));

/**
 * 判断指定的日期是否是在昨天
 * @param {Date|number|String} date 要判断的日期时间表达值
 * @param {Date|number|String} [now=null] 作为今天判断依据的日期，如果留空则使用当前系统时间
 * @return {boolean}
 * @function
 */
export const isYestoday = (date, now) => (isSameDay((now || new Date()).getTime() - TIME_DAY, date));

/**
 * 格式化日期时间值为字符串，所有可用的格式化参数有：
 * - yyyy，例如：'2018'，表示四位数字表示的年份
 * - yy，例如：'18'，表示两位数字表示的年份
 * - MM，例如：'07'，表示两位数字表示的月份，不足两位在起始用 0 填充
 * - M，例如：'10'，表示一位或两位数字表示的月份
 * - dd，例如：'05'，表示两位数字表示的日期，不足两位在起始用 0 填充
 * - d，例如：'5'，表示一位或两位数字表示的日期
 * - hh，例如：'08'，表示两位数字表示的小时，不足两位在起始用 0 填充
 * - h，例如：'8'，表示一位或两位数字表示的小时
 * - mm，例如：'3'，表示两位数字表示的分钟，不足两位在起始用 0 填充
 * - m，例如：'03'，表示一位或两位数字表示的分钟
 * - ss，例如：'5'，表示两位数字表示的秒数，不足两位在起始用 0 填充
 * - s，例如：'05'，表示一位或两位数字表示的秒数
 * - S，例如：'236'，表示毫秒数
 * @summary 格式化日期时间值为字符串
 * @param {Date|number|String} date 要格式化的日期时间表达值
 * @param {string} [format='yyyy-MM-dd hh:ss'] 格式化字符串
 * @return {string}
 * @function
 */
export const formatDate = (date, format = 'yyyy-MM-dd hh:ss') => {
    date = createDate(date);

    const dateInfo = {
        'M+': date.getMonth() + 1,
        'd+': date.getDate(),
        'h+': date.getHours(),
        // 'H+': date.getHours() % 12,
        'm+': date.getMinutes(),
        's+': date.getSeconds(),
        // 'q+': Math.floor((date.getMonth() + 3) / 3),
        'S+': date.getMilliseconds()
    };
    if (/(y+)/i.test(format)) {
        format = format.replace(RegExp.$1, (`${date.getFullYear()}`).substr(4 - RegExp.$1.length));
    }
    Object.keys(dateInfo).forEach(k => {
        if (new RegExp(`(${k})`).test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length === 1 ? dateInfo[k] : (`00${dateInfo[k]}`).substr((`${dateInfo[k]}`).length));
        }
    });
    return format;
};

/**
 * 格式化日期时间范围
 * @param {String|Date|number} date1 起始时间
 * @param {String|Date|number} date2 结束时间
 * @param {Object} format 格式化参数
 * @return {string}
 * @function
 */
export const formatSpan = (date1, date2, format) => {
    format = Object.assign({
        full: 'yyyy-M-d', month: 'M-d', day: 'd', str: '{0} ~ {1}',
    }, format);
    const date1Str = formatDate(date1, isSameYear(date1) ? format.month : format.full);
    if (isSameDay(date1, date2)) {
        return date1Str;
    }
    const date2Str = formatDate(date2, isSameYear(date1, date2) ? (isSameMonth(date1, date2) ? format.day : format.month) : format.full);
    return formatString(format.str, date1Str, date2Str);
};

/**
 * 根据描述获取当前时间与指定描述之间的毫秒数
 * @param {string} desc 起始时间
 * @return {number}
 * @function
 */
export const getTimeBeforeDesc = desc => {
    const now = new Date().getTime();
    switch (desc) {
    case 'oneWeek':
        return now - (TIME_DAY * 7);
    case 'oneMonth':
        return now - (TIME_DAY * 31);
    case 'threeMonth':
        return now - (TIME_DAY * 31 * 3);
    case 'halfYear':
        return now - (TIME_DAY * 183);
    case 'oneYear':
        return now - (TIME_DAY * 365);
    case 'twoYear':
        return now - (2 * (TIME_DAY * 365));
    default:
        return 0;
    }
};

export default {
    createDate,
    formatDate,
    isSameDay,
    isSameMonth,
    isSameYear,
    isToday,
    isYestoday,
    formatSpan,
    getTimeBeforeDesc,
    createPhpTimestramp
};
