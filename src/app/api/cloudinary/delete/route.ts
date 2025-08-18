import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  console.log("apiDeleteCall")
  try {
    const { publicId } = await request.json();
    console.log("apiPublicId",publicId)
    
    if (!publicId) {
      return NextResponse.json({ error: 'Public ID is required' }, { status: 400 });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const apiSecret = process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Cloudinary credentials not configured' }, { status: 500 });
    }
console.log("delB")
    // Generate timestamp for authentication
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // Create signature for authentication
    const crypto = require('crypto');
    const signature = crypto
      .createHash('sha1')
      .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex');

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp.toString());
    formData.append('api_key', apiKey);
    formData.append('signature', signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      body: formData,
    });
    console.log("deleteCloudinaryImageResponse:",response)

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return NextResponse.json(
        { error: `Cloudinary delete failed: ${response.status} ${response.statusText} ${errorText}` }, 
        { status: response.status }
      );
    }

    const result = await response.json();
    
    if (result.result === 'ok') {
      return NextResponse.json({ success: true, message: 'File deleted successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to delete file from Cloudinary', result }, { status: 400 });
    }
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
