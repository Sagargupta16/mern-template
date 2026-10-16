import jwt from 'jsonwebtoken';

import User from '../models/User.js';
import logger, { sanitizeLog } from '../utils/logger.js';

export const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) throw new Error('Invalid or missing Authorization header');

    // jwt.verify already checks expiry -- no manual check needed
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) throw new Error('User not found');

    req.token = token;
    req.user = user;
    logger.info(`User ${sanitizeLog(user.email)} authenticated`);
    next();
  } catch (error) {
    // A token with a non-JSON payload surfaces a JSON.parse message that echoes part of the token
    logger.error(sanitizeLog(error.message));
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    } else {
      res.status(401).json({ message: 'Unauthorized' });
    }
  }
};
