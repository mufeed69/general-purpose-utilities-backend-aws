const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const csvParser = require('csv-parser'); // CSV parser for Node.js

module.exports.handler = async (event) => {
  // Retrieve the S3 bucket and file name from the event
  const bucketName = event.Records[0].s3.bucket.name;
  const fileName = event.Records[0].s3.object.key;
  
  console.log('Processing file from S3:', fileName);
  
  try {
    // Download the CSV file from S3
    const fileData = await s3.getObject({ Bucket: bucketName, Key: fileName }).promise();
    const csvContent = fileData.Body.toString('utf-8');
    
    // Parse the CSV data (you can use any CSV parser here)
    const records = [];
    const parsedRecords = await parseCSV(csvContent);
    
    // Store parsed records into DynamoDB
    for (const record of parsedRecords) {
      const params = {
        TableName: process.env.DATABASE_TABLE,
        Item: {
          jobId: record.jobId,  // Assuming jobId is a column in your CSV
          name: record.name,    // Example fields, adjust to your CSV columns
          status: record.status,
        },
      };
      
      await dynamoDB.put(params).promise();
      console.log('Record inserted into DynamoDB:', record.jobId);
    }
    
    return { statusCode: 200, body: 'File processed successfully!' };
    
  } catch (error) {
    console.error('Error processing the file:', error);
    return { statusCode: 500, body: 'Error processing file' };
  }
};

// Helper function to parse CSV content
function parseCSV(csvContent) {
  return new Promise((resolve, reject) => {
    const records = [];
    const stream = require('stream');
    const readableStream = new stream.Readable();
    readableStream.push(csvContent);
    readableStream.push(null);
    
    readableStream
      .pipe(csvParser())
      .on('data', (row) => {
        records.push(row); // Push each CSV row as an object into the array
      })
      .on('end', () => {
        resolve(records);  // Return all parsed records
      })
      .on('error', reject); // Handle parsing error
  });
}
