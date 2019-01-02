var environments = {};

environments.dev = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'envName': 'dev'
};

environments.prod = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'prod'
};

var currentEnv = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

var envToExport = typeof(environments[currentEnv]) === 'object' ? environments[currentEnv] : environments.dev;

module.exports = envToExport;
