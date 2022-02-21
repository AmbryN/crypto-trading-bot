const { getDateTime } = require('./Dates');
const fs = require('fs')

exports.printDatetime = () => {
    const datetime = getDateTime();
    console.log(`===== DateTime : ${datetime} =====`)
}

exports.printBalance = (ADA_balance, USDT_balance) => {
    console.log(`===== Balance: ADA ${ADA_balance} / USDT ${USDT_balance} =====`)
}

exports.writeToFile = (log) => {
    fs.writeFile('/logs/transactions.txt', log, { flag: 'a+' }, err => {
        if (err) {
            console.error(err)
            return
        }
    })
}