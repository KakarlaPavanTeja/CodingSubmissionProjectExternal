import React from 'react';

const StatusMessage = ({ type, message }) => {
  if (!message) return null;

  const styles = {
    loading: 'bg-blue-900/50 border-blue-500 text-blue-300',
    error: 'bg-red-900/50 border-red-500 text-red-300',
    success: 'bg-green-900/50 border-green-500 text-green-300',
  };

  const icons = {
    loading: '⏳',
    error: '❌',
    success: '✅',
  };

  return (
    <div className={`border-l-4 p-4 mt-6 rounded-r-md ${styles[type]}`} role="alert">
      <div className="flex items-center">
        <span className="text-xl mr-3">{icons[type]}</span>
        <div>
          <p className="font-bold">{type.charAt(0).toUpperCase() + type.slice(1)}</p>
          <p className="text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default StatusMessage;