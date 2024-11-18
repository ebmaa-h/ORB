require('dotenv').config();
const jwt = require('jsonwebtoken');

// Check if JWT_SECRET is provided
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

// Create a JWT token
const generateToken = (user) => {
  const payload = { id: user.id, first_name: user.first_name, email: user.email };
  const secretKey = process.env.JWT_SECRET;
  const options = { expiresIn: '1h' };

  return jwt.sign(payload, secretKey, options);
};

// Verify the JWT token
const verifyToken = (token) => {
  const secretKey = process.env.JWT_SECRET;

  try {
    const decoded = jwt.verify(token, secretKey);
    console.log(`JWT VERIFIED for user: ${JSON.stringify(decoded, null, 2)}`);
    return decoded;
  } catch (err) {
    console.error(`JWT verification failed: ${err.message}`); 
    return null;
  }
};

module.exports = { generateToken, verifyToken };
