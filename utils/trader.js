const { Spot } = require('@binance/connector');
const { apiKey, apiSecret } = require('./var.js')

const client = new Spot(apiKey, apiSecret);

/**
* * Trading utility
* The balances are simulated for now
* Supports only ADAUSDT for now
* TODO: Add support for other symbol
* TODO: Use actual Binance account balance for trading
*/
class Trader {
    USDT_balance
    ADA_balance
    BINANCE_FEES

    constructor() {
        this.USDT_balance = 100;
        this.ADA_balance = 0;
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
        this.printDateTime(symbol, periodInHours);

        let previousPrice = await this.getPreviousPrice(symbol, periodInHours)
        let movingAvg = await this.getMovingAvg(symbol, periodInHours, movingAvgPeriod);
        let price = await this.getActualPrice(symbol);

        if (price > movingAvg && previousPrice < movingAvg && this.getUSDTBalance() > price) {
            this.buyToken(price);
        } else if (price < movingAvg && previousPrice > movingAvg && this.getADABalance() > 0) {
            this.sellToken(price);
        }

        this.printBalance();
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
    * *Prints the DateTime in the console
    */
    printDateTime() {
        const timestamp = new Date()
        const options = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }
        const DateTime = timestamp.toLocaleDateString('fr-fr', options)

        console.log(`===== DateTime : ${DateTime} =====`)
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
        const numberOfADA = this.USDT_balance * 1 / (price + fee);
        this.ADA_balance += numberOfADA;
        this.USDT_balance -= (numberOfADA * (price + fee));
        console.log(`===== Buy transaction: bought ${numberOfADA} ADA for ${price} USDT =====`);
    }

    /**
    * *Sell first token of the crypto pair
    * @param {Number} price : Token price
    */
    sellToken(price) {
        // Fees need to be taken into account prior to selling
        const fee = price * this.BINANCE_FEES;
        const numberOfADA = this.ADA_balance * 1;
        this.ADA_balance -= numberOfADA;
        this.USDT_balance += (numberOfADA * (price - fee))
        console.log(`===== Buy transaction: sold ${numberOfADA} ADA for ${price} USDT =====`)
    }

    getADABalance() {
        return this.ADA_balance;
    }

    getUSDTBalance() {
        return this.USDT_balance;
    }

    printBalance() {
        console.log(`===== Balance: ADA ${this.ADA_balance} / USDT ${this.USDT_balance} =====`)
    }
}

module.exports = Trader