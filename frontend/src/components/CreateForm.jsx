import React, { useState } from 'react';
import axios from 'axios';
import FileInput from './FileInput';
import StatusMessage from './StatusMessage';
import { Spinner, DownloadIcon } from './Icons'; // We will create this file next

const CreateForm = () => {
  const [luaFile, setLuaFile] = useState(null);
  const [testcasesFile, setTestcasesFile] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!luaFile || !testcasesFile) {
      setStatus({ type: 'error', message: 'Please upload both required files.' });
      return;
    }

    const formData = new FormData();
    formData.append('luaFile', luaFile);
    formData.append('testcasesFile', testcasesFile);

    setIsLoading(true);
    setStatus({ type: 'loading', message: 'Processing files on the server... Please wait.' });

    try {
      const response = await axios.post('https://coding-factory-backend.onrender.com/api/process/create', formData, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'coding_questions.json');
      document.body.appendChild(link);
      link.click();
      
      setStatus({ type: 'success', message: 'File generated and download started successfully!' });
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('File processing error:', error);
      setStatus({ type: 'error', message: 'An error occurred on the server. Please check the console.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold text-gray-100 mb-6">Create New Question JSON</h2>
      <FileInput label="additional_cq_prep.lua" required acceptedTypes=".lua" file={luaFile} onChange={(e) => setLuaFile(e.target.files[0])} onClear={() => setLuaFile(null)} />
      <FileInput label="testcases.json" required acceptedTypes=".json" file={testcasesFile} onChange={(e) => setTestcasesFile(e.target.files[0])} onClear={() => setTestcasesFile(null)} />
      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-4 flex items-center justify-center gap-3 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300"
      >
        {isLoading ? <Spinner /> : <DownloadIcon />}
        {isLoading ? 'Processing...' : 'Generate & Download'}
      </button>

      <StatusMessage type={status.type} message={status.message} />
    </form>
  );
};

export default CreateForm;