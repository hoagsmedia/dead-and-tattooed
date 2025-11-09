import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { r2Client, BUCKET_NAME } from '$lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '$lib/auth';

export const POST: RequestHandler = async ({ request }) => {
	// Check authentication
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (!session?.user) {
		return error(401, 'Unauthorized');
	}

	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return error(400, 'No file provided');
		}

		// Validate file type
		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
		if (!allowedTypes.includes(file.type)) {
			return error(400, 'Invalid file type. Only JPEG, PNG, and WebP are allowed.');
		}

		// Validate file size (max 10MB)
		const maxSize = 10 * 1024 * 1024; // 10MB
		if (file.size > maxSize) {
			return error(400, 'File too large. Maximum size is 10MB.');
		}

		// Generate unique filename
		const fileExtension = file.name.split('.').pop();
		const fileName = `${uuidv4()}.${fileExtension}`;
		const filePath = `artwork/${fileName}`;

		// Convert file to buffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Upload to R2
		await r2Client.send(
			new PutObjectCommand({
				Bucket: BUCKET_NAME,
				Key: filePath,
				Body: buffer,
				ContentType: file.type
			})
		);

		// Return the public URL
		// Note: You'll need to configure R2 public access or use a custom domain
		// For now, returning the path - you'll need to construct the full URL based on your R2 setup
		const fileUrl = `https://pub-${BUCKET_NAME}.r2.dev/${filePath}`;

		return json({ url: fileUrl, fileName });
	} catch (err) {
		console.error('Upload error:', err);
		return error(500, 'Failed to upload file');
	}
};

