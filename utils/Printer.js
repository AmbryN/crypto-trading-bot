const { getDateTime } = require('./Dates');
const fs = require('fs')

exports.printDatetime = () => {
    const datetime = getDateTime();
    console.log(`===== DateTime : ${datetime} =====`)
}

exports.printBalance = (price, token1Balance, token2Balance) => {
    console.log(`===== Balance: Token1 ${token1Balance} / Token2 ${token2Balance} - Total Value: ${token1Balance * price + token2Balance}=====`)
}

exports.writeToFile = (log) => {
    fs.writeFile('/logs/transactions.txt', log, { flag: 'a+' }, err => {
        if (err) {
            console.error(err)
            return
        }
    })
}