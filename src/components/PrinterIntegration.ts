
/**
 * Handles the integration with the printer connected to the laptop
 */

type PrintJob = {
  fileUrl: string;
  fileName: string;
  pageCount: number;
};

// Mock implementation of sending print job to server
export const sendPrintJob = async (files: PrintJob[]): Promise<boolean> => {
  console.log("Sending print jobs to server:", files);
  
  try {
    // In a real implementation, this would make an API call to a server
    // that's connected to the physical printer
    // For now, we'll simulate this with a timeout
    
    // Log each file to be printed for debugging
    files.forEach((file, index) => {
      console.log(`Sending file ${index + 1}/${files.length}: ${file.fileName} (${file.pageCount} pages)`);
    });
    
    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return success
    return true;
  } catch (error) {
    console.error("Error sending print job:", error);
    return false;
  }
};

// Check if user is on mobile device
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
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
