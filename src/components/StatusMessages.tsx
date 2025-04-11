
import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, Bell } from 'lucide-react';
import { getWebSocketService } from '../services/WebSocketService';

interface PrintNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  timestamp: Date;
}

interface StatusMessagesProps {
  error: string;
  paymentSuccess: boolean;
  isCountingPages: boolean;
}

const StatusMessages: React.FC<StatusMessagesProps> = ({ 
  error, 
  paymentSuccess, 
  isCountingPages 
}) => {
  const [notifications, setNotifications] = useState<PrintNotification[]>([]);

  useEffect(() => {
    // Set up WebSocket listener for notifications if WebSocket service is initialized
    try {
      const wsService = getWebSocketService();
      
      const handleNotification = (data: any) => {
        const newNotification: PrintNotification = {
          id: Date.now().toString(),
          message: data.message,
          type: data.type || 'info',
          timestamp: new Date()
        };
        
        setNotifications(prev => [newNotification, ...prev].slice(0, 5)); // Keep last 5 notifications
      };
      
      wsService.on('notification', handleNotification);
      
      return () => {
        wsService.off('notification', handleNotification);
      };
    } catch (error) {
      // WebSocket service not initialized yet, which is fine
      console.log('WebSocket service not initialized yet');
    }
  }, []);

  return (
    <>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {paymentSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 flex items-center gap-2">
          <Check className="w-5 h-5" />
          Payment successful! Your documents are being printed.
        </div>
      )}

      {isCountingPages && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 flex items-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
          Analyzing document...
        </div>
      )}

      {/* Real-time notifications from WebSocket */}
      {notifications.map(notification => (
        <div 
          key={notification.id}
          className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
            notification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-600' :
            notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-600' :
            notification.type === 'warning' ? 'bg-yellow-50 border border-yellow-200 text-yellow-600' :
            'bg-blue-50 border border-blue-200 text-blue-600'
          }`}
        >
          <Bell className="w-5 h-5" />
          <div>
            <p>{notification.message}</p>
            <p className="text-xs opacity-70">
              {notification.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
      ))}
    </>
  );
};

export default StatusMessages;
