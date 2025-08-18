export function uint8ArrayToBase64(uint8Array) {
	let string = '';

	// Convert each byte in the Uint8Array to a character
	uint8Array.forEach(byte => {
		string += String.fromCharCode(byte);
	});

	// Convert the binary string to Base64
	return btoa(string);
}

export async function convertImageToDataURL(imageUrl) {
	console.log('Attempting to convert image URL:', imageUrl);
	try {
		// Validate the URL before fetching
		new URL(imageUrl);
		console.log('URL validated:', imageUrl);

		const response = await fetch(imageUrl);
		console.log('Fetch response status:', response.status);
		if (!response.ok) {
			console.error(`Failed to fetch image URL: ${response.status} ${response.statusText}`);
			throw new Error(`Failed to fetch image URL: ${response.statusText}`);
		}
		const contentType = response.headers.get('content-type') || 'image/jpeg';
		const buffer = await response.arrayBuffer();
		let binary = '';
		const bytes = new Uint8Array(buffer);
		const len = bytes.byteLength;
		for (let i = 0; i < len; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		const base64 = btoa(binary);
		const dataUrl = `data:${contentType};base64,${base64}`;
		console.log('Successfully converted to data URL (first 50 chars):', dataUrl.substring(0, 50));
		return dataUrl;
	} catch (error) {
		console.error('Error in convertImageToDataURL:', error);
		throw new Error('Image URL must be a data URI or a valid HTTP/HTTPS URL.');
	}
}
