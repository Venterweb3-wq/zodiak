const fs = require('fs');
const path = require('path');

const LOG_FILE_PATH = path.join(__dirname, 'logs', 'debug.log');

// Ensure logs directory exists
if (!fs.existsSync(path.dirname(LOG_FILE_PATH))) {
    fs.mkdirSync(path.dirname(LOG_FILE_PATH));
}

/**
 * Logs a message to both the console and a file.
 * @param {string} message The message to log.
 */
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}`;
    
    // Log to console
    console.log(logMessage);
    
    // Append to log file
    try {
        fs.appendFileSync(LOG_FILE_PATH, logMessage + '\n');
    } catch (error) {
        console.error(`Failed to write to log file: ${error.message}`);
    }
}

module.exports = { log };
