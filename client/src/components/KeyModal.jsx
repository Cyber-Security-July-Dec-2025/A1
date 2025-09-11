import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

export default function KeyModal({ open, keyHex, onClose }) {
  const [checked, setChecked] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (open) {
      setChecked(false);
      // focus the confirm checkbox for accessibility
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(keyHex);
  toast.success('Copied to clipboard', { autoClose: 2500 });
    } catch (e) {
      console.error('Copy failed', e);
  toast.error('Failed to copy to clipboard', { autoClose: 3000 });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([keyHex], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'private_key.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
  <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Account creation successful</h2>
          <button 
            className="text-gray-400 hover:text-gray-600 text-xl font-bold w-6 h-6 flex items-center justify-center" 
            onClick={() => onClose(false)} 
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-black-600 font-semibold text-center text-sm tracking-wide mb-4">
              Here's your Private Key
            </p>
            <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
              <textarea
                ref={textareaRef}
                readOnly
                className="w-full h-64 font-mono text-xs bg-transparent border-none resize-none focus:outline-none text-gray-700"
                value={keyHex}
                aria-label="Private key"
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input 
                type="checkbox" 
                checked={checked} 
                onChange={(e) => setChecked(e.target.checked)}
                className="w-4 h-4 text-slate-900 border-gray-300 rounded focus:ring-slate-900 focus:ring-2"
              />
              I have saved my private key securely
            </label>

            <div className="flex gap-2">
              <button 
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500/30 focus:ring-offset-2 transition-colors" 
                type="button" 
                onClick={handleCopy}
              >
                Copy
              </button>
              <button 
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500/30 focus:ring-offset-2 transition-colors" 
                type="button" 
                onClick={handleDownload}
              >
                Download
              </button>
              <button 
                className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/30 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                type="button" 
                disabled={!checked} 
                onClick={() => onClose(true)}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
