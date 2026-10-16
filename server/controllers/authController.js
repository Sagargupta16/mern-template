import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

import Otp from '../models/Otp.js';
import User from '../models/User.js';
import logger, { sanitizeLog } from '../utils/logger.js';

// Coerce body params to primitive strings to block NoSQL operator injection
// (e.g. { email: { $gt: "" } } which would otherwise bypass findOne)
const toSafeString = (value) => (value === undefined || value === null ? '' : String(value));

export const postSignup = async (req, res) => {
  try {
    const name = toSafeString(req.body.name).trim();
    const email = toSafeString(req.body.email).trim().toLowerCase();
    const password = toSafeString(req.body.password);
    if (!name || !email || !password) {
      return res.status(400).json({ errors: ['Name, Email and Password required'] });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ errors: ['User with the same email already exists'] });
    }

    if (password.length < 6 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      return res.status(401).json({
        errors: ['Password must be at least 6 characters long and contain at least one uppercase, one lowercase and one numeric character.'],
      });
    }

    const hashedPassword = await bcrypt.hash(password, Number(process.env.JWT_SALT_ROUNDS));
    await new User({ name, email, password: hashedPassword }).save();
    logger.info(`New user created: ${sanitizeLog(email)}`);

    res.status(201).json({ messages: ['User created successfully'] });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ errors: ['Internal server error'] });
  }
};

export const getLogin = async (req, res) => {
  try {
    const email = toSafeString(req.body.email).trim().toLowerCase();
    const password = toSafeString(req.body.password);
    if (!email || !password) {
      return res.status(400).json({ status: false, errors: ['Email and Password required'] });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ status: false, errors: ['User Not Found'] });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ status: false, errors: ['Incorrect Password'] });

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    logger.info(`User logged in: ${sanitizeLog(email)}`);
    res.json({ status: true, data: { token }, messages: ['Login Successful'] });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, errors: ['Internal server error'] });
  }
};

export const postVerifyEmail = async (req, res) => {
  try {
    const email = toSafeString(req.body.email).trim().toLowerCase();
    if (!email) return res.status(400).json({ status: false, errors: ['Email required'] });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ status: false, errors: ['User Not Found'] });

    // Remove any existing OTP for this email
    await Otp.deleteMany({ email });

    const otp = String(crypto.randomInt(100000, 999999));
    await new Otp({ email, otp }).save();
    logger.info(`OTP generated for ${sanitizeLog(email)}`);

    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_ID,
        pass: process.env.EMAIL_PASSWORD,
      },
      secure: true,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_ID,
      to: email,
      subject: 'OTP for Verification',
      text: `Your OTP is: ${otp}. Use it to verify your account within 10 minutes.`,
    });

    res.status(200).json({ status: true, messages: [`OTP sent to ${email}`] });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, errors: ['Internal server error'] });
  }
};

export const postVerifyOTP = async (req, res) => {
  try {
    const email = toSafeString(req.body.email).trim().toLowerCase();
    const otp = toSafeString(req.body.otp);
    if (!email || !otp) return res.status(400).json({ status: false, errors: ['Email and OTP required'] });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ status: false, errors: ['User Not Found'] });

    const existingOtp = await Otp.findOne({ email });
    if (!existingOtp) return res.status(401).json({ status: false, errors: ['OTP not generated'] });
    if (existingOtp.otp !== otp) return res.status(401).json({ status: false, errors: ['Incorrect OTP'] });

    // Check OTP expiry (10 minutes)
    const otpAge = Date.now() - new Date(existingOtp.createdAt).getTime();
    if (otpAge > 10 * 60 * 1000) return res.status(401).json({ status: false, errors: ['OTP expired'] });

    logger.info(`User verified: ${sanitizeLog(email)}`);
    res.status(200).json({ status: true, messages: ['Email verified successfully'] });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, errors: ['Internal server error'] });
  }
};

export const postResetPassword = async (req, res) => {
  try {
    const email = toSafeString(req.body.email).trim().toLowerCase();
    const otp = toSafeString(req.body.otp);
    const newPassword = toSafeString(req.body.newPassword);
    if (!email || !newPassword) return res.status(400).json({ status: false, errors: ['Email and Password required'] });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ status: false, errors: ['User Not Found'] });

    const existing = await Otp.findOne({ email });
    if (!existing) return res.status(401).json({ status: false, errors: ['OTP not generated'] });
    if (existing.otp !== otp) return res.status(401).json({ status: false, errors: ['Incorrect OTP'] });

    if (newPassword.length < 6 || !/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return res.status(401).json({
        status: false,
        errors: ['Password must be at least 6 characters long and contain at least one uppercase, one lowercase and one numeric character.'],
      });
    }

    const otpAge = Date.now() - new Date(existing.createdAt).getTime();
    if (otpAge > 10 * 60 * 1000) return res.status(401).json({ status: false, errors: ['OTP expired'] });

    user.password = await bcrypt.hash(newPassword, Number(process.env.JWT_SALT_ROUNDS));
    await user.save();
    await Otp.findByIdAndDelete(existing._id);

    logger.info(`Password reset for ${sanitizeLog(email)}`);
    res.status(200).json({ status: true, messages: ['Password reset successfully'] });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ status: false, errors: ['Internal server error'] });
  }
};
