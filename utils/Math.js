/**
 * * Floors the floating point number to number of {decimals}
 * @param {Number} number 
 * @param {Number} decimals 
 * @returns {Number} flooredNumber
 */
exports.floorToDecimals = (number, decimals) => {
    const decimalCalculus = Math.pow(10, decimals)
    const flooredNumber = Math.floor(number * decimalCalculus) / decimalCalculus;
    return flooredNumber;
}