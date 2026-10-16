import User from '../models/User.js';
import logger from '../utils/logger.js';

export const viewAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ errors: ['Internal server error'] });
  }
};

export const viewSingleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ errors: ['User not found'] });
    res.json(user);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ errors: ['Internal server error'] });
  }
};

export const updateUser = async (req, res) => {
  try {
    // Scope updates to the authenticated user only (prevents IDOR)
    if (req.params.id !== req.user.id) {
      return res.status(403).json({ errors: ['Forbidden'] });
    }

    // Whitelist editable fields (prevents mass-assignment of email/password/role).
    // Password changes go through the dedicated reset flow in authController.
    // Only plain strings reach the update document: an object such as { "$gt": "" } or an
    // operator payload would otherwise be passed to Mongo as-is (NoSQL injection).
    const updates = {};
    const { name } = req.body;
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ errors: ['Name must be a non-empty string'] });
      }
      updates.name = name.trim();
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, { returnDocument: 'after' }).select('-password');
    if (!user) return res.status(404).json({ errors: ['User not found'] });
    res.json(user);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ errors: ['Internal server error'] });
  }
};

export const deleteUser = async (req, res) => {
  try {
    // Scope deletes to the authenticated user only (prevents IDOR)
    if (req.params.id !== req.user.id) {
      return res.status(403).json({ errors: ['Forbidden'] });
    }

    const user = await User.findByIdAndDelete(req.user.id);
    if (!user) return res.status(404).json({ errors: ['User not found'] });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ errors: ['Internal server error'] });
  }
};
