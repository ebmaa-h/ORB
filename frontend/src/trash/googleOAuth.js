// const { OAuth2Client } = require('google-auth-library');
// const client = new OAuth2Client(process.env.CLIENT_ID, process.env.CLIENT_SECRET, 'http://localhost:4000/auth/google/callback');

// async function getGoogleUser(code) {
//   const { tokens } = await client.getToken(code);
//   client.setCredentials(tokens);

//   // Get user info
//   const ticket = await client.verifyIdToken({
//     idToken: tokens.id_token,
//     audience: process.env.CLIENT_ID,
//   });

//   return ticket.getPayload(); // contains user info: email, name, etc.
// }

// module.exports = { client, getGoogleUser };
