class Strategy {

    client;
    type;
    symbol;

    constructor(client, symbol, strategy) {
        this.client = client;
        this.type = strategy.type;
        this.symbol = symbol;
    }
}

module.exports = { Strategy }