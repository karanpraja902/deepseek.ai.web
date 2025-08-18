export type UploadedClientFile = {
	url: string;
	mediaType: string;
	filename: string;
	width?: number;
	height?: number;
	publicId?: string;
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
		return {
			url: data.secure_url as string,
			mediaType: file.type || 'application/octet-stream',
			filename: file.name,
			width: data.width,
			height: data.height,
			publicId: data.public_id,
		};
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
		console.log("deleteResponse:",response)

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