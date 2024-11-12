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
          console.error('Error comparing passwords:', err);
          return res.status(500).json({ message: 'Internal server error' });
        }
        if (!isMatch) {
          console.log(`Invalid login attempt for user ${email}`);
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        // User is authenticated, generate JWT
        const { password, ...userWithoutPassword } = user; // Exclude password from the token

        // Use middleware to generate token
        const token = generateToken(userWithoutPassword);

         // Log when a token is generated
        console.log(`JWT generated for ${user.first_name} with ID ${user.id}`);

        // Set JWT as an HttpOnly cookie
        res.cookie('authToken', token, {
          httpOnly: true,  // Prevents access from JavaScript
          sameSite: 'Strict', // Protect against CSRF
          expires: new Date(Date.now() + 3600000),  // 1 hour
        });

        console.log("userWithoutPassword:",userWithoutPassword);
        res.status(200).json({
          message: 'Login successful',
          user: userWithoutPassword,
        });
      });
    });
  },

  register: (req, res) => {
    const { email, password, first_name, last_name } = req.body;
  
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({ message: 'Error hashing password' });
      }
  
      console.log('Attempting to create user with email:', email);


      User.createUser(email, hashedPassword, first_name, last_name, (err, result) => {
        if (err) {
          console.error('Database Error:', err);  // Log the full error to help debug

          return res.status(500).json({ message: 'Error creating user' });
        }
        console.log('User created successfully with ID:', result.insertId);

        res.status(201).json({ message: 'User registered', userId: result.insertId });
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

    const token = req.cookies.authToken; // JWT from the 'authToken' cookie

    if (!token) {
      console.log('No token found in request cookies');
      return res.status(401).json({ message: 'No token provided' });
    }

    // Currently only retrieving the ID and first_name from the decoded token (as that is whats encoded as per login above)
    // Can add a check here to retrieve all the data or ncessessary data upon verification and send back to front
    // Will cehck if needed
  
    try {
      const user = verifyToken(token);  // Verify the token
  
      if (!user) {
        console.log('Token verification failed. Invalid or expired token.');
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
  
      // If the token is valid, return the user data
      res.status(200).json({ user });
    } catch (err) {
      console.error('Error verifying token:', err);
      res.status(500).json({ message: 'Error verifying token' });
    }
  },
};

module.exports = authController;