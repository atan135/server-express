const log4js = require("log4js");
const path = require("path");

// Ensure logs directory exists
const fs = require("fs");
const logsDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Configure log4js
const log4jsConfig = require("../config/log4js.config");
log4js.configure(log4jsConfig);

const logger = log4js.getLogger("http");

const httpLogger = log4js.connectLogger(logger, {
  level: "auto",
  format: ":method :url :status :response-time ms - :res[content-length] bytes",
});

module.exports = {
  httpLogger,
  logger: log4js.getLogger,
};
