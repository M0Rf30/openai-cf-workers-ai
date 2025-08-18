// Helper function for streaming models (if needed)
export async function streamToBuffer(stream) {
	const reader = stream.getReader();
	const chunks = [];

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			chunks.push(value);
		}
	} finally {
		reader.releaseLock();
	}

	// Calculate total length
	const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);

	// Combine all chunks
	const buffer = new Uint8Array(totalLength);
	let offset = 0;
	for (const chunk of chunks) {
		buffer.set(chunk, offset);
		offset += chunk.length;
	}

	return buffer;
}
