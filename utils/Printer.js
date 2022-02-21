const { getDateTime } = require('./Dates');
const fs = require('fs')

exports.printDatetime = () => {
    const datetime = getDateTime();
    console.log(`===== DateTime : ${datetime} =====`)
}

exports.printBalance = (symbol, price, baseBalance, quoteBalance) => {
    console.log(`===== Balance ${symbol}: Base token ${baseBalance} / Quote token ${quoteBalance} - Total Value: ${baseBalance * price + quoteBalance} =====`)
}

exports.writeToFile = (log) => {
    fs.writeFile('./logs/transactions.txt', log, { flag: 'a+' }, err => {
        if (err) {
            console.error(err)
            return
        }
    })
}