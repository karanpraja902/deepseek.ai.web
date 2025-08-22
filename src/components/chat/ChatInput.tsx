'use client';
import { uploadFilesClient, deleteFileFromCloudinary, UploadedClientFile } from '../../lib/client-cloudinary';
import React, { useRef, useState, useEffect } from 'react';
import { Paperclip, X, StopCircle, Loader2, Globe, Image as ImageIcon, Code2, FileText, Table, CloudSun, FlaskConical, Wrench, SlidersHorizontal, Settings, Search } from 'lucide-react';
import DictationButton from '../ui/DictationButton';
import { LuCpu } from "react-icons/lu"

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  files: UploadedClientFile[];
  setUploadedFiles: (files: UploadedClientFile[]) => void;
  status: string;
  onStop: () => void;
  sendMessage: (message: { text?: string; parts?: any[]; metadata: { chatId: string; enableWebSearch?: boolean; model?: string } }) => void;
  chatId: string;
  messages: any[];
  model: string;
  setModel: (model: string) => void;
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
  messages,
  model,
  setModel
}: ChatInputProps) {
  const [preFile,setPreFile]=useState<File[]>([]);
  const [isUploading,setIsUploading]=useState<Boolean>(false)
  const [isDeleting,setIsDeleting]=useState<Boolean>(false)
  
  const [Error,setError]=useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [uploadedFileMetadata, setUploadedFileMetadata] = useState<UploadedClientFile[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  // Tools dropdown state and outside-click handler
  const [showTools, setShowTools] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [documentMode, setDocumentMode] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!showTools) return;
    const onDocClick = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setShowTools(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showTools]);

  // Model dropdown state and outside-click handler
const [showModelMenu, setShowModelMenu] = useState(false);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showModelMenu) return;
    const onDocClick = (e: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setShowModelMenu(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showModelMenu]);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // Calculate the new height based on content
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 48), 200); // Min 48px, Max 200px
      textarea.style.height = `${newHeight}px`;
    }
  }, [input]);

  // Handle transcript from dictation
  const handleTranscript = (transcript: string) => {
    setInput(input + transcript);
  };

  // Handle recording state changes
  const [isRecording, setIsRecording] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
setError("Failed to upload file")
setIsUploading(false)
return;
      }
      console.log("ChatInputFiles:",e.target.files)
      return;
    }

  };

  const handleDocumentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPreFile(Array.from(e.target.files))
      try{
        setIsUploading(true)
        const upload = await uploadFilesClient(Array.from(e.target.files))|| [];
        if(upload){
          setUploadedFileMetadata(upload)
          setUploadedFiles(upload);
          console.log("uploaded document:",upload)
          
          // Remove this section - don't add summary to input immediately
          // const pdfFile = upload.find(f => f.pdfAnalysis);
          // if (pdfFile?.pdfAnalysis) {
          //   const summaryText = `Document Summary...`;
          //   setInput(input ? input + '\n' + summaryText : summaryText);
          // }
          
          setIsUploading(false)
          return;
        }
      }catch(error){
        setError("Failed to upload document")
        setIsUploading(false)
        return;
      }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (status === 'ready' && (input.trim() || files.length > 0)) {
        formRef.current?.requestSubmit();
      }
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
    
    // Reset document mode if no files left
    if (newFiles.length === 0) {
      setDocumentMode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() || files.length > 0) {
      console.log("handleSubmitFiles:",files)
      const textPart = input.trim() ? [{ type: 'text', text: input }] : [];
      const fileParts = files.map(f => ({
        type: 'file',
        url: f.url,
        mediaType: f.mediaType,
        filename: f.filename,
        pdfAnalysis: f.pdfAnalysis, // Include PDF analysis in the message
      }));

              sendMessage({
          parts: [...textPart, ...fileParts],
          metadata: { 
            chatId,
            enableWebSearch: webSearchEnabled && !documentMode, // Disable web search in document mode
            model
          },
        });
      console.log("message:",messages)

      setInput('');
      setPreFile([]);
      setUploadedFiles([]);
      setDocumentMode(false); // Reset document mode after sending
    }
  };

  // Tools selection helper
  const handleToolSelect = (key: string) => {
    if (key === 'web') {
      if (!documentMode) { // Only allow web search if not in document mode
        setWebSearchEnabled(!webSearchEnabled);
      }
      setShowTools(false);
      return;
    }
    
    const prompts: Record<string, string> = {
      code: 'Write code for: ',
      doc: 'Analyze this document: ',
      csv: 'Analyze this CSV: ',
      weather: 'Weather in ',
      research: 'Deep research on: '
    };
    
    if (key === 'image') {
      if (!documentMode) { // Only allow image upload if not in document mode
        setShowTools(false);
        fileInputRef.current?.click();
      }
      return;
    }

    if (key === 'doc') {
      if(!preFile.length&&documentMode)
{
  console.log("documentMode:",documentMode)
  setDocumentMode(false);
  return;
}      setDocumentMode(true);
      setWebSearchEnabled(false); // Disable web search when document mode is enabled
      setShowTools(false);
      documentInputRef.current?.click();
      return;
    }
    
    if (!documentMode) { // Only add prompts if not in document mode
      const p = prompts[key] ?? '';
      setInput(input ? input + '\n' + p : p);
    }
    setShowTools(false);
  };

  const modelOptions = [
    { value: 'google', label: 'Google Gen AI ' },
    { value: 'openrouter:deepseek/deepseek-r1-0528:free', label: 'DeepSeek R1' },
    { value: 'openrouter:nvidia/llama-3.1-nemotron-ultra-253b-v1:free', label: 'Llama 3.1' },
    { value: 'openrouter:openai/gpt-oss-20b:free', label: 'GPT-Oss-20b' },
  ];

  console.log("ChatInputModel:",model)
  const selectedModelLabel = modelOptions.find(m => m.value === model)?.label || 'Google Gen AI (default)';

  return (
    <div className={`sticky bottom-0 bg-gradient-to-b from-transparent to-white/50 pb-4`}>
      <form ref={formRef} onSubmit={handleSubmit}>
        {/* File preview section */}
        {preFile.length > 0 && (
          <div className="mb-2 p-2 bg-white/50 rounded-lg border border-gray-200">
            <div className="flex flex-wrap gap-2">
              {preFile.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
                    {file.type === 'application/pdf' && (
                      <FileText className="w-4 h-4 text-red-600" />
                    )}
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
                    <p className='ml-2 text-gray-500 '>{file.type === 'application/pdf' ? 'Processing Document...' : 'Uploading Image'}</p>
                    </div>)
                    }
                    {
                      isDeleting&&(<div className='flex items-center bg-white rounded border '>
                    <p className='ml-2 text-gray-500 '>Removing {file.type === 'application/pdf' ? 'Document' : 'Image'}</p>
                    </div>)
                    }
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recording indicator */}
        {isRecording && (
          <div className="mb-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-700 text-sm font-medium">Recording... Speak now</span>
          </div>
        )}

        <div className={`flex gap-3 p-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border transition-all duration-300 ${
          isRecording 
            ? 'border-red-300 bg-red-50/80' 
            : documentMode 
            ? 'border-blue-300 bg-blue-50/80'
            : 'border-white/20'
        }`}>
          {/* Auto-expanding text input */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={status !== 'ready'}
            placeholder={
              isRecording 
                ? "Listening... Speak now..." 
                : documentMode 
                ? "Ask about your document..." 
                : "Ask me anything..."
            }
            className="flex-1 px-4 py-3 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 text-lg disabled:opacity-50 resize-none overflow-hidden max-h-[200px] min-h-[48px]"
            // style={{ height: '48px' }} // Initial height
            rows={1}
          />
          <div className="flex relative justify-center" ref={toolsMenuRef}>
            <button
              type="button"
              onClick={() => setShowTools(v => !v)}
              className="p-2 text-gray-500 hover:text-blue-600 transition-colors relative group/tooltip"
              title="Tools"
            >
              {documentMode ? (
                <FileText className="w-5 h-5 text-blue-600" />
              ) : webSearchEnabled ? (
                <Globe className="w-5 h-5" />
              ) : (
                <SlidersHorizontal className="w-5 h-5" />
              )}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                {documentMode ? 'Document Mode' : 'Tools'}
              </div>
            </button>
            
            {showTools && (
              <div className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-xl border border-gray-200 shadow-lg p-2 z-20">
                <div className="flex flex-col">
                  <button 
                    onClick={() => handleToolSelect('web')} 
                    disabled={documentMode}
                    className={`flex text-gray-600 items-center justify-between w-full gap-2 px-3 py-2 rounded-lg transition-colors ${
                      documentMode
                        ? 'opacity-50 cursor-not-allowed text-gray-400'
                        : webSearchEnabled 
                        ? 'bg-blue-200 text-blue-700 hover:bg-blue-200' 
                        : 'hover:bg-blue-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Web Search
                      {webSearchEnabled && !documentMode && <span className="text-xs font-medium">(ON)</span>}
                    </span>
                  </button>
               
                  
                  <button 
                    onClick={() => handleToolSelect('doc')} 
                    className={`flex text-gray-600 items-center justify-between w-full gap-2 px-3 py-2 rounded-lg transition-colors ${
                      documentMode 
                        ? 'bg-blue-200 text-blue-700 hover:bg-blue-200' 
                        : 'hover:bg-blue-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Document
                      {documentMode && <span className="text-xs font-medium">(ON)</span>}
                    </span>
                  </button>
               
                  <button 
                    onClick={() => handleToolSelect('weather')} 
                    disabled={documentMode}
                    className={`flex text-gray-600 items-center justify-between w-full gap-2 px-3 py-2 rounded-lg transition-colors ${
                      documentMode 
                        ? 'opacity-50 cursor-not-allowed text-gray-400' 
                        : 'hover:bg-blue-100'
                    }`}
                  >
                    <span className="flex items-center gap-2"><CloudSun className="w-4 h-4" />Weather</span>
                  </button>
                  <button 
                    onClick={() => handleToolSelect('research')} 
                    disabled={documentMode}
                    className={`flex text-gray-600 items-center justify-between w-full gap-2 px-3 py-2 rounded-lg transition-colors ${
                      documentMode 
                        ? 'opacity-50 cursor-not-allowed text-gray-400' 
                        : 'hover:bg-blue-100'
                    }`}
                  >
                    <span className="flex items-center gap-2"><FlaskConical className="w-4 h-4" />Deep Research</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Model selector */}
          <div className="flex relative justify-center" ref={modelMenuRef}>
            <button
              type="button"
              onClick={() => setShowModelMenu(v => !v)}
              className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:text-blue-600 hover:border-blue-300 transition-colors relative group/tooltip"
              title="Model"
            >
              Model
            </button>
            {showModelMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-72 bg-white rounded-xl border border-gray-200 shadow-lg p-2 z-20">
                <div className="p-2 text-xs text-gray-700">Current: {selectedModelLabel}</div>
                <div className="flex flex-col">
                  {modelOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setModel(opt.value); setShowModelMenu(false); }}
                      className={`flex items-center justify-between w-full gap-2 px-3 py-2 rounded-lg hover:bg-gray-200 text-gray-500 ${model === opt.value ? 'bg-blue-100 text-blue-100' : ''}`}
                    >
                      <span className="flex items-center gap-2"><LuCpu className="w-4 h-4" />{opt.label}</span>
                      {model === opt.value && <span className="text-xs">Selected</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* File input button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={webSearchEnabled || documentMode}
            className={`p-2 transition-colors relative group/tooltip ${
              webSearchEnabled || documentMode
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-500 hover:text-blue-600'
            }`}
            title={
              documentMode 
                ? "Image upload disabled in document mode"
                : webSearchEnabled 
                ? "File upload disabled when web search is enabled" 
                : "Attach files"
            }
          >
            <Paperclip className="w-5 h-5" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
              {documentMode 
                ? "Image upload disabled in document mode"
                : webSearchEnabled 
                ? "File upload disabled when web search is enabled" 
                : "Attach Files"
              }
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

          {/* Hidden document input */}
          <input
            type="file"
            ref={documentInputRef}
            onChange={handleDocumentChange}
            className="hidden"
            accept="application/pdf,.pdf,.doc,.docx,.txt"
          />
          
          {/* Dictation button */}
          <DictationButton
            onTranscript={handleTranscript}
            onRecordingChange={setIsRecording}
            disabled={status !== 'ready'}
            size="md"
            showTooltip={true}
          />

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
          ) : (!isRecording&&(
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
          )
            
          )}
        </div>
      </form>
    </div>
  );
}
