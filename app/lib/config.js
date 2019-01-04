var environments = {};

environments.dev = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: "dev",
  hashingSecret: "thisIsASecret",
  maxChecks: 5,
  twilio: {
    accountSid: "ACb32d411ad7fe886aac54c665d25e5c5d",
    authToken: "9455e3eb3109edc12e3d8c92768f7a67",
    fromPhone: "+15005550006"
  }
};

environments.prod = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: "prod",
  hashingSecret: "thisIsAlsoASecret",
  maxChecks: 5,
  twilio: {
    accountSid: "",
    authToken: "",
    fromPhone: ""
  }
};

var currentEnv =
    typeof process.env.NODE_ENV === "string"
        ? process.env.NODE_ENV.toLowerCase()
        : "";

var envToExport =
    typeof environments[currentEnv] === "object"
        ? environments[currentEnv]
        : environments.dev;

module.exports = envToExport;
