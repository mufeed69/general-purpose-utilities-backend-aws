const AWS = require('aws-sdk');
const sqs = new AWS.SQS();

module.exports.handler = async (event) => {
  // Parse the incoming event body from API Gateway (user input)
  const requestBody = JSON.parse(event.body);
  
  const params = {
    QueueUrl: process.env.QUEUE_URL, // Queue URL passed as an environment variable
    MessageBody: JSON.stringify(requestBody), // Use the dynamic body from the API call
  };

  try {
    const result = await sqs.sendMessage(params).promise();
    console.log('Message sent:', result.MessageId);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Message successfully sent to the queue',
        messageId: result.MessageId,
      }),
    };
  } catch (err) {
    console.error('Error sending message:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to send message to SQS',
        error: err.message,
      }),
    };
  }
};
