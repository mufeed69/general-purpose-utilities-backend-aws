const {
  SESClient,
  SendTemplatedEmailCommand,
} = require('@aws-sdk/client-ses');

// Create the SES client 
const ses = new SESClient({ region: 'ap-south-1' });

module.exports.handler = async (event) => {
  try {
    const { email, name } = JSON.parse(event.body);

    const templateData = {
      name,
    };

    const command = new SendTemplatedEmailCommand({
      Source: 'abdulmufeed313+aws@gmail.com',
      Template: 'MyTemplate',  
      Destination: {
        ToAddresses: [email],
      },
      TemplateData: JSON.stringify(templateData),
    });

    const ses_response = await ses.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Email sent successfully',
        response: ses_response,
      }),
    };
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to send email',
        error: error.message,
      }),
    };
  }
};
