import { describe, it, expect } from 'vitest';
import { sniffImageType, IMAGE_EXTENSIONS } from './image-type.js';

const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
const webp = Uint8Array.from([
	0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20
]);

describe('sniffImageType', () => {
	it('recognizes JPEG magic bytes', () => {
		expect(sniffImageType(jpeg)).toBe('image/jpeg');
	});

	it('recognizes PNG magic bytes', () => {
		expect(sniffImageType(png)).toBe('image/png');
	});

	it('recognizes WebP (RIFF....WEBP) magic bytes', () => {
		expect(sniffImageType(webp)).toBe('image/webp');
	});

	it('rejects HTML masquerading as an image', () => {
		const html = new TextEncoder().encode('<script>alert(1)</script>');
		expect(sniffImageType(html)).toBeNull();
	});

	it('rejects a Windows executable header', () => {
		const exe = Uint8Array.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
		expect(sniffImageType(exe)).toBeNull();
	});

	it('rejects truncated/empty input', () => {
		expect(sniffImageType(new Uint8Array())).toBeNull();
		expect(sniffImageType(Uint8Array.from([0xff, 0xd8]))).toBeNull();
	});

	it('maps every allowed type to a canonical extension', () => {
		expect(IMAGE_EXTENSIONS['image/jpeg']).toBe('jpg');
		expect(IMAGE_EXTENSIONS['image/png']).toBe('png');
		expect(IMAGE_EXTENSIONS['image/webp']).toBe('webp');
	});
});
