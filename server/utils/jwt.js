const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Generate a signed JWT token
 * @param {Object} payload - Data to embed in the token (e.g. { id, role, email })
 * @param {string} [expiresIn] - Optional custom expiry
 * @returns {string} Signed JWT token
 */
const generateToken = (payload, expiresIn = config.jwtExpiresIn) => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn
  });
};

/**
 * Verify and decode a JWT token
 * @param {string} token
 * @returns {Object} Decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};

module.exports = {
  generateToken,
  verifyToken
};
