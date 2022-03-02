const { floorToDecimals } = require("../utils/Math");
const { MovingAvg } = require("./MovingAvg");

class SimpleMovingAvg extends MovingAvg {
    constructor(client, symbol, strategy) {
        super(client, symbol, strategy);
    }

    /**
     * * Gets the {movingAvgPeriod} last closing prices
     * @returns {Array} lastPrices
     */
    async getLastClosingPrices() {
        let lastCandles;
        try {
            lastCandles = await this.client.klines(this.symbol, this.period, { limit: this.movingAvgPeriod });
        } catch (err) {
            console.error(`Error: ${err}`);
            return;
        }

        let data = lastCandles.data
        let lastPrices = data.reduce((accum, item) => {
            accum.push(parseFloat(item[4]));
            return accum;
        }, [])

        return lastPrices;
    }

    /**
    * *Calculate moving average from that symbol
    * @return {Number} movingAvg : Computed moving average
    */
    async getMovingAvg() {
        let lastPrices = await this.getLastClosingPrices();
        // Compute the moving average
        let sum = lastPrices.reduce((accum, value) => {
            accum += value
            return accum
        }, 0)
        let movingAvg = floorToDecimals(sum / lastPrices.length, 4)

        console.log(`===== Moving Average: ${movingAvg} ===== `)
        return movingAvg;
    }
}

module.exports = { SimpleMovingAvg };