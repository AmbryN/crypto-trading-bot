const { printDatetime } = require('./utils/Printer');
const Trader = require('./utils/Trader');

const argv = require('yargs/yargs')(process.argv.slice(2))
    .scriptName("index.js")
    .usage('Usage: $0 <command> [options]')
    .example('$0 trade -p ADAUSDT -t 1h -a 25 -r 10', 'Trade with 1 hour time period, using a moving average of 25 periods and a refresh time of 10 min')
    .demandCommand(1)
    .command('trade', 'Trade crypto on Binance\'s testnet', () => { }, (argv) => trade(argv, simulated = false))
    .command('sim', 'Simulate trades using a fake balance but actual prices from Binance', () => { }, (argv) => trade(argv, simulated = true))
    .demandOption(['p', 't', 'a', 'r'])
    .option('p', {
        alias: 'pair',
        nargs: 1,
        describe: 'Crypto Pair',
    })
    .option('t', {
        alias: 'time',
        default: '1h',
        nargs: 1,
        describe: 'Time period',
    })
    .option('a', {
        alias: 'average',
        default: '25',
        nargs: 1,
        describe: 'Moving Average periods',
    })
    .option('r', {
        alias: 'refresh',
        default: '10',
        nargs: 1,
        describe: 'Refresh rate of the bot in minutes',
    })
    .help('h')
    .argv;

function trade(argv, simulated) {
    const pair = argv.pair;
    const periodInHours = argv.time
    const movingAvgPeriod = argv.average
    const refreshTimeMinutes = argv.refresh

    printDatetime();

    const trader = new Trader(simulated = simulated);

    setInterval(async () => {
        console.log("===== START =====")

        await trader.trade(pair, periodInHours, movingAvgPeriod);

        console.log("===== END =====");
    }, refreshTimeMinutes * 60 * 1000);
}