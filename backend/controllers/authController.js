const User = require('../models/userModel');

const bcrypt = require('bcryptjs');
const { generateToken, verifyToken } = require('../utils/jwt');

const authController = {
  login: (req, res) => {
    const { email, password } = req.body;

    User.findByEmail(email, (err, user) => {
      if (err) {
        console.error('Error finding user:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }
      if (!user) {
        console.log(`Login attempt failed. User with email ${email} not found.`);
        return res.status(404).json({ message: 'User not found' });
      }

      // Compare the password with the hashed password
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          console.error('Error comparing passwords...');
          return res.status(500).json({ message: 'Internal server error' });
        }
        if (!isMatch) {
          console.log('Wrong password...');
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        // User is authenticated, generate JWT
        const { password, ...userWithoutPassword } = user; // Exclude password from the token

        // Use middleware to generate token
        const token = generateToken(userWithoutPassword);

         // Log when a token is generated
        console.log(`JWT generated for ${user.first} with ID ${user.id}`);

        // Set JWT as an HttpOnly cookie
        res.cookie('authToken', token, {
          httpOnly: true,  // Prevents access from JavaScript
          sameSite: 'Strict', // Protect against CSRF
          expires: new Date(Date.now() + 3600000),  // 1 hour
        });

        console.log("User Created:",userWithoutPassword);
        res.status(200).json({
          message: 'Login successful',
          user: userWithoutPassword,
        });
      });
    });
  },

  register: (req, res) => {
    console.log("Registering User...");
    const { email, password, first, last, address, tell_nr} = req.body;
  
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error("Error hashing password:", err);
        return res.status(500).json({ message: "Error hashing password" });
      }
        
      const userDetails = {
        email,
        password: hashedPassword,
        first,
        last,
        tell_nr,
        address,
      }

      User.createUser(userDetails, (err, result) => {
        if (err) {
          console.error("Database Error:", err);
          return res.status(400).json({ message: err.message || "Error creating user", details: err.details || {} });

        }
        console.log("User created successfully with ID:", result.userId);
        res.status(201).json({
          message: "User Registered",
          userId: result.userId,
        });
      });
    });
  },

  doctorRegister: (req, res) => {
    console.log("Registering Doctor...");
    const { email, password, first, last, registration_nr, practice_nr, doctor_type, tell_nr } = req.body;
  
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error("Error hashing password:", err);
        return res.status(500).json({ message: "Error hashing password" });
      }
        
      const doctorDetails = {
        email,
        password: hashedPassword,
        first,
        last,
        registration_nr,
        practice_nr,
        tell_nr,
        doctor_type,
      }

      User.createDoctor(doctorDetails, (err, result) => {
        if (err) {
          console.error("Database Error:", err);
          return res.status(400).json({ message: err.message || "Error creating doctor", details: err.details || {} });

        }
        console.log("Doctor created successfully with ID:", result.doctorId);
        res.status(201).json({
          message: "Doctor Registered",
          doctor_id: result.userId,
        });
      });
    });
  },
  
  
  logout: (req, res) => {
    res.clearCookie('authToken', {
      httpOnly: true,
      sameSite: 'Strict',
    });

    res.status(200).json({ message: 'Logout successful' });
  },

  verify: (req, res) => {
    console.log("Verifying JWT...");
    const token = req.cookies.authToken; 
    console.log('Received token:', token);

    if (!token) {
      console.log('No token found in request cookies');
      return res.status(401).json({ message: 'No token provided' });
    }
  
    try {
      const user = verifyToken(token);  // Verify the token
  
      if (!user) {
        console.log('JWT verification failed...');
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
  
      // If the token is valid, return the user data
      console.log('JWT Verified...');
      res.status(200).json({ user });
    } catch (err) {
      console.error('Error verifying token: ', err);
      res.status(500).json({ message: 'Error verifying token' });
    }
  },
};

module.exports = authController;