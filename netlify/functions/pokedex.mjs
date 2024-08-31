
import { renderToString } from '@vue/server-renderer';
import { createApp } from 'vue';
import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'
import { Readable } from 'stream';

chromium.setHeadlessMode = true
chromium.setGraphicsMode = false

export const handler = async () => {
    // Define the Vue component
  const vueInstance = createApp({
    template: `<div><h1>Hello, {{ message }}</h1></div>`,
    data() {
      return {
        message: 'World',
      };
    },
  });

  // Render Vue component to HTML
  let html;
  try {
    html = await renderToString(vueInstance);
  } catch (err) {
    return {
      statusCode: 500,
      body: `Error rendering Vue component: ${err.message}`,
    };
  }

  // Generate PDF with Puppeteer
  let pdfBuffer;
  try {
    // const browser = await puppeteer.launch();
    const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: process.env.CHROME_EXECUTABLE_PATH || (await chromium.executablePath('/var/task/node_modules/@sparticuz/chromium/bin')),
      })
    const page = await browser.newPage();
    await page.setContent(html);
    pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();
  } catch (err) {
    return {
      statusCode: 500,
      body: `Error generating PDF: ${err.message}`,
    };
  }

     // Convert PDF buffer to readable stream
    const pdfStream = Readable.from(pdfBuffer);

    // Send PDF as response
    return {
        statusCode: 200,
        body: pdfStream,
        headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="output.pdf"',
        },
    };
  }