const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { print } = require('pdf-to-printer');

// Supabase configuration
const SUPABASE_URL = 'https://ojoexitafvekloepfnlb.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qb2V4aXRhZnZla2xvZXBmbmxiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDM3MTkxOSwiZXhwIjoyMDU5OTQ3OTE5fQ.76bbzGeSganErgpA33TFzq7150WyyNFPuqFZK6aq3BQ'; 
const PRINTER_ID = 'laptop_printer_01'; // Unique identifier for this printer

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function downloadFile(fileUrl, fileName) {
  const downloadPath = path.join(__dirname, 'downloads', fileName);

  try {
    // If fileUrl is already a full URL, use it directly
    const url = fileUrl.startsWith('http') 
      ? fileUrl 
      : `${SUPABASE_URL}/storage/v1/object/public/print_files/${fileUrl}`;

    console.log('Downloading file from:', url);

    const response = await axios({
      url: url,
      method: 'GET',
      responseType: 'stream',
    });

    const writer = fs.createWriteStream(downloadPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(downloadPath));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
}

async function handleFileUpload(change) {
  const file = change.new;
  console.log(`New file uploaded: ${file.id}`);

  try {
    // Update file status to 'printing'
    await supabase
      .from('files')
      .update({ status: 'printing' })
      .eq('id', file.id);

    // Download the file
    const downloadedFilePath = await downloadFile(file.file_url, file.file_name);

    // Print the file
    await print(downloadedFilePath);

    // Update file status to 'printed'
    await supabase
      .from('files')
      .update({ status: 'printed' })
      .eq('id', file.id);

    console.log(`File ${file.id} printed successfully`);
  } catch (error) {
    console.error(`Error printing file ${file.id}:`, error);

    // Update file status to 'failed'
    await supabase
      .from('files')
      .update({ status: 'failed' })
      .eq('id', file.id);
  }
}

function startRealtimeListener() {
  console.log('Starting Supabase Realtime listener for file uploads...');

  supabase.channel('file-uploads')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'files' }, (payload) => {
      if (payload.new.status === 'uploaded') {
        handleFileUpload(payload);
      }
    })
    .subscribe();
}

// Create downloads directory if it doesn't exist
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)){
  fs.mkdirSync(downloadsDir);
}

// Start the Realtime listener
startRealtimeListener();
