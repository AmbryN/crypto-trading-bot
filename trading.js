const { Spot } = require('@binance/connector');
const { apiKey, apiSecret } = require('./var.js')

const client = new Spot(apiKey, apiSecret);

class Trading {
    USDT_balance
    ADA_balance

    constructor() {
        this.USDT_balance = 100;
        this.ADA_balance = 0;
    }

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

    async getPreviousPrice(symbol, periodInHours) {
        const result = await client.klines(symbol, periodInHours, { limit: 2 });
        const previous_price = result.data[0][4]

        console.log(`===== Previous price: ${previous_price} =====`)
        return previous_price;
    }

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

    async getMovingAvg(symbol, periodInHours, movingAvgPeriod) {
        const result = await client.klines(symbol, periodInHours, { limit: movingAvgPeriod });
        const data = result.data
        let sum = data.reduce((accum, value) => {
            accum += parseFloat(value[4])
            return accum
        }, 0)
        const movingAvg = (sum / data.length).toPrecision(4)

        console.log(`===== Moving Average: ${movingAvg} =====`)
        return movingAvg;
    }

    async getActualPrice(symbol) {
        const result = await client.tickerPrice("ADAUSDT");
        const price = parseFloat(result.data.price)

        console.log(`===== Actual Price: ${price} =====`)
        return price;
    }

    buyToken(price) {
        const fee = price * 0.001
        const numberOfADA = this.USDT_balance * 1 / (price + fee)
        this.ADA_balance += numberOfADA;
        this.USDT_balance -= (numberOfADA * (price + fee))
        console.log(`===== Buy transaction: bought ${numberOfADA} ADA for ${price} USDT =====`)
    }

    sellToken(price) {
        const fee = price * 0.001
        const numberOfADA = this.ADA_balance * 1
        this.ADA_balance -= numberOfADA
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

module.exports = Trading