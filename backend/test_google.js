const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(undefined);
try {
  client.verifyIdToken({ idToken: 'fake', audience: undefined }).catch(e => console.log('caught promise:', e.message));
} catch (e) {
  console.log('caught sync:', e.message);
}
