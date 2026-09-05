/**
 * Application Logger
 * Simple, structured console logger with timestamps and levels
 */

const info = (...args) => {
  console.log(`[${new Date().toISOString()}] [INFO]:`, ...args);
};

const warn = (...args) => {
  console.warn(`[${new Date().toISOString()}] [WARN]:`, ...args);
};

const error = (...args) => {
  console.error(`[${new Date().toISOString()}] [ERROR]:`, ...args);
};

const debug = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    console.debug(`[${new Date().toISOString()}] [DEBUG]:`, ...args);
  }
};

module.exports = {
  info,
  warn,
  error,
  debug
};
