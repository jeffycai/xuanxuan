import AES from 'aes-js';

/**
 * 使用 AES 加密文本
 * @param  {string} data 要加密的文本字符串
 * @param  {string} token AES key
 * @param  {string} cipherIV AES token
 * @return {Buffer} 返回加密后的 Buffer 数据
 */
const easEncrypt = (data, token, cipherIV) => {
    const key = AES.utils.utf8.toBytes(token);
    const iv = AES.utils.utf8.toBytes(cipherIV);
    // eslint-disable-next-line new-cap
    const aesCbc = new AES.ModeOfOperation.cbc(key, iv);
    const dataBytes = AES.utils.utf8.toBytes(data);
    const paddedData = AES.padding.pkcs7.pad(dataBytes);
    const encryptedBytes = aesCbc.encrypt(paddedData);
    return encryptedBytes;
};

/**
 * 使用 AES 解密文本
 * @param  {Buffer} data 要解密的 Buffer 数据
 * @param  {string} token AES key
 * @param  {string} cipherIV AES token
 * @return {string} 返回解密后的文本
 */
const aesDecrypt = (data, token, cipherIV) => {
    const key = AES.utils.utf8.toBytes(token);
    const iv = AES.utils.utf8.toBytes(cipherIV);
    // eslint-disable-next-line new-cap
    const aesCbc = new AES.ModeOfOperation.cbc(key, iv);
    const utf8Array = new Uint8Array(data);
    const decryptedBytes = aesCbc.decrypt(utf8Array);
    const decryptedText = AES.utils.utf8.fromBytes(AES.padding.pkcs7.strip(decryptedBytes));
    return decryptedText;
};

export default {
    encrypt: easEncrypt,
    decrypt: aesDecrypt,
};
