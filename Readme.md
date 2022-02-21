# Crypto Trading Bot

It allows :
* To **send Buy / Sell orders** on Binance's testnet using actual Binance wallet balances 
* To trade any Binance Spot symbol (available on the Testnet) using the Moving Average method on actual values of the testnet exchange
* To set the observation period, the number of periods used for the moving average calculation and the refresh time of the bot


## Use

To use the bot, you will need to :
* Copy the repository
* Create a `var.js` file at the root which will hold your Binance Keys :
```
const apiKey = 'YOUR_BINANCE_API_KEY';
const apiSecret = 'YOUR_BINANCE_SECRET_KEY';

// On the binance-balances branch
module.exports = { apiKey, apiSecret, { baseURL: 'https://testnet.binance.vision' } }
```
* Use your terminal to launch the script
* The script will output the Datetime at which it has been launched followed by the DateTime, prices, executed buy/sell, and balance status after every refresh
> ===== START =====
>
> ===== DateTime : lundi 21 février 2022 à 22:24:35 =====
>
> ===== Previous price: 37376.97000000 =====
> 
> ===== Moving Average: 37345.7133 =====
>
> ===== Actual Price: 37271.79 =====
>
> ===== Balance BTCUSDT: Base token 0 / Quote token 48120.8 - Total Value: 48120.8 =====
>
> ===== END =====

## Example Use :
The following options are availables :
```
-p, --pair : Crypto pair to trade
-t, --time : Reference period [1min, 3min, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M]
-a, --average : Number of period for computing the moving average
-r, --refresh : Refresh time for the Bot, ie. how often will it check for the price to buy or sell
```
The following will launch the script using 1h period as reference, compute the moving average over 25 periods and use a 10 min refresh time for the Bot
```
cd trading
node index.js -p BTCUSDT -t 1h -a 25 -r 10
```
If you launch the script with the pair only `-p`, it will use the following defaults for the other options
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
