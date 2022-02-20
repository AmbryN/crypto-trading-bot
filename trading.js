class Trading {
    async getLastPrice() {
        client.klines("ADAUSDT", `${periodInHours}`, { limit: 2 }).then(result => {
            let previous_price = result.data[0][4];

            console.log("============ Previous price ============")
            console.log(`Previous price was: ${previous_price}`)
        }
    }
}



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
console.log(`======= Timestamp : ${DateTime} =======`)


console.log("=========== Moving Average ===========")
    let movingAvg;
    client.klines("ADAUSDT", `${periodInHours}`, { limit: movingAvgPeriod }).then(result => {
        const data = result.data
        let sum = data.reduce((accum, value) => {
            accum += parseFloat(value[4])
            return accum
        }, 0)
        movingAvg = (sum / data.length).toPrecision(3)
        console.log(`Moving average : ${movingAvg}`)
        console.log("============ Actual Price ===========")
        client.tickerPrice("ADAUSDT")
            .then(result => {
                let price = parseFloat(result.data.price)
                console.log(`Price is : ${price}`)
                if (price > movingAvg && previous_price < movingAvg && USDT_balance > price) {
                    ADA_balance += 1
                    USDT_balance -= (price * 1.001)
                    console.log("Transaction made!")
                } else if (price < movingAvg && previous_price > movingAvg && ADA_balance > 0) {
                    ADA_balance -= 1
                    USDT_balance += (price * 0.999)
                    console.log("Transaction made!")
                }
                previous_price = price
                console.log("=========== Balance ==========")
                console.log(`ADA Balance is ${ADA_balance}`)
                console.log(`USDT Balance is ${USDT_balance}`)
                console.log("=========== End  ===========")
            });
    })
});