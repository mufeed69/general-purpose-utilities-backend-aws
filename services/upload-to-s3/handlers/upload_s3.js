// functions/uploadToS3.js

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({ region: 'ap-south-1' });

exports.handler = async (event) => {
  try {
    const { fileName, fileContentBase64, mimeType } = JSON.parse(event.body);

    if (!fileName || !fileContentBase64 || !mimeType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing fileName, mimeType or fileContentBase64' }),
      };
    }

    const buffer = Buffer.from(fileContentBase64, 'base64');
    const fileSizeMB = buffer.length / (1024 * 1024);

    if (fileSizeMB > 5) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'File size exceeds 5MB limit' }),
      };
    }

    const uploadKey = `uploads/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.UPLOAD_BUCKET,
      Key: uploadKey,
      Body: buffer,
      ContentType: mimeType,
      Metadata: {
        uploadedBy: 'lambda-function',
        originalName: fileName,
      },
    });

    await s3.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Upload successful', key: uploadKey }),
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Upload failed', error: error.message }),
    };
  }
};
