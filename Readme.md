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
* Create a `var.js` file at the root which will hold your Binance Keys :
```
const apiKey = 'YOUR_BINANCE_API_KEY';
const apiSecret = 'YOUR_BINANCE_SECRET_KEY';

module.exports = { apiKey, apiSecret }
```
* Use your terminal to launch the script
* The script will output the Datetime at which it has been launched followed by the DateTime, prices, executed buy/sell, and balance status after every refresh
> ===== START =====
>
> ===== DateTime : dimanche 20 février 2022 à 17:42:33 =====
> 
> ===== Previous price: 0.93800000 =====
> 
> ===== Moving Average: 0.9614 =====
> 
> ===== Actual Price: 0.941 =====
> 
> ===== Balance: ADA 0 / USDT 100 =====
> 
> ===== END =====

## Example Use :
The following options are availables :
```
-t, --time : Reference period [1min, 3min, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w]
-a, --average : Number of period for computing the moving average
-r, --refresh : Refresh time for the Bot, ie. how often will it check for the price to buy or sell
```
The following will launch the script using 1h periods as reference, compute the moving average over 25 periods and use a 10 min refresh for the Bot
```
cd trading
node index.js -t 1h -a 25 -r 10
```
If you launch the script without the option, it use the default
```
-t 1h -a 25 -r 10
```

The script will indicate how to use it using `node index.js -h`


## Built With

* [Nodejs](https://nodejs.org) - Scripting language
* [Yargs](http://yargs.js.org/) - Commande line arguments management
* [Binance Connector for Node](https://github.com/binance/binance-connector-node) - Interaction with Binance

## Authors

* **Nicolas AMBRY** - *Initial work* - [AmbryN](https://github.com/AmbryN)
