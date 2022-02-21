const { Spot } = require('@binance/connector');
const { getDateTime } = require('./Dates.js');
const { floorToDecimals } = require('./Math.js');
const { printBalance, printDatetime, writeToFile } = require('./Printer.js');
const { apiKey, apiSecret } = require('./var.js')

const client = new Spot(apiKey, apiSecret, { baseURL: 'https://testnet.binance.vision' });

const BINANCE_FEES = 0.001

/**
* * Trading utility
* The balances are simulated for now
*/
class Trader {

    baseBalance;
    quoteBalance;

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

        this.setBalances(symbol);

        let previousPrice = await this.getPreviousPrice(symbol, periodInHours)
        let movingAvg = await this.getMovingAvg(symbol, periodInHours, movingAvgPeriod);
        let price = await this.getActualPrice(symbol);

        if (price > movingAvg && previousPrice < movingAvg && this.quoteBalance > (price * (1 + this.BINANCE_FEES))) {
            this.buyToken(symbol, price);
        } else if (price < movingAvg && previousPrice > movingAvg && this.baseBalance > 0) {
            this.sellToken(symbol, price);
        }

        printBalance(symbol, price, this.baseBalance, this.quoteBalance);
    }

    async setBalances(symbol) {
        let account;
        try {
            account = await client.account()
        } catch (err) {
            console.error(`Error: ${err}`)
            return;
        }
        let token1 = symbol.slice(0, 3)
        let token2 = symbol.slice(3, 7)
        let balances = account.data.balances.filter(cryptoBalance => cryptoBalance.asset === token1 || cryptoBalance.asset === token2);
        this.baseBalance = parseFloat(balances.find(balance => balance.asset === token1).free)
        this.quoteBalance = parseFloat(balances.find(balance => balance.asset === token2).free)
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
        let previousPrice = result.data[0][4]

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
        let result;
        try {
            result = await client.klines(symbol, periodInHours, { limit: movingAvgPeriod });
        } catch (err) {
            console.error(`Error: ${err}`);
            return;
        }

        let data = result.data
        // Compute the moving average
        let sum = data.reduce((accum, value) => {
            accum += parseFloat(value[4])
            return accum
        }, 0)
        let movingAvg = floorToDecimals(sum / data.length, 4)

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
        let result;
        try {
            result = await client.tickerPrice(symbol);
        } catch (err) {
            console.error(`Error: ${err}`);
            return;
        }

        let price = parseFloat(result.data.price)

        console.log(`===== Actual Price: ${price} =====`)
        return price;
    }

    /**
    * *Buy first token of the crypto pair
    * @param {Number} price : Token price
    */
    async buyToken(symbol, price) {

        // Fees need to be taken into account prior to purchasing
        let fee = price * BINANCE_FEES;
        let numberOfTokenToBuy = Math.floor(this.quoteBalance * 1 / (price + fee));

        let buyOrder;
        try {
            buyOrder = await client.newOrder(symbol, 'BUY', 'MARKET', {
                price: price,
                quantity: numberOfTokenToBuy,
                timeInForce: 'GTC',
            })
        } catch (err) {
            console.error(`Error: ${err}`)
            return;
        }

        console.log(buyOrder.data)

        let totalPrice = numberOfTokenToBuy * price;

        let log = `${getDateTime()} - BOUGHT ${numberOfTokenToBuy} token at PRICE ${price} for a TOTAL of ${totalPrice} / FEES: ${totalFees}\n`
        writeToFile(log);
        console.log(log);
    }

    /**
    * *Sell first token of the crypto pair
    * @param {Number} price : Token price
    */
    async sellToken(symbol, price) {
        // Fees need to be taken into account prior to selling
        let fee = price * this.BINANCE_FEES;
        let numberOfTokenToSell = Math.floor(this.baseBalance * 1);

        let sellOrder = await client.newOrder(symbol, 'SELL', 'MARKET', {
            price: price,
            quantity: numberOfTokenToSell,
            timeInForce: 'GTC',
        })

        console.log(sellOrder.data)

        let totalPrice = numberOfTokenToSell * price;

        let log = `${getDateTime()} - SOLD ${numberOfTokenToSell} token at PRICE ${price} for a TOTAL of ${totalPrice} / FEES: ${totalFees}\n`
        writeToFile(log);
        console.log(log);
    }
}

module.exports = Trader