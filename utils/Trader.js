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

    simulated;
    client;
    symbol;
    baseBalance;
    quoteBalance;
    period;
    movingAvgPeriod;

    constructor(simulated, symbol, periodInHours, movingAvgPeriod) {
        this.simulated = simulated;
        this.symbol = symbol;
        this.period = periodInHours;
        this.movingAvgPeriod = movingAvgPeriod;
        this.client = this.getClient();
        if (simulated) {
            this.baseBalance = 0;
            this.quoteBalance = 100000;
        }
    }

    /**
    * * Gets the client depending on the environment (trade or simulation) 
    * @returns {Object} client
    */
    getClient() {
        let { apiKey, apiSecret } = getAPIKeys(this.simulated);
        let options;
        if (this.simulated) {
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
    */
    async trade() {
        printDatetime();

        if (!this.simulated) await this.getBalances();

        let prices = await this.getPrices()
        let price = prices.price;

        if (this.shouldBuy(prices)) {
            await this.buyToken(price);
        } else if (this.shouldSell(prices)) {
            await this.sellToken(price);
        }

        await this.getBalances();
        printBalance(this.symbol, price, this.baseBalance, this.quoteBalance);
    }

    /**
    * * Gets the user's balance on binance 
    */
    async getBalances() {
        let baseToken = this.symbol.slice(0, 3)
        let quoteToken = this.symbol.slice(3, 7)

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

    /**
    * * Gets the prices used for the Moving Average algorithm 
    * @returns {Object} prices
    */
    async getPrices() {
        let previousPrice = await this.getPreviousPrice()
        let movingAvg = await this.getMovingAvg();
        let price = await this.getActualPrice();
        return {
            previousPrice,
            movingAvg,
            price,
        }
    }

    /**
    * * Used to check if Bot should buy token 
    */
    shouldBuy(prices) {
        let { previousPrice, movingAvg, price } = prices;
        return price > movingAvg && previousPrice < movingAvg && this.quoteBalance > (price * (1 + BINANCE_FEES));
    }

    /**
    * * Used to check if Bot should sell token 
    */
    shouldSell(prices) {
        let { previousPrice, movingAvg, price } = prices;
        return price < movingAvg && previousPrice > movingAvg && this.baseBalance > 0
    }

    /**
    * *Get the price of the last period for that symbol
    * @return {Number} previousPrice : Price of last period
    */
    async getPreviousPrice() {
        // Retrieve the two last "candles" and get the closing price of the previous one
        const result = await this.client.klines(this.symbol, this.period, { limit: 2 });
        let previousPrice = result.data[0][4]

        console.log(`===== Previous price: ${previousPrice} ===== `)
        return previousPrice;
    }

    /**
    * *Calculate moving average from that symbol
    * @return {Number} movingAvg : Computed moving average
    */
    async getMovingAvg() {
        // Retrieve the last {movingAvgPeriod} "candles"
        let result;
        try {
            result = await this.client.klines(this.symbol, this.period, { limit: this.movingAvgPeriod });
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

        console.log(`===== Moving Average: ${movingAvg} ===== `)
        return movingAvg;
    }

    /**
    * *Get instant trading price of that symbol
    * @return {Number} price : Instant trading price of the symbol
    */
    async getActualPrice() {
        // Retrieve instant price
        let result;
        try {
            result = await this.client.tickerPrice(this.symbol);
        } catch (err) {
            console.error(`Error: ${err}`);
            return;
        }

        let price = parseFloat(result.data.price)

        console.log(`===== Actual Price: ${price} ===== `)
        return price;
    }

    /**
    * *Buy Base token of the crypto pair
    * @param {Number} price : Base token price
    */
    async buyToken(price) {
        // Fees need to be taken into account prior to purchasing
        let numberOfTokenToBuy = Math.floor(this.quoteBalance * 1 / (price * (1 + BINANCE_FEES)));

        if (simulated) {
            this.baseBalance += numberOfTokenToBuy;
            this.quoteBalance -= numberOfTokenToBuy * (price * (1 + BINANCE_FEES));
        } else {
            let buyOrder;
            try {
                buyOrder = await this.client.newOrder(this.symbol, 'BUY', 'MARKET', {
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
        let totalFees = numberOfTokenToBuy * price * BINANCE_FEES;

        let log = `${getDateTime()} - BOUGHT ${numberOfTokenToBuy} token at PRICE ${price} for a TOTAL of ${totalPrice} / FEES: ${totalFees}\n`
        writeToFile(log);
        console.log(log);
    }

    /**
    * *Sell Base token of the crypto pair
    * @param {Number} price : Base token price
    */
    async sellToken(price) {
        // Fees need to be taken into account prior to selling
        let numberOfTokenToSell = Math.floor(this.baseBalance * 1);

        if (simulated) {
            this.baseBalance -= numberOfTokenToSell;
            this.quoteBalance += numberOfTokenToSell * (price * (1 + BINANCE_FEES));
        } else {
            let sellOrder;
            try {
                sellOrder = await this.client.newOrder(this.symbol, 'SELL', 'MARKET', {
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
        let totalFees = numberOfTokenToSell * price * BINANCE_FEES;

        let log = `${getDateTime()} - SOLD ${numberOfTokenToSell} token at PRICE ${price} for a TOTAL of ${totalPrice} / FEES: ${totalFees}\n`
        writeToFile(log);
        console.log(log);
    }
}

module.exports = Trader
