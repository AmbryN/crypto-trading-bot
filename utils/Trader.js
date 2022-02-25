const { Spot } = require('@binance/connector');
const { getDateTime } = require('./Dates.js');
const { floorToDecimals } = require('./Math.js');
const { printBalance, printDatetime, writeToFile } = require('./Printer.js');
const { getAPIKeys } = require('./Keys.js')

/**
* * Binance Trading utility
*/
class Trader {

    env;
    client;
    makerCommission;
    takerCommission;
    symbol;
    baseBalance;
    quoteBalance;
    percentage;
    period;
    movingAvgPeriod;

    constructor(env, symbol, percentage, period, movingAvgPeriod) {
        this.env = env;
        this.symbol = symbol;
        this.period = period;
        this.movingAvgPeriod = movingAvgPeriod;
        this.percentage = percentage / 100;
        this.client = this.getClient();
        if (this.env === "SIM") {
            this.baseBalance = 0;
            this.quoteBalance = 100000;
            this.makerCommission = 0.001;
            this.takerCommission = 0.001;
        }
    }

    /**
    * * Gets the client depending on the environment (trade or simulation) 
    * @returns {Object} client
    */
    getClient() {
        let { apiKey, apiSecret } = getAPIKeys(this.env);
        let options;
        if (this.env === 'PROD' || this.env === 'SIM') {
            options = {
                baseURL: 'https://api.binance.com',
            }
        } else if (this.env === 'TEST') {
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

        if (!(this.env === 'SIM')) await this.getBalances();

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

        if (!(this.env === 'SIM')) {
            let account;
            try {
                account = await this.client.account();
            } catch (err) {
                console.error(`getBalances: ${err}`)
                return;
            }

            let balances = account.data.balances.filter(cryptoBalance => cryptoBalance.asset === baseToken || cryptoBalance.asset === quoteToken);
            this.makerCommission = account.data.makerCommission / 10000;
            this.takerCommission = account.data.takerCommission / 10000;
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
        return price > movingAvg && previousPrice < movingAvg && this.quoteBalance > (price * (1 + this.takerCommission));
    }

    /**
    * * Used to check if Bot should sell token 
    */
    shouldSell(prices) {
        let { previousPrice, movingAvg, price } = prices;
        let should = price < movingAvg && previousPrice > movingAvg && this.baseBalance > 0
        return should
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
        let numberOfTokenToBuy = floorToDecimals((this.quoteBalance * this.percentage) / (price * (1 + this.takerCommission)), 5);

        if (this.env === 'SIM') {
            this.baseBalance += numberOfTokenToBuy;
            this.quoteBalance -= numberOfTokenToBuy * (price * (1 + this.takerCommission));
        } else {
            let buyOrder;
            try {
                buyOrder = await this.client.newOrder(this.symbol, 'BUY', 'LIMIT', {
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
        let totalFees = totalPrice * this.takerCommission;
        let portfolioValue = totalPrice + this.quoteBalance - totalPrice - totalFees;

        let log = `!!!!! ${getDateTime()} - BOUGHT ${numberOfTokenToBuy} at PRICE ${price} for TOTAL ${totalPrice} - FEES: ${totalFees} - PORTFOLIO: ${portfolioValue}\n`
        writeToFile(log);
        console.log(log);
    }

    /**
    * *Sell Base token of the crypto pair
    * @param {Number} price : Base token price
    */
    async sellToken(price) {
        if (this.env === 'SIM') {
            let numberOfTokenToSell = this.baseBalance;

            this.baseBalance -= numberOfTokenToSell;
            this.quoteBalance += numberOfTokenToSell * (price * (1 - this.takerCommission));
        } else {
            let sellOrder;
            try {
                sellOrder = await this.client.newOrder(this.symbol, 'SELL', 'LIMIT', {
                    price: price,
                    quantity: this.baseBalance,
                    timeInForce: 'GTC',
                })
            } catch (err) {
                `Error: ${err}`
                return;
            }

            console.log(sellOrder.data)
        }

        let totalValue = this.baseBalance * price;
        let totalFees = totalValue * this.takerCommission;
        let portfolioValue = totalValue + this.quoteBalance - totalFees;

        let log = `!!!!! ${getDateTime()} - SOLD ${this.baseBalance} at PRICE ${price} for TOTAL ${totalValue} - FEES: ${totalFees} - PORTFOLIO: ${portfolioValue}\n`
        writeToFile(log);
        console.log(log);
    }
}

module.exports = Trader
