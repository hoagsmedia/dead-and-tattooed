import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { r2Client, BUCKET_NAME } from '$lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { isAdmin } from '$lib/server/admin';
import { sniffImageType, IMAGE_EXTENSIONS } from '$lib/server/image-type';

/** Max upload size — gallery photos, not raw scans. */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

export const POST: RequestHandler = async ({ request, locals }) => {
	// Check authentication (hooks.server.ts populates locals from the session)
	if (!locals.user) {
		return error(401, 'Unauthorized');
	}
	// Uploads are seller-only: signed-in ≠ allowed to write to the bucket, and
	// an unverified claim on an allowlisted email doesn't count either.
	if (!isAdmin(locals.user.email) || !locals.user.emailVerified) {
		return error(403, 'The dashboard is for the artist.');
	}

	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return error(400, 'No file provided');
		}

		// Validate file size before buffering (413 Payload Too Large)
		if (file.size > MAX_UPLOAD_BYTES) {
			return error(413, 'File too large. Maximum size is 10MB.');
		}

		// Validate declared file type
		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
		if (!allowedTypes.includes(file.type)) {
			return error(400, 'Invalid file type. Only JPEG, PNG, and WebP are allowed.');
		}

		// Convert file to buffer and verify the declared type against the actual
		// bytes — Content-Type is client-controlled and trivially spoofed.
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const sniffed = sniffImageType(new Uint8Array(arrayBuffer.slice(0, 16)));
		if (!sniffed) {
			return error(400, 'File content is not a valid JPEG, PNG, or WebP image.');
		}

		// Key is fully server-generated: uuid + extension derived from the
		// sniffed type. The client filename never reaches the bucket.
		const fileName = `${uuidv4()}.${IMAGE_EXTENSIONS[sniffed]}`;
		const filePath = `artwork/${fileName}`;

		// Upload to R2
		await r2Client.send(
			new PutObjectCommand({
				Bucket: BUCKET_NAME,
				Key: filePath,
				Body: buffer,
				ContentType: sniffed
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
