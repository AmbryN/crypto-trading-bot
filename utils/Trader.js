const { Spot } = require('@binance/connector');
const { getDateTime } = require('./Dates.js');
const { floorToDecimals } = require('./Math.js');
const { printBalance, printDatetime, writeToFile } = require('./Printer.js');
const { getAPIKeys } = require('./Keys.js');
const { SimpleMovingAvg } = require('../strategies/SimpleMovingAvg.js');
const { ExpMovingAvg } = require('../strategies/ExpMovingAvg.js')

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
    strategy;

    constructor(env, symbol, options) {
        this.env = env;
        this.symbol = symbol;
        this.client = this.getClient();

        if (options) {
            this.percentage = options.percentage / 100;
            switch (options.strategy.type) {
                case 'MA':
                    this.strategy = new SimpleMovingAvg(this.client, this.symbol, options.strategy);
                    break;
                case 'EMA':
                    this.strategy = new ExpMovingAvg(this.client, this.symbol, options.strategy);
                    break;
            }
        }

        if (this.env === "SIM") {
            this.baseBalance = 0;
            this.quoteBalance = 100000;
            this.makerCommission = 0.001;
            this.takerCommission = 0.001;
        }
    }

    /**
    * * Gets the client depending on the environment 
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
    * * Cancels all open orders for a symbol
    */
    async cancelOpenOrders() {
        this.client.cancelOpenOrders(this.symbol);
    }

    /**
    * *Trade a crypto pair on Binance using a given strategy
    */
    async trade() {
        printDatetime();

        let balances = {
            baseBalance: this.baseBalance,
            quoteBalance: this.quoteBalance,
        }
        let action = await this.strategy.execute(balances);
        if (action.type === 'BUY') {
            await this.buyToken(action.price);
        } else if (action.type === 'SELL') {
            await this.sellToken(action.price);
        }

        await this.getBalances();
        printBalance(this.symbol, action.price, this.baseBalance, this.quoteBalance);
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
                buyOrder = await this.client.newOrder(this.symbol, 'BUY', 'MARKET', {
                    //price: price,
                    //quantity: numberOfTokenToBuy,
                    //timeInForce: 'GTC',
                    quoteOrderQty: numberOfTokenToBuy * price,
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
                sellOrder = await this.client.newOrder(this.symbol, 'SELL', 'MARKET', {
                    //price: price,
                    quantity: this.baseBalance,
                    //timeInForce: 'GTC',
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
