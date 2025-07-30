const PDFDocument = require('pdfkit');
const { Buffer } = require('buffer');

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const htmlContent = body.html || '<h1>No HTML provided</h1>';

    const doc = new PDFDocument();
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {});

    // Manually parse HTML or just add plain text (pdfkit doesn't parse HTML)
    doc.text(htmlContent); // For demo, it will render HTML tags as plain text
    doc.end();

    const pdfBuffer = await new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });

    const pdfBase64 = pdfBuffer.toString('base64');
    const pdfDataUrl = `data:application/pdf;base64,${pdfBase64}`;

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'PDF generated successfully', pdfDataUrl }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};


// const html_to_pdf = require('html-pdf-node');

// exports.handler = async (event) => {
//     try {
//         const body = JSON.parse(event.body || '{}');
//         const html = body.html || '<h1>No HTML provided</h1>';

//         const file = { content: html };

//         const pdfBuffer = await html_to_pdf.generatePdf(file, {
//             format: 'A4',
//         });

//         const pdfBase64 = pdfBuffer.toString('base64');
//         const pdfDataUrl = `data:application/pdf;base64,${pdfBase64}`;

//         return {
//             statusCode: 200,
//             body: JSON.stringify({ message: 'PDF generated successfully', pdfDataUrl }),
//         };
//     } catch (err) {
//         return {
//             statusCode: 500,
//             body: JSON.stringify({ error: err.message }),
//         };
//     }
// };
