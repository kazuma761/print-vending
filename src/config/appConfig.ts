
/**
 * Application configuration
 */

// This would typically come from environment variables in a production environment
export const appConfig = {
  // API Gateway URL
  apiBaseUrl: 'https://api.printsmartapp.com/v1',
  
  // WebSocket server URL for real-time updates
  wsUrl: 'wss://api.printsmartapp.com/ws',
  
  // Limits
  maxFilesPerUser: 10,  // Updated from 5 to 10
  maxPagesPerDocument: 50,
  maxFileSizeMB: 10,
  
  // Cost per page in ₹
  costPerPage: 4,
  
  // Feature flags
  features: {
    realTimeUpdates: true,
    paymentIntegration: true,
    qrCodeScanning: true
  }
};
