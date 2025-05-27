import { useState, useEffect } from 'react';
import { NavBar } from './NavBar';

type File = { key: string; lastModified: string; size: number };

export const FileManagement = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [updateKey, setUpdateKey] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/files');
      const data = await res.json();
      if (res.ok) {
        setFiles(data);
      } else {
        setError(data.error || 'Failed to fetch files');
      }
    } catch {
      setError('An error occurred');
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        fetchFiles();
      } else {
        setError(data.error || 'Failed to upload file');
      }
    } catch {
      setError('An error occurred');
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file || !updateKey) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('key', updateKey);
    try {
      const res = await fetch('/api/files', {
        method: 'PUT',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        fetchFiles();
      } else {
        setError(data.error || 'Failed to update file');
      }
    } catch {
      setError('An error occurred');
    }
  };

  const handleDelete = async (key: string) => {
    try {
      const res = await fetch(`/api/files?key=${key}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        fetchFiles();
      } else {
        setError(data.error || 'Failed to delete file');
      }
    } catch {
      setError('An error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <NavBar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">File Management</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Upload File</h3>
              <form onSubmit={handleUpload} className="space-y-4">
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  required
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-blue-700"
                />
                <button
                  type="submit"
                  className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Upload
                </button>
              </form>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Update File</h3>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label htmlFor="updateKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300">File Key</label>
                  <input
                    id="updateKey"
                    type="text"
                    placeholder="File Key"
                    value={updateKey}
                    onChange={(e) => setUpdateKey(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  required
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-blue-700"
                />
                <button
                  type="submit"
                  className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Update
                </button>
              </form>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 px-6 py-4">Your Files</h3>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Filename</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Size (KB)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Modified</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {files.map((f) => (
                  <tr key={f.key}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{f.key.split('/').pop()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{(f.size / 1024).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{new Date(f.lastModified).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDelete(f.key)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
