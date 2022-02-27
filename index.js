const { printDatetime } = require('./utils/Printer');
const Trader = require('./utils/Trader');

const argv = require('yargs/yargs')(process.argv.slice(2))
    .scriptName("index.js")
    .usage('Usage: $0 <command> [options]')
    .example('$0 trade -c ADAUSDT -t 1h -a 25 -r 10', 'Trade with 1 hour time period, using a moving average of 25 periods and a refresh time of 10 min')
    .demandCommand(1)
    .command('trade', '!!!CAUTION!!!: Trade actual crypto on Binance', () => { }, (argv) => trade(argv, env = 'PROD'))
    .command('test', 'TESTMODE: Trade on Binance\'s testnet', () => { }, (argv) => trade(argv, env = 'TEST'))
    .command('sim', 'SIMULATION: Simulate trades using a fake balance but actual prices from Binance', () => { }, (argv) => trade(argv, env = 'SIM'))
    .command('cancel', 'Cancel open orders', () => { }, (argv) => cancel(argv, env = 'TEST'))
    .demandOption(['c', 'p', 't', 'a', 'r'])
    .option('c', {
        alias: 'crypto',
        default: 'BTCUSDT',
        nargs: 1,
        describe: 'Crypto Pair',
    })
    .option('p', {
        alias: 'percentage',
        default: '100',
        nargs: 1,
        describe: '% of quote balance used for trading',
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



function trade(argv, env) {
    const pair = argv.crypto;
    const percentage = argv.percentage;
    const period = argv.time
    const movingAvgPeriod = argv.average
    const refreshTimeMinutes = argv.refresh
    printDatetime();

    const trader = new Trader(env, {
        pair: pair,
        percentage: percentage,
        strategy: {
            type: 'MA',
            period: period,
            movingAvgPeriod: movingAvgPeriod,
        }

    });

    setInterval(async () => {
        console.log("===== START =====")

        await trader.trade();

        console.log("===== END =====");
    }, refreshTimeMinutes * 60 * 1000);
}

function cancel(argv, env) {
    const pair = argv.crypto;
    const percentage = argv.percentage;
    const period = argv.time
    const movingAvgPeriod = argv.average
    const trader = new Trader(env, {
        pair: pair,
        percentage: percentage,
        strategy: {
            type: 'MA',
            period: period,
            movingAvgPeriod: movingAvgPeriod,
        }
    });
    trader.cancelOpenOrders();
}