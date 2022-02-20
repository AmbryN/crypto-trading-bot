# Crypto Trading Bot

It allows :
* To simulate ADA/USDT transactions on binance using the Moving Average method
* To set the observation period, the moving average number of periods and the refresh time of the bot

TODO :
* Use actual Binance wallet balances for simulation
* Implement actuel trades via Binance for the crypto pair
* Add support for other pairs

## Use

To use the bot, you will need to :
* Copy the repository
* Create a `var.js` file at the root with the following content
```
const apiKey = 'YOUR_BINANCE_API_KEY';
const apiSecret = 'YOUR_BINANCE_SECRET_KEY';

module.exports = { apiKey, apiSecret }
```
* Use your terminal to launch the script

## Example Use :
The following will launch the script using 1h periods as reference, compute the moving average over 25 periods and use a 10 min refresh for the Bot
```
cd trading
node index.js trade -t 1h -a 25 -r 10
```

The script will indicate how to use it using `node index.js -h`


## Built With

* [Nodejs](https://nodejs.org) - Scripting language
* [Yargs](http://yargs.js.org/) - Commande line arguments management
* [Binance Connector for Node](https://github.com/binance/binance-connector-node) - Interaction with Binance

## Authors

* **Nicolas AMBRY** - *Initial work* - [AmbryN](https://github.com/AmbryN)
