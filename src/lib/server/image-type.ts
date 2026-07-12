/**
 * Cheap magic-byte sniffing for the image types the upload endpoint accepts.
 * Not a full parser — just enough to reject a renamed executable/HTML file
 * whose declared Content-Type lies. Pure function, unit-testable.
 */

export type AllowedImageType = 'image/jpeg' | 'image/png' | 'image/webp';

/** Canonical file extension per allowed MIME type (never trust the client filename). */
export const IMAGE_EXTENSIONS: Record<AllowedImageType, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp'
};

/** Sniff the real image type from the first bytes, or null if unrecognized. */
export function sniffImageType(bytes: Uint8Array): AllowedImageType | null {
	if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
		return 'image/jpeg';
	}
	if (
		bytes.length >= 8 &&
		bytes[0] === 0x89 &&
		bytes[1] === 0x50 &&
		bytes[2] === 0x4e &&
		bytes[3] === 0x47 &&
		bytes[4] === 0x0d &&
		bytes[5] === 0x0a &&
		bytes[6] === 0x1a &&
		bytes[7] === 0x0a
	) {
		return 'image/png';
	}
	// RIFF....WEBP
	if (
		bytes.length >= 12 &&
		bytes[0] === 0x52 &&
		bytes[1] === 0x49 &&
		bytes[2] === 0x46 &&
		bytes[3] === 0x46 &&
		bytes[8] === 0x57 &&
		bytes[9] === 0x45 &&
		bytes[10] === 0x42 &&
		bytes[11] === 0x50
	) {
		return 'image/webp';
	}
	return null;
}
