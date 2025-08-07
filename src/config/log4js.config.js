const path = require("path");
const logLevel = process.env.NODE_ENV === "production" ? "info" : "debug";

module.exports = {
  appenders: {
    console: {
      type: "console",
    },
    app: {
      type: "dateFile",
      filename: path.join(__dirname, "../../logs/app.log"),
      pattern: "yyyy-MM-dd",
      keepFileExt: true,
    },
    errorFile: {
      type: "dateFile",
      filename: path.join(__dirname, "../../logs/errors.log"),
      pattern: "yyyy-MM-dd",
      keepFileExt: true,
    },
    errors: {
      type: "logLevelFilter",
      level: "error",
      appender: "errorFile",
    },
  },
  categories: {
    default: {
      appenders: ["console", "app", "errors"],
      level: logLevel,
    },
  },
};
