import React from 'react';

/**
 * Reusable Card component
 */
export const Card = ({ children, className = '', title, subtitle, actions }) => {
    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm ${className}`}>
            {(title || actions) && (
                <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>}
                        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
                    </div>
                    {actions && <div className="flex items-center space-x-2">{actions}</div>}
                </div>
            )}
            <div className="p-4 sm:p-6">
                {children}
            </div>
        </div>
    );
};

export default Card;
