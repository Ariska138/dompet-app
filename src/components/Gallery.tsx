import { useState, useEffect } from 'react';
import { NavBar } from './NavBar';

type File = { key: string; lastModified: string; size: number; url: string };

export const Gallery = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/files');
      const data = await res.json();
      if (res.ok) {
        const filesWithUrls = await Promise.all(
          data.map(async (file: File) => {
            if (file.key.match(/\.(jpg|jpeg|png|gif)$/i)) {
              const urlRes = await fetch(`/api/files?key=${file.key}`);
              const urlData = await urlRes.json();
              return { ...file, url: urlData.url };
            }
            return null;
          })
        );
        setFiles(filesWithUrls.filter((f): f is File => f !== null));
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Image Gallery</h1>
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Upload Image</h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                required
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-blue-700"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Upload
              </button>
            </form>
            {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {files.map((f) => (
              <div key={f.key} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden relative group">
                <img
                  src={f.url}
                  alt={f.key}
                  className="w-full h-48 object-cover cursor-pointer"
                  onClick={() => setSelectedImage(f.url)}
                />
                <div className="p-4">
                  <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{f.key.split('/').pop()}</p>
                  <button
                    onClick={() => handleDelete(f.key)}
                    className="mt-2 w-full px-3 py-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-600 border border-red-600 dark:border-red-400 rounded-md"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          {selectedImage && (
            <div
              className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
              onClick={() => setSelectedImage(null)}
            >
              <div className="relative max-w-4xl w-full p-4">
                <img src={selectedImage} alt="Selected" className="w-full h-auto rounded-lg" />
                <button
                  className="absolute top-2 right-2 text-white bg-red-600 hover:bg-red-700 rounded-full p-2"
                  onClick={() => setSelectedImage(null)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
