const { Spot } = require('@binance/connector');
const { getDateTime } = require('./Dates.js');
const { printBalance, printDatetime, writeToFile } = require('./Printer.js');
const { apiKey, apiSecret } = require('./var.js')

const client = new Spot(apiKey, apiSecret);

/**
* * Trading utility
* The balances are simulated for now
* TODO: Use actual Binance account balance for trading
*/
class Trader {
    token1Balance
    token2Balance
    BINANCE_FEES

    constructor() {
        this.token2Balance = 100;
        this.token1Balance = 0;
        this.BINANCE_FEES = 0.001;
    }

    /**
    * *Trade a crypto pair on Binance using the Moving Average methods
    * The algorithm will buy if the price goes above the moving average
    * The algorithm will sell if the price goes uder the moving average
    * TODO : Selection of the method
    * @param {String} symbol : Crypto pair to trade
    * @param {String} periodInHours : Time period used for computing the moving average [1min, 3min, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w]
    * @param {Number} movingAveragePeriod : Number of periods used for computing the moving average [example : 7, 25, 99]
    */
    async trade(symbol, periodInHours, movingAvgPeriod) {
        printDatetime();

        let previousPrice = await this.getPreviousPrice(symbol, periodInHours)
        let movingAvg = await this.getMovingAvg(symbol, periodInHours, movingAvgPeriod);
        let price = await this.getActualPrice(symbol);

        if (price > movingAvg && previousPrice < movingAvg && this.token2Balance > (price * this.BINANCE_FEES)) {
            this.buyToken(price);
        } else if (price < movingAvg && previousPrice > movingAvg && this.token1Balance > 0) {
            this.sellToken(price);
        }

        printBalance(symbol, price, this.token1Balance, this.token2Balance);
    }

    /**
    * *Get the price of the last period for that symbol
    * @param {String} symbol : Crypto pair to trade
    * @param {String} periodInHours : Time period used for computing the moving average [1min, 3min, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w]
    * @return {Number} previousPrice : Price of last period

    */
    async getPreviousPrice(symbol, periodInHours) {
        // Retrieve the two last "candles" and get the closing price of the previous one
        const result = await client.klines(symbol, periodInHours, { limit: 2 });
        const previousPrice = result.data[0][4]

        console.log(`===== Previous price: ${previousPrice} =====`)
        return previousPrice;
    }

    /**
    * *Calculate moving average from that symbol
    * @param {String} symbol : Crypto pair to trade
    * @param {String} periodInHours : Time period used for computing the moving average [1min, 3min, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w]
    * @param {Number} movingAveragePeriod : Number of periods used for computing the moving average [example : 7, 25, 99]
    * @return {Number} movingAvg : Computed moving average
    */
    async getMovingAvg(symbol, periodInHours, movingAvgPeriod) {
        // Retrieve the last {movingAvgPeriod} "candles"
        const result = await client.klines(symbol, periodInHours, { limit: movingAvgPeriod });
        const data = result.data
        // Compute the moving average
        let sum = data.reduce((accum, value) => {
            accum += parseFloat(value[4])
            return accum
        }, 0)
        const movingAvg = (sum / data.length).toPrecision(4)

        console.log(`===== Moving Average: ${movingAvg} =====`)
        return movingAvg;
    }

    /**
    * *Get instant trading price of that symbol
    * @param {String} symbol : Crypto pair to trade
    * @return {Number} price : Instant trading price of the symbol
    */
    async getActualPrice(symbol) {
        // Retrieve instant price
        const result = await client.tickerPrice(symbol);
        const price = parseFloat(result.data.price)

        console.log(`===== Actual Price: ${price} =====`)
        return price;
    }

    /**
    * *Buy first token of the crypto pair
    * TODO: Use actual Binance account balance for trading
    * TODO: Support for other crypto pairs
    * @param {Number} price : Token price
    */
    buyToken(price) {
        // Fees need to be taken into account prior to purchasing
        const fee = price * this.BINANCE_FEES;
        const numberOfTokenToBuy = Math.floor(this.token2Balance * 1 / (price + fee));
        const totalFees = numberOfTokenToBuy * fee;
        const totalPrice = numberOfTokenToBuy * price;

        this.token1Balance += numberOfTokenToBuy;
        this.token2Balance -= totalPrice + totalFees;

        const log = `${getDateTime()} - BOUGHT ${numberOfTokenToBuy} token at PRICE ${price} for a TOTAL of ${totalPrice} / FEES: ${totalFees}`
        writeToFile(log);
        console.log(log);
    }

    /**
    * *Sell first token of the crypto pair
    * @param {Number} price : Token price
    */
    sellToken(price) {
        // Fees need to be taken into account prior to selling
        const fee = price * this.BINANCE_FEES;
        const numberOfTokenToSell = Math.floor(this.token1Balance * 1);
        const totalFees = numberOfTokenToBuy * fee;
        const totalPrice = numberOfTokenToBuy * price;

        this.token1Balance -= numberOfTokenToSell;
        this.token2Balance += totalPrice - totalFees

        const log = `${getDateTime()} - SOLD ${numberOfTokenToBuy} token at PRICE ${price} for a TOTAL of ${totalPrice} / FEES: ${totalFees}`
        writeToFile(log);
        console.log(log);
    }
}

module.exports = Trader