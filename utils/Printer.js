const { getDateTime } = require('./Dates');

exports.printDatetime = () => {
    const datetime = getDateTime();
    console.log(`===== DateTime : ${datetime} =====`)
}

exports.printBalance = (ADA_balance, USDT_balance) => {
    console.log(`===== Balance: ADA ${ADA_balance} / USDT ${USDT_balance} =====`)
}