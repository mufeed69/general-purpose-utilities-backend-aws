const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');

const s3 = new S3Client({ region: 'ap-south-1' });

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

exports.handler = async (event) => {
  try {
    const { fileName, fileContentBase64 } = JSON.parse(event.body || '{}');

    if (!fileName || !fileContentBase64) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing fileName or fileContentBase64' }),
      };
    }

    const ext = path.extname(fileName).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
        }),
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
      ContentType: MIME_TYPES[ext] || 'application/octet-stream',
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
