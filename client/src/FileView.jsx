import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  generateAesGcmKey,
  getRandomIv,
  aesGcmEncrypt,
  aesGcmDecrypt,
  arrayBufferToHex,
  hexToArrayBuffer,
  importRsaPublicKeyFromHexSpki,
  importRsaPrivateKeyFromHexPkcs8,
  rsaOaepEncrypt,
  rsaOaepDecrypt,
} from './utils/crypto.js';
import { API_URL } from './config/apiConfig.js';

// Helper to handle file type icons (richer and accessible)
// Returns a small JSX span with an emoji (works well cross-platform) and an accessible label.
const getFileIcon = (filename = '') => {
  const name = String(filename || '');
  const parts = name.split('.');
  const extension = parts.length > 1 ? parts.pop().toLowerCase() : '';

  const map = {
    // Documents & Text
    docx: { icon: '📝', label: 'Word document' },
    doc: { icon: '📝', label: 'Word document' },
    epub: { icon: '📖', label: 'E-Book' },
    mobi: { icon: '📖', label: 'E-Book' },
    rtf: { icon: '📖', label: 'E-Book' },
    pdf: { icon: '📄', label: 'PDF document' },
    txt: { icon: '📄', label: 'Text file' },
    rtf: { icon: '📄', label: 'Rich Text Format' },
    // Images
    jpg: { icon: '🖼️', label: 'Image' },
    jpeg: { icon: '🖼️', label: 'Image' },
    png: { icon: '🖼️', label: 'Image' },
    gif: { icon: '🖼️', label: 'Image' },
    bmp: { icon: '🖼️', label: 'Bitmap image' },
    // Audio
    mp3: { icon: '🎵', label: 'Audio file' },
    wav: { icon: '🔊', label: 'Audio file' },
    m4a: { icon: '🔊', label: 'Audio file' },
    // Video
    mp4: { icon: '🎞️', label: 'Video file' },
    mov: { icon: '🎞️', label: 'Video file' },
    avi: { icon: '🎞️', label: 'Video file' },
    // Spreadsheets & CSV
    xlsx: { icon: '📊', label: 'Spreadsheet' },
    xls: { icon: '�', label: 'Spreadsheet' },
    csv: { icon: '📈', label: 'CSV spreadsheet' },
    // Presentations
    pptx: { icon: '📽️', label: 'Presentation' },
    ppt: { icon: '📽️', label: 'Presentation' },
    // Archives
    zip: { icon: '📦', label: 'Archive' },
    rar: { icon: '📦', label: 'Archive' },
    '7z': { icon: '📦', label: 'Archive' },
    // Executables & System
    exe: { icon: '⚙️', label: 'Executable' },
    msi: { icon: '⚙️', label: 'Windows installer' },
    dll: { icon: '🧩', label: 'Library (DLL)' },
    sys: { icon: '🛠️', label: 'System file' },
    ini: { icon: '⚙️', label: 'Config file' },
  };

  const entry = map[extension];
  const display = entry || { icon: '�', label: 'File' };

  // Return a small span so callers can style it (text-3xl still works)
  return (
    <span role="img" aria-label={display.label} title={display.label}>
      {display.icon}
    </span>
  );
};

// Return a human-friendly label for a file based on extension or provided mime type
const getFileLabel = (filename = '', mime = '') => {
  const name = String(filename || '');
  const parts = name.split('.');
  const extension = parts.length > 1 ? parts.pop().toLowerCase() : '';

  // prefer mime if provided and recognizable
  if (mime) {
    if (mime.startsWith('image/')) return 'Image';
    if (mime === 'application/pdf') return 'PDF document';
    if (mime.startsWith('audio/')) return 'Audio file';
    if (mime.startsWith('video/')) return 'Video file';
    if (mime === 'text/plain') return 'Text file';
  }

  const map = {
    docx: 'Word document',
    doc: 'Word document',
    pdf: 'PDF document',
    txt: 'Text file',
    rtf: 'Rich Text Format',
    jpg: 'Image',
    jpeg: 'Image',
    png: 'Image',
    gif: 'Image',
    bmp: 'Bitmap image',
    mp3: 'Audio file',
    wav: 'Audio file',
    m4a: 'Audio file',
    mp4: 'Video file',
    mov: 'Video file',
    avi: 'Video file',
    xlsx: 'Spreadsheet',
    xls: 'Spreadsheet',
    csv: 'CSV spreadsheet',
    pptx: 'Presentation',
    ppt: 'Presentation',
    zip: 'Archive',
    rar: 'Archive',
    '7z': 'Archive',
    exe: 'Executable',
    msi: 'Windows installer',
    dll: 'Library (DLL)',
    sys: 'System file',
    ini: 'Config file',
  };

  return map[extension] || 'File';
};

function FileView({ user, privateKeyHex, setStatus }) {
  const [files, setFiles] = useState([]);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    if (!user) return;
  toast.info('Fetching files...', { autoClose: 8000, toastId: `fetch-${user?.userId || 'anon'}` });
    try {
      const res = await fetch(`${API_URL}/files/${user.userId}`);
      if (!res.ok) throw new Error('Failed to fetch files');
      const fileList = await res.json();

      const privateKey = await importRsaPrivateKeyFromHexPkcs8(privateKeyHex);
      const decryptedFiles = await Promise.all(fileList.map(async (file) => {
        try {
          console.log('Received encryptedKey:', file.encryptedKey);
          console.log('Received encryptedMetadata:', file.encryptedMetadata);
          const rawAesKey = await rsaOaepDecrypt(privateKey, hexToArrayBuffer(file.encryptedKey));
          const aesKey = await crypto.subtle.importKey('raw', rawAesKey, { name: 'AES-GCM' }, false, ['decrypt']);
          
          const fullEncryptedMetadata = hexToArrayBuffer(file.encryptedMetadata);
          const metadataIv = fullEncryptedMetadata.slice(0, 12);
          const encryptedMetadataBytes = fullEncryptedMetadata.slice(12);

          const metadataBuffer = await aesGcmDecrypt(aesKey, encryptedMetadataBytes, metadataIv);
          const metadata = JSON.parse(new TextDecoder().decode(metadataBuffer));
          return { ...file, ...metadata };
        } catch (e) {
          console.error('Failed to decrypt file metadata:', e);
          return { ...file, filename: '[Decryption Error]' };
        }
      }));

  setFiles(decryptedFiles);
  toast.dismiss(`fetch-${user?.userId || 'anon'}`); // Dismiss the "Fetching files..." toast
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const handleEncryptAndUpload = async (e) => {
    e.preventDefault();
    if (!fileToUpload) return alert('Please select a file');

    // File size validation
    const MAX_FILE_SIZE = 80 * 1024 * 1024; // 80MB - slightly under server's 100MB limit for safety
    if (fileToUpload.size > MAX_FILE_SIZE) {
      toast.error(`File too large. Maximum size allowed is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB. Your file is ${(fileToUpload.size / 1024 / 1024).toFixed(1)}MB.`);
      return;
    }

    // Memory estimation warning
    if (fileToUpload.size > 20 * 1024 * 1024) { // 20MB+
      toast.warning('Large file detected. This may take a while and use significant memory.', { autoClose: 5000 });
    }

  const uploadToastId = `upload-${fileToUpload?.name || Date.now()}`;
  toast.info('Encrypting file and metadata...', { autoClose: 4000, toastId: uploadToastId });
    try {
      const publicKey = await importRsaPublicKeyFromHexSpki(user.publicKey);
      const fileBuffer = await fileToUpload.arrayBuffer();

      const aesKey = await generateAesGcmKey();

      // 1. Encrypt metadata with its own IV
      const metadataIv = getRandomIv();
      const metadata = JSON.stringify({ filename: fileToUpload.name, type: fileToUpload.type });
      const encryptedMetadataBytes = await aesGcmEncrypt(aesKey, new TextEncoder().encode(metadata), metadataIv);
      const fullEncryptedMetadata = new Uint8Array(metadataIv.length + encryptedMetadataBytes.byteLength);
      fullEncryptedMetadata.set(metadataIv, 0);
      fullEncryptedMetadata.set(new Uint8Array(encryptedMetadataBytes), metadataIv.length);

      // 2. Encrypt file content with its own IV
      const fileIv = getRandomIv();
      const encryptedFileContent = await aesGcmEncrypt(aesKey, fileBuffer, fileIv);
      const payload = new Uint8Array(fileIv.length + encryptedFileContent.byteLength);
      payload.set(fileIv, 0);
      payload.set(new Uint8Array(encryptedFileContent), fileIv.length);

      // 3. Encrypt the AES key
      const rawAesKey = await crypto.subtle.exportKey('raw', aesKey);
      const encryptedAesKey = await rsaOaepEncrypt(publicKey, rawAesKey);

      const encryptedKeyHex = arrayBufferToHex(encryptedAesKey);
      const encryptedMetadataHex = arrayBufferToHex(fullEncryptedMetadata);
      console.log('Sending X-Encrypted-Key:', encryptedKeyHex);
      console.log('Sending X-Encrypted-Metadata:', encryptedMetadataHex);

  toast.info('Uploading file...', { autoClose: 5000, toastId: uploadToastId });
      const res = await fetch(`${API_URL}/file/${user.userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Encrypted-Key': encryptedKeyHex,
          'X-Encrypted-Metadata': encryptedMetadataHex,
        },
        body: payload,
      });

      if (!res.ok) {
        let errorMessage = 'Upload failed';
        
        // Handle different error types
        if (res.status === 413) {
          errorMessage = 'File too large for server. Try a smaller file or contact administrator.';
        } else {
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorMessage;
          } catch (jsonError) {
            // Server returned HTML error page instead of JSON
            errorMessage = `Server error (${res.status}): ${res.statusText || 'Unknown error'}`;
          }
        }
        
        throw new Error(errorMessage);
      }
  toast.dismiss(uploadToastId);
  toast.success('File uploaded successfully.', { autoClose: 3000 });
      fetchFiles();
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const handleDownloadAndDecrypt = async (file) => {
    if (file.filename === '[Decryption Error]') return alert('Cannot download file with decryption error.');
  const downloadToastId = `download-${file.fileId}`;
  toast.info(`Downloading ${file.filename}...`, { autoClose: 4000, toastId: downloadToastId });
    try {
      const res = await fetch(`${API_URL}/file/${file.fileId}`);
      if (!res.ok) throw new Error('Download failed');

      const privateKey = await importRsaPrivateKeyFromHexPkcs8(privateKeyHex);
      const rawAesKey = await rsaOaepDecrypt(privateKey, hexToArrayBuffer(file.encryptedKey));
      const aesKey = await crypto.subtle.importKey('raw', rawAesKey, { name: 'AES-GCM' }, false, ['decrypt']);

      const encFileBuffer = await res.arrayBuffer();
      const fileIv = encFileBuffer.slice(0, 12);
      const ciphertext = encFileBuffer.slice(12);

  toast.info(`Decrypting ${file.filename}...`, { autoClose: 4000, toastId: downloadToastId });
      const decryptedFileBytes = await aesGcmDecrypt(aesKey, ciphertext, fileIv);

      const blob = new Blob([decryptedFileBytes], { type: file.type || 'application/octet-stream' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = file.filename;
      a.click();
  toast.dismiss(downloadToastId);
  toast.success(`${file.filename} downloaded and decrypted.`, { autoClose: 3500 });
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const handleDeleteFile = async (file) => {
    // Validation checks
    if (!file) {
      toast.error('Invalid file data');
      return;
    }

    if (!file.fileId) {
      toast.error('File ID is missing');
      return;
    }

    if (file.filename === '[Decryption Error]') {
      alert('Cannot delete file with decryption error.');
      return;
    }

    if (!user || !user.userId) {
      toast.error('User authentication required');
      return;
    }
    
    const displayName = file.filename || `File ${file.fileId}`;
    if (!confirm(`Are you sure you want to delete "${displayName}"? This action cannot be undone.`)) {
      return;
    }

    const deleteToastId = `delete-${file.fileId}`;
    toast.info(`Deleting ${displayName}...`, { autoClose: 4000, toastId: deleteToastId });
    
    try {
      console.log('Deleting file:', { fileId: file.fileId, userId: user.userId, filename: displayName });
      
      const res = await fetch(`${API_URL}/file/${user.userId}/${file.fileId}`, {
        method: 'DELETE',
      });
      
      console.log('Delete response status:', res.status, res.statusText);
      
      if (!res.ok) {
        let errorMessage = 'Delete failed';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
          console.error('Delete error response:', errorData);
        } catch (jsonError) {
          // If response is not JSON, use status text or generic message
          errorMessage = res.statusText || `Delete failed with status ${res.status}`;
          console.error('Non-JSON error response:', res.status, res.statusText);
        }
        throw new Error(errorMessage);
      }

      // Verify the response is valid JSON (optional, but safe)
      let successData;
      try {
        successData = await res.json();
        console.log('Delete success response:', successData);
      } catch (jsonError) {
        // Even if response isn't JSON, deletion might have succeeded
        console.warn('Delete response was not JSON, but request may have succeeded');
      }

      toast.dismiss(deleteToastId);
      toast.success(`${displayName} deleted successfully.`, { autoClose: 3500 });
      
      // Refresh the file list to confirm deletion
      console.log('Refreshing file list after deletion');
      await fetchFiles();
    } catch (err) {
      toast.dismiss(deleteToastId);
      toast.error(`Error deleting file: ${err.message}`);
      console.error('Delete file error:', err);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const selectedFile = droppedFiles[0];
      const MAX_FILE_SIZE = 80 * 1024 * 1024; // 80MB
      
      if (selectedFile.size > MAX_FILE_SIZE) {
        toast.error(`File too large. Maximum size allowed is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB. Dropped file is ${(selectedFile.size / 1024 / 1024).toFixed(1)}MB.`);
        return;
      }
      
      setFileToUpload(selectedFile);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      const MAX_FILE_SIZE = 80 * 1024 * 1024; // 80MB
      
      if (selectedFile.size > MAX_FILE_SIZE) {
        toast.error(`File too large. Maximum size allowed is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB. Selected file is ${(selectedFile.size / 1024 / 1024).toFixed(1)}MB.`);
        // Clear the input
        e.target.value = '';
        return;
      }
      
      setFileToUpload(selectedFile);
    }
  };

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload New File</h3>
        <form onSubmit={handleEncryptAndUpload} className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Side - Drag & Drop Area */}
            <div 
              className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors min-h-[140px] ${
                isDragOver 
                  ? 'border-slate-900 bg-slate-50' 
                  : fileToUpload 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('fileUpload').click()}
            >
              <input
                id="fileUpload"
                type="file"
                className="hidden"
                onChange={handleFileSelect}
              />
              
              {fileToUpload ? (
                <>
                  <svg className="w-8 h-8 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-green-700">File Selected</p>
                  <p className="text-xs text-green-600 mt-1 truncate max-w-full">{fileToUpload.name}</p>
                </>
              ) : (
                <>
                  <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="text-sm font-medium text-gray-700">Choose a file or drag it here</p>
                  <p className="text-xs text-gray-500 mt-1">Click to browse or drag and drop</p>
                </>
              )}
            </div>

            {/* Right Side - File Info & Upload Button */}
            <div className="flex flex-col justify-between space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Selected File</label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[60px] flex items-center">
                  <div className="w-full">
                    {fileToUpload ? (
                      <>
                        <p className="text-sm font-medium text-gray-900 truncate">{fileToUpload.name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500">
                            {(fileToUpload.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          {fileToUpload.size > 20 * 1024 * 1024 && (
                            <span className="text-xs text-amber-600 font-medium">Large file</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">No file selected</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button 
                  type="submit" 
                  className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/30 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={!fileToUpload}
                >
                  Encrypt & Upload
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Files Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Your Files</h3>
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                title="Grid view"
                className={`inline-flex items-center justify-center w-9 h-9 ${
                  viewMode === 'grid' 
                    ? 'bg-slate-100 text-slate-900' 
                    : 'bg-white text-gray-500 hover:bg-slate-50'
                }`}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="w-5 h-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="List view"
                title="List view"
                className={`inline-flex items-center justify-center w-9 h-9 ${
                  viewMode === 'list' 
                    ? 'bg-slate-100 text-slate-900' 
                    : 'bg-white text-gray-500 hover:bg-slate-50'
                }`}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="w-5 h-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
            
            {/* Refresh button */}
            <button
              type="button"
              onClick={fetchFiles}
              aria-label="Refresh files"
              title="Refresh files"
              className="inline-flex items-center justify-center w-9 h-9 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-gray-500/30 focus:ring-offset-2 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0114.36-3.36L23 10" />
                <path d="M20.49 15a9 9 0 01-14.36 3.36L1 14" />
              </svg>
            </button>
          </div>
        </div>
        
        {files.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500">No files found. Upload a file to get started.</p>
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {files.map((file) => (
              <div 
                key={file.fileId} 
                className="relative flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group" 
                onClick={() => handleDownloadAndDecrypt(file)}
              >
                {/* Delete button - appears on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFile(file);
                  }}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center z-10"
                  aria-label={`Delete ${file.filename}`}
                  title={`Delete ${file.filename}`}
                >
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                  {getFileIcon(file.filename)}
                </div>
                <div className="text-xs text-gray-700 text-center break-all line-clamp-2">
                  {file.filename}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List View
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {files.map((file) => (
                  <tr 
                    key={file.fileId}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 whitespace-nowrap" onClick={() => handleDownloadAndDecrypt(file)}>
                      <div className="flex items-center">
                        <div className="flex-shrink-0 text-2xl mr-3">
                          {getFileIcon(file.filename)}
                        </div>
                        <div className="truncate max-w-xs">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {file.filename}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {getFileLabel(file.filename, file.type)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(file);
                        }}
                        className="text-red-600 hover:text-red-800 mx-1"
                        aria-label={`Delete ${file.filename}`}
                        title={`Delete ${file.filename}`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadAndDecrypt(file);
                        }}
                        className="text-slate-700 hover:text-slate-900 mx-1"
                        aria-label={`Download ${file.filename}`}
                        title={`Download ${file.filename}`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default FileView;