const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const REGION = 'ap-south-1'; // e.g., "ap-south-1"
const USER_POOL_ID = process.env.USER_POOL_ID; // e.g., "ap-south-1_XXXXXXX"
const CLIENT_ID = process.env.USER_POOL_CLIENT_ID; // e.g., Cognito app client ID

const jwks = jwksClient({
  jwksUri: `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}/.well-known/jwks.json`,
});

function getKey(header, callback) {
  jwks.getSigningKey(header.kid, function (err, key) {
    if (err) {
      callback(err);
    } else {
      const signingKey = key.getPublicKey();
      callback(null, signingKey);
    }
  });
}

exports.handler = async (event) => {
  const authHeader = event.headers?.Authorization || event.headers?.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized: Missing or invalid Authorization header' }),
    };
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(
        token,
        getKey,
        {
          audience: CLIENT_ID,
          issuer: `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`,
        },
        (err, decoded) => {
          if (err) reject(err);
          else resolve(decoded);
        }
      );
    });

    // ✅ Token is valid — return protected data or logic
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Access granted',
        user: {
          username: decoded['cognito:username'],
          email: decoded.email,
          groups: decoded['cognito:groups'] || [],
        },
      }),
    };
  } catch (err) {
    console.error('Token verification failed', err);
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Forbidden: Invalid or expired token' }),
    };
  }
};
