const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3 = new S3Client({ region: 'ap-south-1' }); // or use process.env.AWS_REGION

exports.handler = async (event) => {
  try {
    const { bucketName, objectKey, expiresInSeconds = 300 } = JSON.parse(event.body || '{}');

    if (!bucketName || !objectKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing bucketName or objectKey' }),
      };
    }

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    const signedUrl = await getSignedUrl(s3, command, {
      expiresIn: expiresInSeconds,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Signed URL generated successfully',
        url: signedUrl,
        expiresIn: expiresInSeconds,
      }),
    };
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to generate signed URL',
        error: error.message,
      }),
    };
  }
};
