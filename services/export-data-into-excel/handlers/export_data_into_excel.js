const AWS = require('aws-sdk');
const { Parser } = require('json2csv');
const XLSX = require('xlsx');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    const query = event.queryStringParameters || {};
    const tableName = 'users';

    const scanParams = { TableName: tableName };
    let items = [];
    let data;

    data = await dynamoDb.scan(scanParams).promise();
    items = [...items, ...data.Items];
    if (!items.length) {
      return { statusCode: 404, body: JSON.stringify({ error: 'No data found.' }) };
    }

    let fileBuffer;
    let contentType;
    let filename;

    if (query?.format === 'xlsx') {
      // Excel format
      const worksheet = XLSX.utils.json_to_sheet(items);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Export');
      fileBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename = 'export.xlsx';
    } else {
      // CSV format
      const json2csv = new Parser();
      const csv = json2csv.parse(items);
      console.log('csv', JSON.stringify(csv));
      fileBuffer = Buffer.from(csv, 'utf-8');
      contentType = 'text/csv';
      filename = 'export.csv';
    }

    const buffer = fileBuffer.toString('base64');
    const dataUrl = `data:${contentType};charset=utf-8;base64,${buffer}`;

    return {
      statusCode: 200,
      body: JSON.stringify({ dataUrl, filename })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
