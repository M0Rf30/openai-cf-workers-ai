/**
 * ID generation utilities
 * NOTE: These use Math.random() which is NOT cryptographically secure.
 * They are suitable for generating file names and API response IDs where
 * collision resistance is needed but security is not critical.
 */

/**
 * Generate a UUID v4 formatted ID
 * Used for file names and resource identifiers
 * @returns {string} UUID v4 formatted string
 */
export function uuidv4() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

/**
 * Generate a random alphanumeric ID
 * Used for API response IDs (chat completion, embeddings, etc.)
 * @param {number} length - Length of the ID to generate (default: 29)
 * @returns {string} Random alphanumeric string
 */
export function generateId(length = 29) {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}
