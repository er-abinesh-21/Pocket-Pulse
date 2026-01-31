import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

/**
 * Notification Component
 * Toast notification for user feedback
 */
export const Notification = ({ notification }) => {
    if (!notification) return null;

    return (
        <div className="fixed top-20 right-4 z-50 animate-slide-in">
            <div className={`flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-500' :
                    notification.type === 'error' ? 'bg-red-500' :
                        notification.type === 'warning' ? 'bg-yellow-500' :
                            'bg-blue-500'
                } text-white`}>
                {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
                {notification.type === 'error' && <XCircle className="w-5 h-5" />}
                {notification.type === 'warning' && <AlertCircle className="w-5 h-5" />}
                <span>{notification.message}</span>
            </div>
        </div>
    );
};

export default Notification;
