import React, { useState } from 'react';

const FileInput = ({ label, required, acceptedTypes, onChange, file, onClear }) => {
  const fileId = `file-input-${label.replace(/\s+/g, '-')}`;
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Manually create a change event to pass to the parent handler
      const mockEvent = { target: { files: e.dataTransfer.files } };
      onChange(mockEvent);
      e.dataTransfer.clearData();
    }
  };

  const borderStyle = isDragging
    ? 'border-blue-500'
    : 'border-gray-600 hover:border-blue-500';

  return (
    <div className="mb-4">
      <label htmlFor={fileId} className="block text-sm font-medium text-gray-300 mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      
      {file ? (
        <div className="flex items-center justify-between p-3 bg-gray-700 border border-gray-600 rounded-md">
          <span className="text-sm text-green-300 truncate">{file.name}</span>
          <button type="button" onClick={onClear} className="ml-4 text-gray-400 hover:text-white focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ) : (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`flex justify-center px-6 pt-5 pb-6 border-2 ${borderStyle} border-dashed rounded-md bg-gray-900/50 transition-colors`}
        >
          <div className="space-y-1 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
            <div className="flex text-sm text-gray-400 justify-center">
              <label htmlFor={fileId} className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-blue-400 hover:text-blue-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 focus-within:ring-blue-500 px-2">
                <span>Upload a file</span>
                <input id={fileId} name={fileId} type="file" className="sr-only" accept={acceptedTypes} required={required} onChange={onChange} />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">Any .lua or .json file</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileInput;