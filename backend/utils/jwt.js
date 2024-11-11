require('dotenv').config();
const jwt = require('jsonwebtoken');

// Create a JWT token
const generateToken = (user) => {

  const payload = { id: user.id, email: user.email };
  const secretKey = process.env.JWT_SECRET;
  const options = { expiresIn: '1h' };
  
  return jwt.sign(payload, secretKey, options);
};

// Verify the JWT token
const verifyToken = (token) => {
  const secretKey = process.env.JWT_SECRET;

  try {
    // return jwt.verify(token, secretKey); // Returns decoded user data if valid, or throws an error

    const decoded = jwt.verify(token, secretKey);

    // Log successful verification
    console.log(`JWT verified for ${decoded.email}`);
    console.log(`JWT VERIFIED for ${JSON.stringify(decoded, null, 2)}`);


    return decoded;
  } catch (err) {
    return null; // Return null if the token is invalid
  } 
};

module.exports = { generateToken, verifyToken };
