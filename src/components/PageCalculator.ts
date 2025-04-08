
/**
 * Calculates the number of pages in a file
 */
export const calculatePages = async (file: File): Promise<number> => {
  return new Promise((resolve) => {
    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const pdfData = new Uint8Array(e.target?.result as ArrayBuffer);
          // More accurate PDF page counting by looking for "/Type /Page" pattern in PDF
          const text = String.fromCharCode.apply(null, Array.from(pdfData.slice(0, Math.min(pdfData.length, 8000))));
          const pageMatches = text.match(/\/Type\s*\/Page[^s]/g);
          const pageCount = pageMatches ? pageMatches.length : 0;
          console.log(`PDF page count estimated: ${pageCount} for file ${file.name}`);
          resolve(Math.max(1, pageCount)); // Ensure at least 1 page
        } catch (error) {
          console.error("Error calculating PDF pages:", error);
          resolve(1); // Default to 1 if calculation fails
        }
      };
      reader.onerror = function() {
        console.error("FileReader error during page calculation");
        resolve(1); // Default to 1 on error
      };
      reader.readAsArrayBuffer(file);
    } else if (file.type.startsWith('image/')) {
      resolve(1); // Images count as 1 page
    } else {
      // For other document types, estimate based on file size
      const averagePageSize = 250 * 1024; // 250KB per page
      resolve(Math.max(1, Math.ceil(file.size / averagePageSize)));
    }
  });
};

/**
 * Format file size into human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Calculate cost based on page count
 */
export const calculateCost = (pageCount: number): number => {
  return pageCount * 4; // ₹4 per page
};
