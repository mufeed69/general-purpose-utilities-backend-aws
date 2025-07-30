const AWS = require('aws-sdk');

const cognito = new AWS.CognitoIdentityServiceProvider();

const CLIENT_ID = process.env.USER_POOL_CLIENT_ID;

module.exports.handler = async (event) => {
  const { email, password } = JSON.parse(event.body || '{}');

  if (!email || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Email and password are required' }),
    };
  }

  try {
    // First step: initiate auth
    const authParams = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    };

    const authResult = await cognito.initiateAuth(authParams).promise();
    console.log('authResult', JSON.stringify(authResult));

    if (authResult.ChallengeName === 'SMS_MFA' || authResult.ChallengeName === 'SOFTWARE_TOKEN_MFA') {
      // MFA is required
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'MFA required',
          challengeName: authResult.ChallengeName,
          session: authResult.Session,
        }),
      };
    }

    // Auth successful
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Sign-in successful',
        tokens: authResult.AuthenticationResult,
      }),
    };
  } catch (error) {
    console.error('Sign-in error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Authentication failed' }),
    };
  }
};
