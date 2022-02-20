const Trading = require('./trading');

const argv = require('yargs/yargs')(process.argv.slice(2))
    .scriptName("trading")
    .usage('Usage: $0 <command> [options]')
    .command('trade', 'Trade ADAUSDT on Binance')
    .example('$0 trade -t 1h -a 25 -r 10', 'Trade with 1 hour time period, using a moving average of 25 periods and a refresh time of 10 min')
    .demandOption(['t', 'a', 'r'])
    .alias('t', 'time')
    .nargs('t', 1)
    .describe('t', 'Time period')
    .alias('a', 'average')
    .nargs('a', 1)
    .describe('a', 'Number of Moving Average periods')
    .alias('r', 'refresh')
    .nargs('r', 1)
    .describe('r', 'Refresh rate of trading bot in minutes')
    .help('h')
    .argv;

const periodInHours = argv.time
const movingAvgPeriod = argv.average
const refreshTimeMinutes = argv.refresh
const trader = new Trading();
trader.printDateTime();

setInterval(async () => {
    console.log("===== START =====")

    await trader.trade('ADAUSDT', periodInHours, movingAvgPeriod);

    console.log("===== END =====");
}, refreshTimeMinutes * 60 * 1000);
