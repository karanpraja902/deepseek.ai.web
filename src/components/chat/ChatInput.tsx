'use client';
import { uploadFilesClient, deleteFileFromCloudinary, UploadedClientFile } from '@/lib/client-cloudinary';
import { useRef, useState } from 'react';
import { Paperclip, X, StopCircle, Loader2 } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  files: UploadedClientFile[];
  setUploadedFiles: (files: UploadedClientFile[]) => void;
  status: string;
  onStop: () => void;
  sendMessage: (message: { text: string; metadata: { chatId: string; files: UploadedClientFile[] } }) => void;
  chatId: string;
  messages: any[];
}

export default function ChatInput({
  input,
  setInput,
  files,
  setUploadedFiles,
  status,
  onStop,
  sendMessage,
  chatId,
  messages
}: ChatInputProps) {
  const [preFile,setPreFile]=useState<File[]>([]);
  const [isUploading,setIsUploading]=useState<Boolean>(false)
  const [isDeleting,setIsDeleting]=useState<Boolean>(false)
  
  const [Error,setError]=useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFileMetadata, setUploadedFileMetadata] = useState<UploadedClientFile[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // console.log("local file:",Array.from(e.target.files))
    if (e.target.files) {
      setPreFile(Array.from(e.target.files))
      try{
      setIsUploading(true)
      const upload = await uploadFilesClient(Array.from(e.target.files))|| [];
      if(upload){
        setUploadedFileMetadata(upload)
        setUploadedFiles(upload);
        console.log("uploaded:",upload)
        setIsUploading(false)
        return;
      }
    }catch(error){
setError("Failed to upload image")
return;
      }
      console.log("ChatInputFiles:",e.target.files)
      return;
    }

  };
  if(preFile?.[0]){
  console.log("prefile:",preFile?.[0].name)
  }



  const removeFile = async (index: number) => {
    // Get the metadata for the file being removed
    console.log("remove file")
    const fileMetadata = uploadedFileMetadata[index];
    console.log("fileMetadata:",fileMetadata)
    
    // If we have a publicId, delete from Cloudinary
    if (fileMetadata?.publicId) {
      try {
        setIsDeleting(true)
        const deleted = await deleteFileFromCloudinary(fileMetadata.publicId);
        if (deleted) {
          console.log(`Successfully deleted file with publicId: ${fileMetadata.publicId}`);
          setIsDeleting(false)
        } else {
          console.error(`Failed to delete file with publicId: ${fileMetadata.publicId}`);
          
          setIsDeleting(false)
        }
      } catch (error) {
        console.error('Error deleting file from Cloudinary:', error);
          setIsDeleting(false)
      }
    }

    // Remove from local state
    const newFiles = [...files];
    newFiles.splice(index, 1);
    const newMetadata = [...uploadedFileMetadata];
    newMetadata.splice(index, 1);
    
    setPreFile([]);
    setUploadedFileMetadata(newMetadata);
    console.log("newfiles:", newFiles);
    setUploadedFiles(newFiles);
    console.log("newFiles:", newFiles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() || files.length > 0) {
      console.log("handleSubmitFiles:",files)
      sendMessage({
        text: input,
        metadata: { chatId, files },
      });
      console.log("message:",messages)

      setInput('');
      setPreFile([]);
      setUploadedFiles([]);
    }
  };


  return (
    <div className={`sticky bottom-0 bg-gradient-to-b from-transparent to-white/50 pb-4`}>
      <form onSubmit={handleSubmit}>
        {/* File preview section */}
        {preFile.length > 0 && (
          <div className="mb-2 p-2 bg-white/50 rounded-lg border border-gray-200">
            <div className="flex flex-wrap gap-2">
              {preFile.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
                    <div className="text-sm text-gray-600 truncate max-w-[120px]">
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {(file.size / (1024 * 1024)).toFixed(2)}MB
                    </div>
                    {(!isUploading&&!Error&&!isDeleting)?(
                      <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                      
                    </button>):(
<div className="relative">
  {Error?<p className='text-red-500'>!</p>
              :<Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
            </div>
                   
                    )
                    }
                    
                  </div>
                  {Error&&(<div className='flex items-center bg-white rounded border '>
                    <p className='ml-2 text-red-300'>Error</p>
                    </div>)}
                    {
                      isUploading&&(<div className='flex items-center bg-white rounded border '>
                    <p className='ml-2 text-gray-500 '>Uploading Image</p>
                    </div>)
                    }
                    {
                      isDeleting&&(<div className='flex items-center bg-white rounded border '>
                    <p className='ml-2 text-gray-500 '>Removing Image</p>
                    </div>)
                    }
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
