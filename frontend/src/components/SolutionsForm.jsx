import React, { useState } from 'react';
import axios from 'axios';
import StatusMessage from './StatusMessage';
import { Spinner } from './Icons';

// Reusable code editor component
const CodeEditor = ({ language, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-2">{language}</label>
    <textarea
      value={value}
      onChange={onChange}
      placeholder={`Paste your ${language} solution here...`}
      className="w-full h-48 p-3 font-mono text-sm bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
    />
  </div>
);

const SolutionsForm = () => {
  const [cppCode, setCppCode] = useState('');
  const [pyCode, setPyCode] = useState('');
  const [javaCode, setJavaCode] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cppCode && !pyCode && !javaCode) {
      setStatus({ type: 'error', message: 'Please provide code for at least one language.' });
      return;
    }

    const createBlob = (content) => new Blob([content], { type: 'text/plain' });

    const formData = new FormData();
    formData.append('cppFile', createBlob(cppCode), 'solution.cpp');
    formData.append('pyFile', createBlob(pyCode), 'solution.py');
    formData.append('javaFile', createBlob(javaCode), 'solution.java');

    setIsLoading(true);
    setMarkdown('');
    setStatus({ type: 'loading', message: 'Generating Markdown on the server...' });

    try {
      const response = await axios.post('http://localhost:3001/api/process/merge', formData);
      setMarkdown(response.data);
      setStatus({ type: 'success', message: 'Markdown generated successfully!' });
    } catch (error) {
      console.error('Markdown generation error:', error);
      setStatus({ type: 'error', message: 'An error occurred on the server. Please check the console.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown).then(() => {
      setStatus({ type: 'success', message: 'Copied to clipboard!' });
      setTimeout(() => setStatus({ type: '', message: '' }), 2000);
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-100 mb-6">Generate Solution Markdown</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <CodeEditor language="C++" value={cppCode} onChange={(e) => setCppCode(e.target.value)} />
        <CodeEditor language="Python" value={pyCode} onChange={(e) => setPyCode(e.target.value)} />
        <CodeEditor language="Java" value={javaCode} onChange={(e) => setJavaCode(e.target.value)} />
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? <Spinner /> : null}
          {isLoading ? 'Generating...' : 'Generate Markdown'}
        </button>
      </form>

      <StatusMessage type={status.type} message={status.message} />

      {markdown && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-100">Generated Output</h3>
            <button
              onClick={handleCopy}
              className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-md"
            >
              Copy
            </button>
          </div>
          <pre className="w-full p-4 bg-gray-900 border border-gray-600 rounded-md text-gray-300 whitespace-pre-wrap overflow-x-auto">
            <code>{markdown}</code>
          </pre>
        </div>
      )}
    </div>
  );
};

export default SolutionsForm;