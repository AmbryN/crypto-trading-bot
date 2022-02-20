const Trader = require('./utils/trader');

const argv = require('yargs/yargs')(process.argv.slice(2))
    .scriptName("trading")
    .usage('Usage: $0 <command> [options]')
    .example('$0 -t 1h -a 25 -r 10', 'Trade with 1 hour time period, using a moving average of 25 periods and a refresh time of 10 min')
    .demandOption(['t', 'a', 'r'])
    .alias('t', 'time')
    .default('t', '1h')
    .nargs('t', 1)
    .describe('t', 'Time period')
    .alias('a', 'average')
    .nargs('a', 1)
    .default('a', 25)
    .describe('a', 'Number of Moving Average periods')
    .alias('r', 'refresh')
    .nargs('r', 1)
    .default('r', 10)
    .describe('r', 'Refresh rate of trading bot in minutes')
    .help('h')
    .argv;

const periodInHours = argv.time
const movingAvgPeriod = argv.average
const refreshTimeMinutes = argv.refresh
const trader = new Trader();
trader.printDateTime();

// Check every refreshTimeMinutes to buy or sell
setInterval(async () => {
    console.log("===== START =====")

    await trader.trade('ADAUSDT', periodInHours, movingAvgPeriod);

    console.log("===== END =====");
}, refreshTimeMinutes * 60 * 1000);
