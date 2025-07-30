module.exports.handler = async (event) => {
  // Iterate through the records in the SQS event
  const records = event.Records;

  for (const record of records) {
    // Parse the SQS message body (which is JSON data)
    const messageBody = JSON.parse(record.body);

    console.log('Processing job:', messageBody);
    
    try {
      // Simulate job processing (could be any processing logic)
      await processJob(messageBody);
      console.log('Job processed successfully:', messageBody);
    } catch (error) {
      console.error('Error processing job:', error);
      throw new Error('Job failed');
    }
  }

  return { statusCode: 200, body: 'Jobs processed successfully' };
};

// Simulate job processing (e.g., API call, database insertion, etc.)
async function processJob(job) {
  console.log(`Processing job with ID: ${job.jobId}, Name: ${job.name}`);
  return new Promise(resolve => setTimeout(resolve, 1000));  // Simulate delay
}
