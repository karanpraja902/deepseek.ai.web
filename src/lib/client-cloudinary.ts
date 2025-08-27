import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export type UploadedClientFile = {
	url: string;
	mediaType: string;
	filename: string;
	width?: number;
	height?: number;
	publicId?: string;
	// Add PDF analysis data
	pdfAnalysis?: {
		summary: string;
		content: string;
		pageCount: number;
	};
};

export async function uploadFilesClient(
	files: File[],
	cloudName: string = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string,
	uploadPreset: string = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET as string,
): Promise<UploadedClientFile[]> {
	if (!files?.length) return [];
	if (!cloudName || !uploadPreset) {
		throw new Error('Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME or NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET');
	}

	const uploads = files.map(async (file) => {
		console.log("client-cloudinary:",file)
        const fd = new FormData();
		fd.append('file', file);
		fd.append('upload_preset', uploadPreset);
    

		const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
			method: 'POST',
			body: fd,
		});

		if (!res.ok) {
			const body = await res.text().catch(() => '');
			throw new Error(`Cloudinary upload failed: ${res.status} ${res.statusText} ${body}`);
		}

		const data = await res.json();
		const uploadedFile: UploadedClientFile = {
			url: data.secure_url as string,
			mediaType: file.type || 'application/octet-stream',
			filename: file.name,
			width: data.width,
			height: data.height,
			publicId: data.public_id,
		};

		return uploadedFile;
	});

	return Promise.all(uploads);
}

export async function deleteFileFromCloudinary(publicId: string): Promise<boolean> {
    if (!publicId) return false;

    try {
        const response = await fetch('/api/cloudinary/delete', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ publicId }),
        });
        console.log("deleteResponse:", response);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Failed to delete file from Cloudinary:', errorData);
            return false;
        }

        const result = await response.json();
        return result.success === true;
    } catch (error) {
        console.error('Error calling Cloudinary delete API:', error);
        return false;
    }
}

export interface PDFAnalysisResult {
    summary: string;
    content: string;
    pageCount: number;
    filename: string;
}

export async function analyzePDFFromUrl(url: string, filename: string): Promise<PDFAnalysisResult> {
    try {
        // Download the PDF from Cloudinary
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to download PDF: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Use LangChain to load and split the PDF document.
        const loader = new PDFLoader(buffer.toString());
        const docs = await loader.load();
        
        // Combine all page content
        const fullContent = docs.map(doc => doc.pageContent).join('\n\n');

        // Split content for better processing with a text splitter.
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        const chunks = await textSplitter.splitText(fullContent);

        // Generate a summary using a Large Language Model (LLM).
        const llm = new ChatGoogleGenerativeAI({
            model: "gemini-pro",
            temperature: 0.3,
            maxOutputTokens: 500,
        });
        const summaryResult = await llm.invoke(`Generate a concise summary (max 200 words) of the following document content: ${chunks.slice(0, 5).join('\n\n')}`);
        const summary = summaryResult.content.toString();

        return {
            summary,
            content: fullContent,
            pageCount: docs.length,
            filename
        };
    } catch (error) {
        console.error('Error analyzing PDF:', error);
        throw new Error(`Failed to analyze PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

