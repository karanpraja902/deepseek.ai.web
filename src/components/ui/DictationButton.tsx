'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';

// Web Speech API types
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface DictationButtonProps {
  onTranscript: (transcript: string) => void;
  onRecordingChange?: (isRecording: boolean) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export default function DictationButton({
  onTranscript,
  onRecordingChange,
  disabled = false,
  className = '',
  size = 'md',
  showTooltip = true
}: DictationButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  // Size classes - simple objects, no memoization needed
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  // Initialize speech recognition
  const initSpeechRecognition = useCallback(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsRecording(true);
        onRecordingChange?.(true);
      };
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          onTranscript(finalTranscript);
        }
      };
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        onRecordingChange?.(false);
        
        // Show user-friendly error messages
        if (event.error === 'not-allowed') {
          alert('Please allow microphone access to use dictation.');
        } else if (event.error === 'no-speech') {
          alert('No speech detected. Please try speaking again.');
        } else if (event.error === 'audio-capture') {
          alert('Microphone not available. Please check your microphone settings.');
        }
      };
      
      recognition.onend = () => {
        setIsRecording(false);
        onRecordingChange?.(false);
      };
      
      setRecognition(recognition);
      return recognition;
    }
    return null;
  }, [onRecordingChange, onTranscript]);

  const toggleRecording = useCallback(() => {
    if (disabled) return;
    
    if (!recognition) {
      const newRecognition = initSpeechRecognition();
      if (newRecognition) {
        newRecognition.start();
      } else {
        alert('Speech recognition is not supported in your browser. Please use a modern browser like Chrome, Edge, or Safari.');
      }
    } else if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
    }
  }, [disabled, recognition, isRecording, initSpeechRecognition]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognition && isRecording) {
        recognition.stop();
      }
    };
  }, [recognition, isRecording]);

  return (
    <button
      type="button"
      onClick={toggleRecording}
      disabled={disabled}
      className={`${sizeClasses[size]} transition-colors relative group/tooltip ${
        isRecording 
          ? 'text-red-500 hover:text-red-600' 
          : 'text-gray-500 hover:text-blue-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      title={isRecording ? 'Stop Dictation' : 'Start Dictation'}
    >
      {isRecording ? <MicOff className={iconSizes[size]} /> : <Mic className={iconSizes[size]} />}
      
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
          {isRecording ? 'Stop Dictation' : 'Start Dictation'}
        </div>
      )}
    </button>
  );
}
