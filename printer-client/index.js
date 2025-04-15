
const { createClient } = require('@supabase/supabase-js');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { print } = require('pdf-to-printer');

// Supabase configuration
const SUPABASE_URL = 'https://ojoexitafvekloepfnlb.supabase.co';
const SUPABASE_SERVICE_KEY = 'your_service_key_here'; // Replace with your service key
const PRINTER_ID = 'laptop_printer_01'; // Unique identifier for this printer

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function downloadFile(fileUrl, fileName) {
  const downloadPath = path.join(__dirname, 'downloads', fileName);
  const response = await axios({
    url: fileUrl,
    method: 'GET',
    responseType: 'stream'
  });

  const writer = fs.createWriteStream(downloadPath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(downloadPath));
    writer.on('error', reject);
  });
}

async function processPrintJob(job) {
  console.log(`Processing job: ${job.id}`);

  try {
    // Fetch the file details
    const { data: fileData, error: fileError } = await supabase
      .from('files')
      .select('file_url, file_name')
      .eq('id', job.file_id)
      .single();

    if (fileError || !fileData) {
      console.error('Error fetching file details:', fileError);
      return false;
    }

    // Update job status to 'printing'
    await supabase
      .from('printer_queue')
      .update({ status: 'printing', printer_id: PRINTER_ID })
      .eq('id', job.id);

    // Download the file
    const downloadedFilePath = await downloadFile(fileData.file_url, fileData.file_name);

    // Print the file
    await print(downloadedFilePath);

    // Update job status to 'complete'
    await supabase
      .from('printer_queue')
      .update({ status: 'complete', printer_id: PRINTER_ID })
      .eq('id', job.id);

    console.log(`Job ${job.id} completed successfully`);
    return true;
  } catch (error) {
    console.error(`Error processing job ${job.id}:`, error);

    // Update job status to 'failed'
    await supabase
      .from('printer_queue')
      .update({ status: 'failed', printer_id: PRINTER_ID })
      .eq('id', job.id);

    return false;
  }
}

async function pollForPrintJobs() {
  console.log('Checking for print jobs...');

  try {
    const { data: jobs, error } = await supabase
      .from('printer_queue')
      .select('*')
      .eq('status', 'queued')
      .limit(5); // Process up to 5 jobs at a time

    if (error) {
      console.error('Error fetching print jobs:', error);
      return;
    }

    for (const job of jobs) {
      await processPrintJob(job);
    }
  } catch (error) {
    console.error('Polling error:', error);
  }
}

// Poll every 30 seconds
function startPrinterClient() {
  console.log('Printer client started. Polling for jobs...');
  setInterval(pollForPrintJobs, 30000);
}

// Create downloads directory if it doesn't exist
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)){
  fs.mkdirSync(downloadsDir);
}

startPrinterClient();
