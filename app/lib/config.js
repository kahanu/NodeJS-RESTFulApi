var environments = {};

environments.dev = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'envName': 'dev',
    'hashingSecret': 'thisIsASecret',
    'maxChecks': 5
};

environments.prod = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'prod',
    'hashingSecret': 'thisIsAlsoASecret',
    'maxChecks': 5
};

var currentEnv = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

var envToExport = typeof(environments[currentEnv]) === 'object' ? environments[currentEnv] : environments.dev;

module.exports = envToExport;
