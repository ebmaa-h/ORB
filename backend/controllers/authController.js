const User = require('../models/userModel');

const bcrypt = require('bcryptjs');
const { generateToken, verifyToken } = require('../utils/jwt');

const authController = {
  login: async (req, res) => {
    try {
      console.log("Logging in...");
      const { email, password } = req.body;
      const user = await User.loginUser(email); // Await loginUser
  
      if (!user) {
        console.log(`Login failed. No user found for email: ${email}`);
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Remove decryption during dev process, add later, add later
      // const isMatch = await bcrypt.compare(password, user.password);
      // if (!isMatch) {
      //   console.log("Wrong password...");
      //   return res.status(401).json({ message: 'Invalid credentials' });
      // }
  
      // Generate JWT & remove password
      const { password: _, ...userWithoutPassword } = user;
      const token = generateToken(userWithoutPassword);
      console.log(`JWT generated for ${user.first} with ID ${user.user_id}`);
  
      // Set HttpOnly cookie
      res.cookie('authToken', token, { httpOnly: true, sameSite: 'Strict', expires: new Date(Date.now() + 3600000) });
  
      res.status(200).json({ message: 'Login successful', user: userWithoutPassword });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
  

  register: async (req, res) => {
    console.log("Registering User...");
    const { email, password, first, last, address, tell_nr } = req.body;
  
    try {
      // Hash the password, removed during dev, replace later
      // const hashedPassword = await bcrypt.hash(password, 10); 
      const hashedPassword = password;
      const userDetails = { email, password: hashedPassword, first, last, tell_nr, address };
  
      const result = await User.createUser(userDetails); // Await user creation
      console.log("User created successfully with ID:", result.userId);
  
      res.status(201).json({ message: "User Registered", userId: result.userId });
    } catch (err) {
      console.error("Database Error:", err);
      res.status(400).json({ message: err.message || "Error creating user", details: err.details || {} });
    }
  },
  
  clientRegister: async (req, res) => {
    console.log("Registering Client...");
    const { email, password, first, last, registration_nr, practice_nr, client_type, tell_nr } = req.body;
  
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const clientDetails = { email, password: hashedPassword, first, last, registration_nr, practice_nr, tell_nr, client_type };
  
      const result = await User.createClient(clientDetails);
      console.log("Client created successfully with ID:", result.clientId);
  
      res.status(201).json({ message: "Client Registered", clientId: result.clientId });
    } catch (err) {
      console.error("Database Error:", err);
      res.status(400).json({ message: err.message || "Error creating client", details: err.details || {} });
    }
  },
  
  logout: (req, res) => {
    try {
      res.clearCookie('authToken', {
        httpOnly: true,
        sameSite: 'Strict',
      });
      res.status(200).json({ message: 'Logout successful' });
    } catch (err) {
      console.error('Error during logout:', err);
      res.status(500).json({ message: 'Error during logout' });
    }
  },
  
  verify: async (req, res) => {
    console.log("Verifying JWT...");
    const token = req.cookies.authToken; 
    console.log('Received token:', token);
  
    if (!token) {
      console.log('No token found in request cookies');
      return res.status(401).json({ message: 'No token provided' });
    }
  
    try {
      // `verifyToken` is sync, but we'll handle it with async/await for consistency
      const user = await verifyToken(token);  // No need for `await` if verifyToken is sync
  
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