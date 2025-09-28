import React, { useState } from 'react';
import axios from 'axios';
import FileInput from './FileInput';
import StatusMessage from './StatusMessage';
import { Spinner, DownloadIcon } from './Icons';

const UpdateForm = () => {
  const [existingJson, setExistingJson] = useState(null);
  const [luaFile, setLuaFile] = useState(null);
  const [testcasesFile, setTestcasesFile] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!existingJson || !luaFile || !testcasesFile) {
      setStatus({ type: 'error', message: 'Please upload all three required files.' });
      return;
    }
    const formData = new FormData();
    formData.append('existingJson', existingJson);
    formData.append('luaFile', luaFile);
    formData.append('testcasesFile', testcasesFile);

    setIsLoading(true);
    setStatus({ type: 'loading', message: 'Updating files on the server... Please wait.' });

    try {
      const response = await axios.post('https://coding-factory-backend.onrender.com/api/process/update', formData, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'coding_questions_updated.json');
      document.body.appendChild(link);
      link.click();

      setStatus({ type: 'success', message: 'File updated and download started successfully!' });
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('File update error:', error);
      setStatus({ type: 'error', message: 'An error occurred on the server. Please check the console.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold text-gray-100 mb-6">Update Existing Question JSON</h2>
      <FileInput label="Existing coding_questions.json" required acceptedTypes=".json" file={existingJson} onChange={(e) => setExistingJson(e.target.files[0])} onClear={() => setExistingJson(null)} />
      <FileInput label="New additional_cq_prep.lua" required acceptedTypes=".lua" file={luaFile} onChange={(e) => setLuaFile(e.target.files[0])} onClear={() => setLuaFile(null)} />
      <FileInput label="New testcases.json" required acceptedTypes=".json" file={testcasesFile} onChange={(e) => setTestcasesFile(e.target.files[0])} onClear={() => setTestcasesFile(null)} />
      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-4 flex items-center justify-center gap-3 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300"
      >
        {isLoading ? <Spinner /> : <DownloadIcon />}
        {isLoading ? 'Updating...' : 'Update & Download'}
      </button>

      <StatusMessage type={status.type} message={status.message} />
    </form>
  );
};

export default UpdateForm;