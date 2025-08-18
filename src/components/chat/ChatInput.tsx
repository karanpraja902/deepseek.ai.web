'use client';
import { useRef } from 'react';
import { Paperclip, X, StopCircle } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  files: File[];
  setFiles: (files: File[]) => void;
  status: string;
  onSubmit: (e: React.FormEvent) => void;
  onStop: () => void;
}

export default function ChatInput({
  input,
  setInput,
  files,
  setFiles,
  status,
  onSubmit,
  onStop
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  return (
    <div className={`sticky bottom-0 bg-gradient-to-b from-transparent to-white/50 pb-4`}>
      <form onSubmit={onSubmit}>
        {/* File preview section */}
        {files.length > 0 && (
          <div className="mb-2 p-2 bg-white/50 rounded-lg border border-gray-200">
            <div className="flex flex-wrap gap-2">
              {files.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
                    <div className="text-sm text-gray-600 truncate max-w-[120px]">
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {(file.size / (1024 * 1024)).toFixed(2)}MB
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 p-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
          {/* Text input */}
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={status !== 'ready'}
            placeholder="Ask me anything..."
            className="flex-1 px-4 py-3 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 text-lg disabled:opacity-50"
          />
          
          {/* File input button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-blue-600 transition-colors relative group/tooltip"
            title="Attach files"
          >
            <Paperclip className="w-5 h-5" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
              Attach Files
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              className="hidden"
              accept="image/*"
            />
          </button>
          
          {/* Submit or stop button */}
          {(status === 'submitted' || status === 'streaming') ? (
            <button 
              type="button"
              onClick={onStop}
              className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-colors flex items-center justify-center relative group/tooltip"
              title="Stop Generation"
            >
              <StopCircle className="w-5 h-5" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                Stop Generation
              </div>
            </button>
          ) : (
            <button 
              type="submit" 
              disabled={status !== 'ready' || (!input.trim() && files.length === 0)}
              className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center relative group/tooltip"
              title="Send Message"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                Send Message
              </div>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
