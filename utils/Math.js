/**
 * * Floors the floating point number to number of {decimals}
 * @param {Number} number 
 * @param {Number} decimals 
 * @returns {Number}
 */
exports.floorToDecimals = (number, decimals) => {
    const decimalCalculus = Math.pow(10, decimals)
    return Math.floor(number * decimalCalculus) / decimalCalculus;
}