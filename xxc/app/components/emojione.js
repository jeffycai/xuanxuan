import Emojione from 'emojione';
import Config from '../config';

/**
 * 设置 Emojione 图片资源路径
 */
Emojione.imagePathPNG = Config.media['emojione.imagePathPNG'];

/**
 * 设置 Emojione 图片资源类型
 */
Emojione.imageType = Config.media['emojione.imageType'];

/**
 * Emojione 模块
 * @name Emojione
 * @static
 * @see https://github.com/emojione/emojione
 */
export default Emojione;
