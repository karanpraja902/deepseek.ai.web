const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export class PdfApiService {
  static async analyzePDF(url: string, filename: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/pdf/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, filename }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze PDF');
      }

      return await response.json();
    } catch (error) {
      console.error('PDF analysis error:', error);
      throw error;
    }
  }

  static async extractText(url: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/pdf/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to extract text from PDF');
      }

      return await response.json();
    } catch (error) {
      console.error('PDF text extraction error:', error);
      throw error;
    }
  }
}
