// controllers/userController.js
const User = require("../models/User");
const Address = require("../models/Address");
const { generateToken } = require("../middleware/auth");
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const { sendPasswordResetEmail } = require('../utils/emailService');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      name,
    });

    // Return user data with token
    res.status(201).json({
      success: true,
      token: generateToken(user.id),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Register a guest user
exports.registerGuest = async (req, res) => {
  try {
    const { email, name, password, address } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ where: { email } });
    
    // If user exists, just return success with existing user data
    if (userExists) {
      return res.status(409).json({
        success: true,
        message: "User already exists",
        user: {
          id: userExists.id,
          name: userExists.name,
          email: userExists.email
        }
      });
    }

    // Create user
    const user = await User.create({
      email,
      password, // Password will be hashed by model hooks
      name,
      role: 'user'
    });
    
    // Create default address if provided
    if (address) {
      await Address.create({
        userId: user.id,
        name: address.name || name,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 || '',
        city: address.city,
        state: address.state || address.city,
        postalCode: address.postalCode,
        country: address.country || 'Vietnam',
        phone: address.phone,
        isDefault: true
      });
    }

    // Send email with password
    try {
      await sendGuestAuthPassword(email, password);
    } catch (emailError) {
      console.error('Error sending guest password email:', emailError);
      // Continue even if email fails
    }

    // Return user data
    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register guest error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Return user data with token
    res.json({
      success: true,
      token: generateToken(user.id),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Log out all devices
exports.logoutAllDevices = async (req, res) => {
  try {
    // Update user's tokenVersion to invalidate all existing tokens
    await User.update(
      { tokenVersion: sequelize.literal('tokenVersion + 1') },
      { where: { id: req.user.id } }
    );
    
    res.json({
      success: true,
      message: "Logged out from all devices successfully"
    });
  } catch (error) {
    console.error("Logout all devices error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// Get current user profile
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { 
        include: ["loyaltyPoints"],
        exclude: ["password"] 
      },
    });

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Address management
exports.addAddress = async (req, res) => {
  try {
    const {
      name,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefault,
    } = req.body;

    // Create address
    const address = await Address.create({
      userId: req.user.id,
      name,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country: country || "Vietnam",
      phone,
      isDefault: isDefault || false,
    });

    // If this is set as default, update other addresses
    if (isDefault) {
      await Address.update(
        { isDefault: false },
        {
          where: {
            userId: req.user.id,
            id: { [Op.ne]: address.id },
          },
        }
      );
    }

    res.status(201).json({
      success: true,
      address,
    });
  } catch (error) {
    console.error("Add address error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.findAll({
      where: { userId: req.user.id },
      order: [
        ["isDefault", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

    res.json({
      success: true,
      addresses,
    });
  } catch (error) {
    console.error("Get addresses error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const {
      name,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefault,
    } = req.body;

    // Find the address and verify ownership
    const address = await Address.findOne({
      where: {
        id: addressId,
        userId: req.user.id,
      },
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found or not authorized",
      });
    }

    // Update address
    await address.update({
      name,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country: country || "Vietnam",
      phone,
      isDefault: isDefault || false,
    });

    // If this is set as default, update other addresses
    if (isDefault) {
      await Address.update(
        { isDefault: false },
        {
          where: {
            userId: req.user.id,
            id: { [Op.ne]: address.id },
          },
        }
      );
    }

    res.json({
      success: true,
      address,
    });
  } catch (error) {
    console.error("Update address error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.id;

    // Find the address and verify ownership
    const address = await Address.findOne({
      where: {
        id: addressId,
        userId: req.user.id,
      },
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found or not authorized",
      });
    }

    // Delete the address
    await address.destroy();

    res.json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Delete address error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Admin User Management
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, role } = req.body;

    // Find the user
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user
    await user.update({
      name: name || user.name,
      email: email || user.email,
      role: role || user.role,
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Find the user
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete the user
    await user.destroy();

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
// Updated userController.js - checkRole function
exports.checkRole = async (req, res) => {
  try {
    console.log(`checkRole called for user ID: ${req.user?.id}`);
    
    // Ensure we have a user ID from the protect middleware
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    // Fetch the user from database to get the most current role
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'role', 'email', 'name']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    console.log(`User role found: ${user.role} for user ID: ${user.id}`);
    
    res.json({
      success: true,
      role: user.role,
      userId: user.id
    });
  } catch (error) {
    console.error("Error checking role:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    // Check if email is being changed and if it's already taken
    if (email && email !== req.user.email) {
      const emailExists = await User.findOne({ where: { email } });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }
    }

    // Update user profile
    const user = await User.findByPk(userId);
    await user.update({
      name: name || user.name,
      email: email || user.email,
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    
    // Always return success even if email doesn't exist (prevents user enumeration)
    if (!user) {
      return res.json({
        success: true,
        message: "If a user with that email exists, a password reset link has been sent."
      });
    }

    // Generate a secure reset token with shorter expiration
    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h" // Shorter expiration for security
    });
    
    // Store token hash in database with expiration timestamp
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    await user.update({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: Date.now() + 3600000 // 1 hour
    });

    // Send email with reset link
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail(email, resetUrl);
    
    res.json({
      success: true,
      message: "If a user with that email exists, a password reset link has been sent."
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};



// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Find user
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update loyalty points
exports.updateLoyaltyPoints = async (req, res) => {
  try {
    const userId = req.params.id;
    const { points } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.loyaltyPoints = parseFloat(user.loyaltyPoints || 0) + points;
    await user.save();

    res.json({ success: true, loyaltyPoints: user.loyaltyPoints });
  } catch (error) {
    console.error("Loyalty update error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, user });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
