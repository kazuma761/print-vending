
/**
 * Handles the integration with the printer connected to the laptop
 */

type PrintJob = {
  fileUrl: string;
  fileName: string;
  pageCount: number;
};

// Real implementation of sending print job to server
export const sendPrintJob = async (files: PrintJob[]): Promise<boolean> => {
  console.log("Sending print jobs to server:", files);
  
  try {
    const formData = new FormData();
    
    // For each PrintJob, fetch the actual file data and append to formData
    for (const file of files) {
      try {
        const response = await fetch(file.fileUrl);
        const blob = await response.blob();
        formData.append('files', blob, file.fileName);
        formData.append('pageCount', file.pageCount.toString());
      } catch (fetchError) {
        console.error(`Error processing file ${file.fileName}:`, fetchError);
      }
    }
    
    // Send to the print server endpoint
    const result = await fetch(`${getPrintServerUrl()}/api/print`, {
      method: 'POST',
      body: formData
    });
    
    if (!result.ok) {
      throw new Error(`Server responded with status ${result.status}`);
    }
    
    const data = await result.json();
    return data.success;
  } catch (error) {
    console.error("Error sending print job:", error);
    return false;
  }
};

// Check if user is on mobile device
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Get the print server URL from configuration
export const getPrintServerUrl = (): string => {
  // In a real implementation, this might be stored in environment variables
  // or fetched from a configuration service
  return localStorage.getItem('printServerUrl') || 'https://print-server-demo.onrender.com';
};

// Set the print server URL in local storage
export const setPrintServerUrl = (url: string): void => {
  localStorage.setItem('printServerUrl', url);
};

// Function to trigger remote printing
export const triggerRemotePrinting = async (files: PrintJob[]): Promise<boolean> => {
  if (files.length === 0) return false;
  
  if (isMobileDevice()) {
    // For mobile devices, send print job to server
    return await sendPrintJob(files);
  } else {
    // For desktop, try to print directly and fallback to server if needed
    try {
      // First attempt direct printing in the browser
      for (const file of files) {
        const printWindow = window.open(file.fileUrl, '_blank');
        if (printWindow) {
          await new Promise<void>((resolve) => {
            printWindow.onload = () => {
              printWindow.print();
              setTimeout(() => {
                printWindow.close();
                resolve();
              }, 500);
            };
          });
        }
      }
      return true;
    } catch (error) {
      console.error("Direct printing failed, falling back to server:", error);
      return await sendPrintJob(files);
    }
  }
};

// Check server connection status
export const checkServerConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${getPrintServerUrl()}/api/status`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    return response.ok;
  } catch (error) {
    console.error("Server connection check failed:", error);
    return false;
  }
};
