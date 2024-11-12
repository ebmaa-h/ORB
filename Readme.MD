### Hosting site on vps vs local

db.js
  host: '127.0.0.1',  // Use IPv4 explicitly, for vps -> works for local too, if not use 'localhost' 

  request changes
  'http://167.99.196.172:4000/verify' // Server
  'http://localhost:4000/verify' // Local

This is the same for any requests ^^

vps:

git clone
frontend npm run build
restart server