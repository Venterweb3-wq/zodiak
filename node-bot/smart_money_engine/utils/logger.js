const winston = require('winston');
const path = require('path');

// Определяем путь к лог-файлу в корне проекта
const logFilePath = path.join(process.cwd(), 'engine.log');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(info => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
  ),
  transports: [
    //
    // - Write all logs with level `info` and below to `engine.log`
    // - Write all logs with level `error` and below to the console
    //
    new winston.transports.File({ 
      filename: logFilePath,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json() // Для структурированных логов в файле
      ) 
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          info => `${info.timestamp} ${info.level}: ${info.message}`
        )
      )
    })
  ],
  exitOnError: false, // не завершать процесс при ошибке логгера
});

logger.stream = {
  write: function(message, encoding) {
    logger.info(message.trim());
  },
};

module.exports = logger; 