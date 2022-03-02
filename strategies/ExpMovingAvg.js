const { floorToDecimals } = require("../utils/Math");
const { MovingAvg } = require("./MovingAvg");

class ExpMovingAvg extends MovingAvg {

    constructor(client, symbol, strategy) {
        super(client, symbol, strategy);
    }

    /**
     * * Gets the {movingAvgPeriod * 2 - 1} last closing prices
     * Each Exponential Moving Average needs {movingAvgPeriod} values to be calculated
     * @returns {Array} lastPrices
     */
    async getLastClosingPrices() {
        let lastCandles;
        try {
            lastCandles = await this.client.klines(this.symbol, this.period, { limit: this.movingAvgPeriod * 2 - 1 });
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

        let multiplier = 2 / (this.movingAvgPeriod + 1);

        let movingAvg = this.EMA(lastPrices, multiplier, lastPrices.length);

        console.log(`===== Exp. Moving Average: ${movingAvg} ===== `)
        return movingAvg;
    }

    /**
    * *Helper to calculate Exponential Moving Average
    * @return {Number} ExpMovingAvg : Computed exponential moving average
    */
    EMA(lastPrices, multiplier, current) {
        let lookBackValue = this.movingAvgPeriod;
        if (current === lookBackValue) {
            // Compute the moving average
            let sum = 0;
            for (let i = 0; i < lookBackValue; i++) {
                sum += lastPrices[i];
            }
            let firstSMA = floorToDecimals(sum / lookBackValue, 4);
            return firstSMA;
        } else {
            let previousEMA = this.EMA(lastPrices, multiplier, current - 1);
            return (lastPrices[current - 1] - previousEMA) * multiplier + previousEMA;
        }
    }
}
module.exports = { ExpMovingAvg };