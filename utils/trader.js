const { Spot } = require('@binance/connector');
const { getDateTime } = require('./Dates.js');
const { floorToDecimals } = require('./Math.js');
const { printBalance, printDatetime, writeToFile } = require('./Printer.js');
const { getAPIKeys } = require('./Keys.js')

const BINANCE_FEES = 0.001

/**
* * Binance Trading utility
*/
class Trader {

    baseBalance;
    quoteBalance;
    simulated;
    client

    constructor(simulated) {
        this.simulated = simulated;
        this.client = this.getClient(simulated);
        if (simulated) {
            this.baseBalance = 100;
            this.quoteBalance = 10000;
        }
    }

    getClient(simulated) {
        let { apiKey, apiSecret } = getAPIKeys(simulated);
        let options;
        if (simulated) {
            options = {
                baseURL: 'https://api.binance.com',
            }
        } else {
            options = {
                baseURL: 'https://testnet.binance.vision'
            }
        }
        let client = new Spot(apiKey, apiSecret, options);
        return client;
    }

    /**
    * *Trade a crypto pair on Binance using the Moving Average methods
    * The algorithm will buy if the price goes above the moving average
    * The algorithm will sell if the price goes uder the moving average
    * @param {String} symbol : Crypto pair to trade
    * @param {String} periodInHours : Time period used for computing the moving average [1min, 3min, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w]
    * @param {Number} movingAveragePeriod : Number of periods used for computing the moving average [example : 7, 25, 99]
    */
    async trade(symbol, periodInHours, movingAvgPeriod) {
        printDatetime();

        if (!this.simulated) await this.getBalances(symbol);

        let prices = await this.getPrices(symbol, periodInHours, movingAvgPeriod)

        let price = prices.price;
        if (this.shouldBuy(prices)) {
            await this.buyToken(symbol, price);
        } else if (this.shouldSell(prices)) {
            await this.sellToken(symbol, price);
        }

        await this.getBalances(symbol);
        printBalance(symbol, price, this.baseBalance, this.quoteBalance);
    }

    /**
    * * Gets the user's balance on binance 
    * @param {String} symbol : Crypto pair to trade
    */
    async getBalances(symbol) {
        let baseToken = symbol.slice(0, 3)
        let quoteToken = symbol.slice(3, 7)

        if (!this.simulated) {
            let account;
            try {
                account = await this.client.account();
            } catch (err) {
                console.error(`getBalances: ${err}`)
                return;
            }

            let balances = account.data.balances.filter(cryptoBalance => cryptoBalance.asset === baseToken || cryptoBalance.asset === quoteToken);
            this.baseBalance = parseFloat(balances.find(balance => balance.asset === baseToken).free)
            this.quoteBalance = parseFloat(balances.find(balance => balance.asset === quoteToken).free)
        }
    }

    async getPrices(symbol, periodInHours, movingAvgPeriod) {
        let previousPrice = await this.getPreviousPrice(symbol, periodInHours)
        let movingAvg = await this.getMovingAvg(symbol, periodInHours, movingAvgPeriod);
        let price = await this.getActualPrice(symbol);
        return {
            previousPrice,
            movingAvg,
            price,
        }
    }

    shouldBuy(prices) {
        let { previousPrice, movingAvg, price } = prices;
        return price > movingAvg && previousPrice < movingAvg && this.quoteBalance > (price * (1 + this.BINANCE_FEES));
    }

    shouldSell(prices) {
        let { previousPrice, movingAvg, price } = prices;
        return price < movingAvg && previousPrice > movingAvg && this.baseBalance > 0
    }

    /**
    * *Get the price of the last period for that symbol
    * @param {String} symbol : Crypto pair to trade
    * @param {String} periodInHours : Time period used for computing the moving average [1min, 3min, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w]
    * @return {Number} previousPrice : Price of last period
    */
    async getPreviousPrice(symbol, periodInHours) {
        // Retrieve the two last "candles" and get the closing price of the previous one
        const result = await this.client.klines(symbol, periodInHours, { limit: 2 });
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
            result = await this.client.klines(symbol, periodInHours, { limit: movingAvgPeriod });
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
            result = await this.client.tickerPrice(symbol);
        } catch (err) {
            console.error(`Error: ${err}`);
            return;
        }

        let price = parseFloat(result.data.price)

        console.log(`===== Actual Price: ${price} =====`)
        return price;
    }

    /**
    * *Buy Base token of the crypto pair
    * @param {Number} price : Base token price
    */
    async buyToken(symbol, price) {
        // Fees need to be taken into account prior to purchasing
        let fee = price * BINANCE_FEES;
        let numberOfTokenToBuy = Math.floor(this.quoteBalance * 1 / (price + fee));

        if (simulated) {
            this.baseBalance += numberOfTokenToBuy;
            this.quoteBalance -= numberOfTokenToBuy * (price * (1 + fee));
        } else {
            let buyOrder;
            try {
                buyOrder = await this.client.newOrder(symbol, 'BUY', 'MARKET', {
                    price: price,
                    quantity: numberOfTokenToBuy,
                    timeInForce: 'GTC',
                })
            } catch (err) {
                console.error(`Error: ${err}`)
                return;
            }

            console.log(buyOrder.data)
        }

        let totalPrice = numberOfTokenToBuy * price;
        let totalFees = numberOfTokenToBuy * price * fee;

        let log = `${getDateTime()} - BOUGHT ${numberOfTokenToBuy} token at PRICE ${price} for a TOTAL of ${totalPrice} / FEES: ${totalFees}\n`
        writeToFile(log);
        console.log(log);
    }

    /**
    * *Sell Base token of the crypto pair
    * @param {Number} price : Base token price
    */
    async sellToken(symbol, price) {
        // Fees need to be taken into account prior to selling
        let fee = price * this.BINANCE_FEES;
        let numberOfTokenToSell = Math.floor(this.baseBalance * 1);

        if (simulated) {
            this.baseBalance += numberOfTokenToSell;
            this.quoteBalance -= numberOfTokenToSell * (price * (1 + fee));
        } else {
            let sellOrder;
            try {
                sellOrder = await this.client.newOrder(symbol, 'SELL', 'MARKET', {
                    price: price,
                    quantity: numberOfTokenToSell,
                    timeInForce: 'GTC',
                })
            } catch (err) {
                `Error: ${err}`
                return;
            }

            console.log(sellOrder.data)
        }

        let totalPrice = numberOfTokenToSell * price;
        let totalFees = numberOfTokenToSell * price * fee;

        let log = `${getDateTime()} - SOLD ${numberOfTokenToSell} token at PRICE ${price} for a TOTAL of ${totalPrice} / FEES: ${totalFees}\n`
        writeToFile(log);
        console.log(log);
    }
}

module.exports = Trader