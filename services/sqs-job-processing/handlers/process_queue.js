const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3 = new S3Client({ region: 'ap-south-1' }); // adjust region if needed

module.exports.handler = async (event) => {
  const records = event.Records;

  for (const record of records) {
    const messageBody = JSON.parse(record.body);
    console.log('Processing job:', messageBody);

    try {
      await processJob(messageBody);
      await uploadJobToS3(messageBody);
      console.log('Job processed and uploaded successfully:', messageBody);
    } catch (error) {
      console.error('Error processing job:', error);
      throw new Error('Job failed');
    }
  }

  return { statusCode: 200, body: 'Jobs processed successfully' };
};

// Simulated processing logic
async function processJob(job) {
  console.log(`Processing job with ID: ${job.jobId}, Name: ${job.name}`);
  return new Promise(resolve => setTimeout(resolve, 1000));
}

// Converts a job object to CSV and uploads to S3
async function uploadJobToS3(job) {
  const bucketName = process.env.UPLOAD_BUCKET; // set this in your Lambda env vars
  const key = `jobs/${job.jobId}.csv`;

  const csvContent = `jobId,name\n${job.jobId},${job.name}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: csvContent,
    ContentType: 'text/csv',
    Metadata: {
      source: 'sqs-processor',
    },
  });

  await s3.send(command);
  console.log(`Uploaded CSV to s3://${bucketName}/${key}`);
}
