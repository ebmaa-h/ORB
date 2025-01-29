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

  return new Promise((resolve, reject) => {
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        console.error(`JWT verification failure: ${err.message}`);
        reject(err);  // Reject the promise if verification fails
      } else {
        console.log("JWT verified...");
        resolve(decoded);  // Resolve with the decoded token if successful
      }
    });
  });
};


module.exports = { generateToken, verifyToken };
