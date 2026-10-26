
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");

const router = express.Router();

// Send password-reset emails using SMTP settings from .env
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// REGISTER NEW USER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      !name?.trim() ||
      !email?.trim() ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        message:
          "Enter your name, email and a password of at least 8 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered. Please log in.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(201).json({
      message: "Account created successfully!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email already registered. Please log in.",
      });
    }

    return res.status(500).json({
      message: "Registration failed. Please try again.",
    });
  }
});

// LOGIN EXISTING USER
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message: "Please enter your email and password.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (
      !user ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Login failed. Please try again.",
    });
  }
});

// CHANGE PASSWORD — requires a valid login token
router.post("/change-password", async (req, res) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Please log in to change your password.",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(
        authorization.slice(7),
        process.env.JWT_SECRET
      );
    } catch {
      return res.status(401).json({
        message: "Your login session is invalid or expired. Please log in again.",
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (
      typeof currentPassword !== "string" ||
      !currentPassword ||
      typeof newPassword !== "string" ||
      newPassword.length < 8
    ) {
      return res.status(400).json({
        message: "Enter your current password and a new password of at least 8 characters.",
      });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        message: "User account not found.",
      });
    }

    const matches = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!matches) {
      return res.status(400).json({
        message: "Your current password is incorrect.",
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);

    // Invalidate any outstanding reset link
    user.passwordResetTokenHash = null;
    user.passwordResetExpires = null;

    await user.save();

    return res.status(200).json({
      message: "Password changed successfully. Please log in again if needed.",
    });
  } catch (error) {
    console.error("Change password error:", error.message);

    return res.status(500).json({
      message: "Could not change your password. Please try again.",
    });
  }
});

// FORGOT PASSWORD — email a time-limited reset link
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        message: "Please enter your email address.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    // Use the same response whether or not the account exists.
    const message =
      "If an account exists for that email, a password-reset link will be sent.";

    if (!user) {
      return res.status(200).json({ message });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("Password-reset email settings are missing.");
      return res.status(503).json({
        message: "Password-reset email is not configured. Please try again later.",
      });
    }

    // Create a random token; store only its SHA-256 hash.
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.passwordResetTokenHash = resetTokenHash;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    const frontendUrl = (
      process.env.FRONTEND_URL || "http://localhost:5173"
    ).replace(/\/+$/, "");

    const resetUrl =
      `${frontendUrl}/account-settings?token=${resetToken}`;

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Reset your StudentSpend password",
        text:
          `Hello ${user.name},\n\n` +
          `Use this link to reset your StudentSpend password:\n${resetUrl}\n\n` +
          `This link expires in 15 minutes. If you did not request this, you can ignore this email.`,
        html: `
          <p>Hello ${user.name},</p>
          <p>We received a request to reset your StudentSpend password.</p>
          <p><a href="${resetUrl}">Reset my password</a></p>
          <p>This link expires in 15 minutes. If you did not request this, you can ignore this email.</p>
        `,
      });
    } catch (emailError) {
      // Do not leave a usable reset token behind if sending fails.
      user.passwordResetTokenHash = null;
      user.passwordResetExpires = null;
      await user.save();

      console.error("Password-reset email error:", emailError.message);

      return res.status(503).json({
        message: "Could not send the reset email. Check your email settings and try again.",
      });
    }

    return res.status(200).json({ message });
  } catch (error) {
    console.error("Forgot password error:", error.message);

    return res.status(500).json({
      message: "Could not process your request. Please try again.",
    });
  }
});

// RESET PASSWORD — validate token and expiry
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (
      typeof token !== "string" ||
      !token ||
      typeof newPassword !== "string" ||
      newPassword.length < 8
    ) {
      return res.status(400).json({
        message: "A valid reset token and a new password of at least 8 characters are required.",
      });
    }

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetTokenHash: resetTokenHash,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "This reset link is invalid or expired. Please request a new one.",
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordResetTokenHash = null;
    user.passwordResetExpires = null;

    await user.save();

    return res.status(200).json({
      message: "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error.message);

    return res.status(500).json({
      message: "Could not reset your password. Please try again.",
    });
  }
});

module.exports = router;
