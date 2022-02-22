# Crypto Trading Bot

It allows :
* To choose between **Simulation mode**, which allows to trade using mock balances using actual binances prices, and **Trade mode**, which allows to send actual buy and sell order using actual Binance wallet balance on Binance's testnet
* To trade any Binance Spot symbol using the Moving Average method on actual values of the testnet exchange
* To set the observation period, the number of periods used for the moving average calculation and the refresh time of the bot

## Use

To use the bot, you will need to :
* Copy the repository
* `cd crypto-trading-bot`
* Use `npm install`
* Create a `Keys.js` file in the `/utils` directory, which will hold your Binance Keys for both Environments:
```
function getAPIKeys(simulated) {
    let apiKey, apiSecret;
    if (simulated) {
        // Actual Binance values
        apiKey = 'YOUR_BINANCE_API_KEY';
        apiSecret = 'YOUR_BINANCE_SECRET_KEY';
    } else {
        // Testnet prices
        apiKey = 'YOUR_BINANCES_TESTNET_API_KEY';
        apiSecret = 'YOUR_BINANCES_TESTNET_SECRET_KEY';

    }
    return { apiKey, apiSecret };
}
module.exports = { getAPIKeys }
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
Usage: index.js <command> [options]

Commandes :
  index.js trade  Trade crypto on Binance's testnet
  index.js sim    Simulate trades using a fake balance but actual prices from Binance

Options :
      --version  Affiche le numéro de version                          [booléen]
  -p, --pair     Crypto Pair                                            [requis]
  -t, --time     Time period                            [requis] [défaut : "1h"]
  -a, --average  Moving Average periods                 [requis] [défaut : "25"]
  -r, --refresh  Refresh rate of the bot in minutes     [requis] [défaut : "10"]
  -h             Affiche l'aide                                        [booléen]

Exemples :
  index.js trade -p ADAUSDT -t 1h -a 25 -r  Trade with 1 hour time period, using
  10                                        a moving average of 25 periods and a
                                            refresh time of 10 min
```

The script will indicate how to use it using `node index.js -h`


## Built With

* [Nodejs](https://nodejs.org) - Scripting language
* [Yargs](http://yargs.js.org/) - Commande line arguments management
* [Binance Connector for Node](https://github.com/binance/binance-connector-node) - Interaction with Binance

## Authors

* **Nicolas AMBRY** - *Initial work* - [AmbryN](https://github.com/AmbryN)
