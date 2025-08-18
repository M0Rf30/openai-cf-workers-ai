/**
 * Process function calling in messages and convert to Cloudflare Workers AI format
 * @param {Array} messages - Conversation messages
 * @param {Array} tools - Available tools/functions
 * @returns {Array} Processed messages
 */
export function processFunctionMessages(messages, _tools = []) {
	const processedMessages = [];

	for (let i = 0; i < messages.length; i++) {
		const message = messages[i];

		if (message.role === 'assistant' && message.tool_calls) {
			// Convert tool calls to a format Cloudflare Workers AI can understand
			let content = message.content || '';

			// Add function call information to content
			for (const toolCall of message.tool_calls) {
				if (toolCall.type === 'function') {
					content += `\n\nFunction Call: ${toolCall.function.name}\nArguments: ${toolCall.function.arguments}`;
				}
			}

			processedMessages.push({
				role: 'assistant',
				content: content.trim(),
			});
		} else if (message.role === 'tool') {
			// Convert tool response to user message with context
			processedMessages.push({
				role: 'user',
				content: `Function Result for ${message.tool_call_id}: ${message.content}`,
			});
		} else if (message.role === 'function') {
			// Legacy function calling format
			processedMessages.push({
				role: 'user',
				content: `Function Result for ${message.name}: ${message.content}`,
			});
		} else {
			// Regular message
			processedMessages.push(message);
		}
	}

	return processedMessages;
}

/**
 * Add function definitions to system message for Cloudflare Workers AI
 * @param {Array} messages - Conversation messages
 * @param {Array} tools - Available tools/functions
 * @returns {Array} Messages with function context
 */
export function addFunctionContext(messages, tools = []) {
	if (!tools || tools.length === 0) {
		return messages;
	}

	// Create function definitions string
	const functionDefs = tools
		.map(tool => {
			if (tool.type === 'function') {
				const func = tool.function;
				return `Function: ${func.name}
Description: ${func.description || 'No description provided'}
Parameters: ${JSON.stringify(func.parameters || {})}`;
			}
			return '';
		})
		.filter(def => def)
		.join('\n\n');

	const functionPrompt = `You have access to the following functions. When you need to call a function, respond with a JSON object containing "function_call" with "name" and "arguments" fields:

${functionDefs}

Example function call format:
{
  "function_call": {
    "name": "function_name",
    "arguments": {"param1": "value1", "param2": "value2"}
  }
}

If you're not calling a function, respond normally with your message.`;

	// Add or update system message
	const updatedMessages = [...messages];
	const systemMessageIndex = updatedMessages.findIndex(msg => msg.role === 'system');

	if (systemMessageIndex >= 0) {
		// Append to existing system message
		updatedMessages[systemMessageIndex].content += '\n\n' + functionPrompt;
	} else {
		// Add new system message at the beginning
		updatedMessages.unshift({
			role: 'system',
			content: functionPrompt,
		});
	}

	return updatedMessages;
}

/**
 * Parse AI response for function calls
 * @param {string} content - AI response content
 * @returns {Object} Parsed response with potential function call
 */
export function parseFunctionCall(content) {
	try {
		// Try to find JSON in the response
		const jsonMatch = content.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			const parsed = JSON.parse(jsonMatch[0]);
			if (parsed.function_call) {
				return {
					hasFunction: true,
					functionCall: parsed.function_call,
					content: content.replace(jsonMatch[0], '').trim(),
				};
			}
		}
	} catch {
		// Not a function call, return as regular content
	}

	return {
		hasFunction: false,
		functionCall: null,
		content,
	};
}

/**
 * Convert function call to OpenAI format
 * @param {Object} functionCall - Function call from AI
 * @param {string} content - Response content
 * @returns {Object} OpenAI formatted response
 */
export function formatFunctionCallResponse(functionCall, content) {
	const toolCallId = `call_${crypto.randomUUID().replace(/-/g, '')}`;

	return {
		role: 'assistant',
		content: content || null,
		tool_calls: [
			{
				id: toolCallId,
				type: 'function',
				function: {
					name: functionCall.name,
					arguments:
						typeof functionCall.arguments === 'string'
							? functionCall.arguments
							: JSON.stringify(functionCall.arguments),
				},
			},
		],
	};
}
