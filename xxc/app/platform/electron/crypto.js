import crypto from 'crypto';

/**
 * 使用 AES 加密文本
 * @param  {string} data 要加密的文本字符串
 * @param  {string} token AES key
 * @param  {string} cipherIV AES token
 * @return {Buffer} 返回加密后的 Buffer 数据
 */
const encrypt = (data, token, cipherIV) => {
    const cipher = crypto.createCipheriv('aes-256-cbc', token, cipherIV);
    let crypted = cipher.update(data, 'utf8', 'binary');
    crypted += cipher.final('binary');
    crypted = Buffer.from(crypted, 'binary');
    return crypted;
};

/**
 * 使用 AES 解密文本
 * @param  {Buffer} data 要解密的 Buffer 数据
 * @param  {string} token AES key
 * @param  {string} cipherIV AES token
 * @return {string} 返回解密后的文本
 */
const decrypt = (data, token, cipherIV) => {
    const decipher = crypto.createDecipheriv('aes-256-cbc', token, cipherIV);
    let decoded = decipher.update(data, 'binary', 'utf8');
    decoded += decipher.final('utf8');
    return decoded;
};

export default {
    encrypt,
    decrypt
};
