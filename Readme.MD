### Hosting site on vps vs local

db.js
  host: '127.0.0.1',  // Use IPv4 explicitly, for vps
  host: 'localhost', // For local

UserContext.js

  const response = await axios.get('http://167.99.196.172:4000/verify', { // Server
  const response = await axios.get('http://localhost:4000/verify', { // Local

This is the same for any requests ^^