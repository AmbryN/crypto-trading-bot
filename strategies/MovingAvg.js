const { Strategy } = require("./Strategy");

class MovingAvg extends Strategy {

    period;
    movingAvgPeriod;

    constructor(client, symbol, strategy) {
        super(client, symbol, strategy);
        this.period = strategy.period;
        this.movingAvgPeriod = strategy.movingAvgPeriod;
    }

    async execute(balances) {
        let prices = await this.getPrices()
        let price = prices.price

        if (this.shouldBuy(prices, balances)) {
            return {
                type: 'BUY',
                price: price,
            }
        } else if (this.shouldSell(prices, balances)) {
            return {
                type: 'SELL',
                price: price,
            }
        } else {
            return {
                type: 'NONE',
                price: price,
            }
        }
    }

    /**
    * * Gets the prices used for the Moving Average algorithm 
    * @returns {Object} prices
    */
    async getPrices() {
        let previousPrice = await this.getPreviousPrice()
        let movingAvg = await this.getMovingAvg();
        let price = await this.getTickerPrice();
        return {
            previousPrice,
            movingAvg,
            price,
        }
    }

    /**
    * *Get instant trading price of that symbol
    * @return {Number} price : Instant trading price of the symbol
    */
    async getTickerPrice() {
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
    * * Used to check if Bot should buy token 
    */
    shouldBuy(prices, balances) {
        let { previousPrice, movingAvg, price } = prices;
        return price > movingAvg && previousPrice < movingAvg && balances.quoteBalance > 10;
    }

    /**
    * * Used to check if Bot should sell token 
    */
    shouldSell(prices, balances) {
        let { previousPrice, movingAvg, price } = prices;
        let should = price < movingAvg && previousPrice > movingAvg && balances.baseBalance > 0
        return should
    }
}

module.exports = { MovingAvg }