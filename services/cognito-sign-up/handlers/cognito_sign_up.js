const AWS = require('aws-sdk');

const cognito = new AWS.CognitoIdentityServiceProvider();

const USER_POOL_ID = process.env.USER_POOL_ID;

module.exports.handler = async (event) => {
  const { email, password, phone_number, name } = JSON.parse(event.body || '{}');

  if (!email || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Email and password are required' }),
    };
  }

  const params = {
    UserPoolId: USER_POOL_ID,
    Username: email,
    TemporaryPassword: password,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'email_verified', Value: 'true' },
      ...(phone_number ? [{ Name: 'phone_number', Value: phone_number }] : []),
      ...(name ? [{ Name: 'name', Value: name }] : []),
    ],
    MessageAction: 'SUPPRESS', // prevents sending invitation email
  };

  try {
    await cognito.adminCreateUser(params).promise();

    // Set permanent password to avoid required password reset
    await cognito.adminSetUserPassword({
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true,
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'User created and confirmed successfully.' }),
    };
  } catch (error) {
    console.error('Admin create user error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Failed to create user' }),
    };
  }
};
