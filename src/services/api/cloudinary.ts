// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://deepseek-ai-server.vercel.app/api';
const API_BASE_URL = 'http://localhost:5000';

// Client-side interfaces and types
export interface UploadedClientFile {
  url: string;
  publicId: string;
  filename: string;
  mediaType: string;
  size?: number;
  pdfAnalysis?: {
    pageCount: number;
    text: string;
    summary: string;
  };
}

// Client-side file upload functions
export const uploadFilesClient = async (files: File[]): Promise<UploadedClientFile[]> => {
  try {
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}/api/cloudinary/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to upload ${file.name}: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
      }
      
      const result = await response.json();
      console.log("cloudinary filesClient result:", result);
      return {
        url: result.data.file.url,
        publicId: result.data.file.public_id,
        filename: result.data.file.filename,
        mediaType: result.data.file.mediaType,
        size: result.data.file.size,
      } as UploadedClientFile;
    });
    
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Batch file upload error:', error);
    throw error;
  }
};

export const deleteFileFromCloudinary = async (publicId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cloudinary/${publicId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }

    const result = await response.json();
    return result.success || false;
  } catch (error) {
    console.error('File deletion error:', error);
    return false;
  }
};

export class CloudinaryApiService {
  static async uploadFile(file: File) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_BASE_URL}/api/cloudinary/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to upload file: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
      }

      return await response.json();
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }

  static async deleteFile(publicId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cloudinary/${publicId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      return await response.json();
    } catch (error) {
      console.error('File deletion error:', error);
      throw error;
    }
  }

  static async getFileInfo(publicId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cloudinary/${publicId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get file info');
      }

      return await response.json();
    } catch (error) {
      console.error('Get file info error:', error);
      throw error;
    }
  }
}
