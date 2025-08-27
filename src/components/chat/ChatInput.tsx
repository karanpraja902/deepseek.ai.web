'use client';
import { uploadFilesClient, deleteFileFromCloudinary, UploadedClientFile } from '../../lib/client-cloudinary';
import { PdfApiService, ChatApiService } from '../../services/api';
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Paperclip, X, StopCircle, Loader2, Globe, Image as ImageIcon, Code2, FileText, Table, CloudSun, FlaskConical, Wrench, SlidersHorizontal, Settings, Search, Palette } from 'lucide-react';
import DictationButton from '../ui/DictationButton';
import { LuCpu } from "react-icons/lu"

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  files: UploadedClientFile[];
  setUploadedFiles: (files: UploadedClientFile[]) => void;
  sendMessage: (message: any) => Promise<void>;
  status: string;
  onStop: () => void;
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
  sendMessage,
  status,
  onStop,
  chatId,
  messages,
  model,
  setModel
}: ChatInputProps) {
  const [preFile, setPreFile] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState<Boolean>(false)
  const [isDeleting, setIsDeleting] = useState<Boolean>(false)
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [isSending, setIsSending] = useState(false); // Add loading state for sending message
  const [isRecording, setIsRecording] = useState(false); // Handle recording state changes
  const [isGeneratingImage, setIsGeneratingImage] = useState(false); // Add loading state for image generation

  
  const [error, setError] = useState<string>('')
  const [showErrorToast, setShowErrorToast] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [uploadedFileMetadata, setUploadedFileMetadata] = useState<UploadedClientFile[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  // Tools dropdown state and outside-click handler
  const [showTools, setShowTools] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [documentMode, setDocumentMode] = useState(false);
  const [imageGenerationMode, setImageGenerationMode] = useState(false);
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

  // Memoized values
  const isSubmitDisabled = useMemo(() => {
    return status === 'streaming' || 
           status === 'preparing' || 
           (!input.trim() && files.length === 0) || 
           isProcessingPdf || 
           isSending;
  }, [status, input, files.length, isProcessingPdf, isSending]);

  const isFileUploadDisabled = useMemo(() => {
    return webSearchEnabled || documentMode || imageGenerationMode;
  }, [webSearchEnabled, documentMode, imageGenerationMode]);

  const placeholderText = useMemo(() => {
    if (isRecording) return "Listening... Speak now...";
    if (isProcessingPdf) return "Processing document...";
    if (documentMode) return "Ask about your document...";
    if (imageGenerationMode) return "Describe the image you want to generate...";
    return "Ask me anything...";
  }, [isRecording, isProcessingPdf, documentMode, imageGenerationMode]);

  const containerClassName = useMemo(() => {
    const baseClass = "flex gap-3 p-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border transition-all duration-300";
    if (isRecording) return `${baseClass} border-red-300 bg-red-50/80`;
    if (documentMode) return `${baseClass} border-blue-300 bg-blue-50/80`;
    if (imageGenerationMode) return `${baseClass} border-purple-300 bg-purple-50/80`;
    return `${baseClass} border-white/20`;
  }, [isRecording, documentMode, imageGenerationMode]);

  const modelOptions = useMemo(() => [
    { value: 'google', label: 'Google Gen AI ' },
    { value: 'openrouter:deepseek/deepseek-r1-0528:free', label: 'DeepSeek R1' },
    { value: 'openrouter:nvidia/llama-3.1-nemotron-ultra-253b-v1:free', label: 'Llama 3.1' },
    { value: 'openrouter:openai/gpt-oss-20b:free', label: 'GPT-Oss-20b' },
  ], []);

  const selectedModelLabel = useMemo(() => {
    return modelOptions.find(m => m.value === model)?.label || 'Google Gen AI (default)';
  }, [modelOptions, model]);

  const toolPrompts = useMemo(() => ({
    code: 'Write code for: ',
    doc: 'Analyze this document: ',
    csv: 'Analyze this CSV: ',
    weather: 'Weather in ',
    research: 'Deep research on: '
  }), []);

  // Callback functions
  const handleTranscript = (transcript: string) => {
    setInput(input + transcript);
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleFileChange")
    if (e.target.files) {
      setPreFile(Array.from(e.target.files))
      console.log("imageFile:",Array.from(e.target.files))
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
    }catch(error: any){
      console.error('File upload error:', error);
      let errorMessage = 'Failed to upload file';
      if (error.message) {
        errorMessage = `Upload failed: ${error.message}`;
      } else if (error.response?.data?.error) {
        errorMessage = `Server error: ${error.response.data.error}`;
      }
      setError(errorMessage);
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 8000);
      setIsUploading(false)
      return;
      }
      console.log("ChatInputFiles:",e.target.files)
      return;
    }
  }, [setUploadedFiles]);

  const handleDocumentChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleDocumentChange")
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setPreFile([file]);
      setDocumentMode(true);
      setWebSearchEnabled(false);
      setShowTools(false);
      setIsProcessingPdf(true); // Start PDF processing state

      try {
        // First, upload the PDF to Cloudinary
        const upload = await uploadFilesClient([file]);
        if (upload && upload.length > 0) {
          const uploadedFile = upload[0];
          
          // Now, send the URL to the new server-side analysis endpoint
          try {
            const analysis = await PdfApiService.analyzePDF(uploadedFile.url, uploadedFile.filename);
            uploadedFile.pdfAnalysis = analysis;
          } catch (analysisError) {
            console.warn("PDF analysis failed, continuing without analysis:", analysisError);
            // Continue without analysis - the AI can still work with the PDF URL
          }
          setIsProcessingPdf(false); // End PDF processing state
          setUploadedFileMetadata([uploadedFile]);
          setUploadedFiles([uploadedFile]);
          console.log("uploaded and analyzed document:", uploadedFile);
        }
      } catch (error: any) {
        console.error("PDF analysis error:", error);
        let errorMessage = 'Failed to upload or analyze document';
        if (error.message) {
          errorMessage = `Document processing failed: ${error.message}`;
        } else if (error.response?.data?.error) {
          errorMessage = `Server error: ${error.response.data.error}`;
        } else if (error.status) {
          errorMessage = `HTTP ${error.status}: ${error.statusText || 'Request failed'}`;
        }
        setError(errorMessage);
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 8000);
      } finally {
        setIsProcessingPdf(false); // End PDF processing state
      }
    }
  }, [setUploadedFiles]);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    console.log("handleKeyDown")
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (status !== 'streaming' && (input.trim() || files.length > 0)) {
        formRef.current?.requestSubmit();
      }
    }
  };

  const removeFile = useCallback(async (index: number) => {
    console.log("removeFile")
    // Get the metadata for the file being removed
    console.log("remove file")
    const fileMetadata = uploadedFileMetadata[index];
    console.log("fileMetadata:",fileMetadata)
    setError('')
    
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
      } catch (error: any) {
        console.error('Error deleting file from Cloudinary:', error);
        let errorMessage = 'Failed to delete file';
        if (error.message) {
          errorMessage = `File deletion failed: ${error.message}`;
        } else if (error.response?.data?.error) {
          errorMessage = `Server error: ${error.response.data.error}`;
        }
        setError(errorMessage);
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 8000);
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
  }, [files, uploadedFileMetadata, setUploadedFiles]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    console.log("handleSubmit")
    setIsSending(true);
    e.preventDefault();
    
    if ((input.trim() || files.length > 0) && !isProcessingPdf && status !== 'streaming' && status !== 'preparing') {
      console.log("handleSubmitFiles:", files);
      console.log("handleSubmitInput:", uploadedFileMetadata);
      
      // Check if we're in image generation mode
      if (imageGenerationMode && input.trim()) {
        try {
          setIsGeneratingImage(true);
          console.log('Generating image with prompt:', input);
          
          // Create user message with the prompt and image generation flag
          const userMessage = {
            role: 'user',
            content: input.trim(),
            parts: [{ type: 'text', text: input.trim() }],
            files: [],
            metadata: { 
              chatId,
              model,
              isImageGeneration: true
            },
          };

          console.log("userMessage:", userMessage);

          // Clear input and modes
          setInput('');
          setImageGenerationMode(false);
          setIsGeneratingImage(false);

          // Send the user message - the sendMessage function will handle image generation
          await sendMessage(userMessage);
          
        } catch (error: any) {
          console.error('Error in image generation flow:', error);
          setIsGeneratingImage(false);
          setIsSending(false);
          
          // Provide detailed error message
          let errorMessage = 'Failed to process image generation request';
          if (error.message) {
            errorMessage = `Image generation failed: ${error.message}`;
          } else if (error.response?.data?.error) {
            errorMessage = `Server error: ${error.response.data.error}`;
          } else if (error.status) {
            errorMessage = `HTTP ${error.status}: ${error.statusText || 'Request failed'}`;
          }
          
          setError(errorMessage);
          setShowErrorToast(true);
          // Auto-hide error toast after 8 seconds
          setTimeout(() => setShowErrorToast(false), 8000);
          return;
        }
      } else {
        // Normal message handling
        const textPart = input.trim() ? [{ type: 'text', text: input }] : [];
        const fileParts = files.map(f => ({
          type: 'file',
          url: f.url,
          mediaType: f.mediaType,
          filename: f.filename
        }));

        const messageToSend = {
          content: input.trim(),
          parts: [...textPart, ...fileParts],
          metadata: { 
            chatId,
            model,
            enableWebSearch: webSearchEnabled
          },
        };
        console.log("messageToSend:",messageToSend)
        
        // Clear input immediately before sending
        setInput('');
        setPreFile([]);
        setUploadedFiles([]);
        setDocumentMode(false); // Reset document mode after sending

        try {
          console.log('Calling sendMessage...');
          await sendMessage(messageToSend);
          console.log('sendMessage completed, current status:', status);
        } catch (error) {
          console.error('Error sending message:', error);
          setIsSending(false);
        } finally {
          setIsSending(false);
        }
      }
      
      console.log("message:", messages);
    }
  }, [input, files, uploadedFileMetadata, isProcessingPdf, status, chatId, model, imageGenerationMode, setInput, setUploadedFiles, sendMessage, messages]);

  const handleToolSelect = useCallback((key: string) => {
    console.log("handleToolSelect")
    if (key === 'web') {
      if (!documentMode && !imageGenerationMode) { // Only allow web search if not in document or image mode
        setWebSearchEnabled(!webSearchEnabled);
      }
      setShowTools(false);
      return;
    }
    
    if (key === 'image') {
      if (!documentMode && !imageGenerationMode) { // Only allow image upload if not in document or image generation mode
        setShowTools(false);
        fileInputRef.current?.click();
      }
      return;
    }

    if (key === 'generate-image') {
      if (!documentMode && !webSearchEnabled) { // Only allow image generation if not in document or web search mode
        setImageGenerationMode(!imageGenerationMode);
        setWebSearchEnabled(false);
      }
      setShowTools(false);
      return;
    }

    if (key === 'doc') {
      if(!preFile.length && documentMode) {
        console.log("documentMode:", documentMode);
        setDocumentMode(false);
        return;
      }
      setDocumentMode(true);
      setWebSearchEnabled(false); // Disable web search when document mode is enabled
      setImageGenerationMode(false); // Disable image generation when document mode is enabled
      setShowTools(false);
      documentInputRef.current?.click();
      return;
    }
    
    if (!documentMode && !imageGenerationMode) { // Only add prompts if not in document or image generation mode
      const p = toolPrompts[key as keyof typeof toolPrompts] ?? '';
      setInput(input ? input + '\n' + p : p);
    }
    setShowTools(false);
  }, [documentMode, webSearchEnabled, imageGenerationMode, preFile.length, toolPrompts, input, setInput]);

  const handleModelSelect = (modelValue: string) => {
    setModel(modelValue);
    setShowModelMenu(false);
  };

  // Simple functions - no memoization needed
  const handleToolsToggle = () => {
    setShowTools(v => !v);
  };

  const handleModelMenuToggle = () => {
    setShowModelMenu(v => !v);
  };

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  const handleDocumentInputClick = () => {
    documentInputRef.current?.click();
  };

  // Add effect to clear loading state when streaming actually starts
  useEffect(() => {
    console.log('Status changed:', status, 'isSending:', isSending);
    if (status === 'streaming' && isSending) {
      console.log('Clearing isSending state');
      setIsSending(false);
    }
  }, [status, isSending]);

  // Fallback: Clear isSending after a reasonable timeout to prevent stuck state
  useEffect(() => {
    if (isSending) {
      const timeout = setTimeout(() => {
        console.log('Timeout: Clearing isSending state after 10 seconds');
        setIsSending(false);
      }, 5000); // 10 seconds timeout

      return () => clearTimeout(timeout);
    }
  }, [isSending]);



  console.log("ChatInputModel:",model)

  return (
    <div className={`sticky bottom-0 bg-gradient-to-b from-transparent to-white/50 pb-4`}>
      {/* Error Toast Notification */}
      {showErrorToast && error && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 animate-in slide-in-from-right duration-300">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-1 text-sm text-red-700">{error}</div>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowErrorToast(false);
                    setError('');
                  }}
                  className="inline-flex text-red-400 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
                    {(!isUploading && !isProcessingPdf && !isDeleting) && (
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {error && (
                    <div className='flex items-center bg-red-50 border border-red-200 rounded-lg p-3 mb-2'>
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <div className="mt-1 text-sm text-red-700">{error}</div>
                      </div>
                      <div className="ml-auto pl-3">
                        <button
                          type="button"
                          onClick={() => setError('')}
                          className="inline-flex text-red-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  {
                    isUploading && (<div className='flex items-center bg-white rounded border '>
                      <p className='ml-2 text-gray-500 '>Parsing...</p>
                    </div>)
                  }
                  {
                    isProcessingPdf && (<div className='flex items-center bg-white rounded border '>
                      <p className='ml-2 text-gray-500 '>Processing Document...</p>
                    </div>)
                  }
                  {
                    isDeleting && (<div className='flex items-center bg-white rounded border '>
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

        <div className={containerClassName}>
          {/* Auto-expanding text input */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={status === 'streaming' || isProcessingPdf}
            placeholder={placeholderText}
            className="flex-1 px-4 py-3 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 text-lg disabled:opacity-50 resize-none overflow-hidden max-h-[200px] min-h-[48px]"
            rows={1}
          />
          <div className="flex relative justify-center" ref={toolsMenuRef}>
            <button
              type="button"
              onClick={handleToolsToggle}
              className="p-2 text-gray-500 hover:text-blue-600 transition-colors relative group/tooltip"
              title="Tools"
            >
              {documentMode ? (
                <FileText className="w-5 h-5 text-blue-600" />
              ) : webSearchEnabled ? (
                <Globe className="w-5 h-5" />
              ) : imageGenerationMode ? (
                <Palette className="w-5 h-5 text-purple-600" />
              ) : (
                <SlidersHorizontal className="w-5 h-5" />
              )}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                {documentMode ? 'Document Mode' : imageGenerationMode ? 'Image Generation Mode' : 'Tools'}
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
                    onClick={() => handleToolSelect('generate-image')} 
                    disabled={documentMode || webSearchEnabled}
                    className={`flex text-gray-600 items-center justify-between w-full gap-2 px-3 py-2 rounded-lg transition-colors ${
                      documentMode || webSearchEnabled
                        ? 'opacity-50 cursor-not-allowed text-gray-400'
                        : imageGenerationMode 
                        ? 'bg-purple-200 text-purple-700 hover:bg-purple-200' 
                        : 'hover:bg-purple-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Generate Image
                      {imageGenerationMode && <span className="text-xs font-medium">(ON)</span>}
                    </span>
                  </button>
               
                  <button 
                    onClick={() => handleToolSelect('weather')} 
                    disabled={documentMode || imageGenerationMode}
                    className={`flex text-gray-600 items-center justify-between w-full gap-2 px-3 py-2 rounded-lg transition-colors ${
                      documentMode || imageGenerationMode
                        ? 'opacity-50 cursor-not-allowed text-gray-400' 
                        : 'hover:bg-blue-100'
                    }`}
                  >
                    <span className="flex items-center gap-2"><CloudSun className="w-4 h-4" />Weather</span>
                  </button>
                  <button 
                    onClick={() => handleToolSelect('research')} 
                    disabled={documentMode || imageGenerationMode}
                    className={`flex text-gray-600 items-center justify-between w-full gap-2 px-3 py-2 rounded-lg transition-colors ${
                      documentMode || imageGenerationMode
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
              onClick={handleModelMenuToggle}
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
                      onClick={() => handleModelSelect(opt.value)}
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
            onClick={handleFileInputClick}
            disabled={isFileUploadDisabled}
            className={`p-2 transition-colors relative group/tooltip ${
              isFileUploadDisabled
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
            disabled={status === 'streaming' || isProcessingPdf}
            size="md"
            showTooltip={true}
          />

          {/* Submit or stop button */}
          {status === 'streaming' ? (
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
          ) : (!isRecording && (
            <button 
              type="submit" 
              disabled={isSubmitDisabled}
              className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center relative group/tooltip"
              title="Send Message"
            >
              {(isSending || status === 'preparing') ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                {(isSending || status === 'preparing') ? 'Sending...' : 'Send Message'}
              </div>
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
