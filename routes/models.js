import { json } from 'itty-router';
import { AVAILABLE_MODELS } from '../utils/validation.js';

const getModelCapabilities = (modelId) => {
	const capabilities = [];
	
	// Determine capabilities based on model type
	if (AVAILABLE_MODELS.chat?.includes(modelId)) {
		capabilities.push('chat', 'completion');
	}
	if (AVAILABLE_MODELS.embedding?.includes(modelId)) {
		capabilities.push('embeddings');
	}
	if (AVAILABLE_MODELS.stt?.includes(modelId)) {
		capabilities.push('transcription', 'translation');
	}
	if (AVAILABLE_MODELS.tts?.includes(modelId)) {
		capabilities.push('text-to-speech');
	}
	if (AVAILABLE_MODELS.image_generation?.includes(modelId)) {
		capabilities.push('image-generation');
	}
	if (AVAILABLE_MODELS.vision?.includes(modelId)) {
		capabilities.push('vision');
	}
	if (AVAILABLE_MODELS.moderation?.includes(modelId)) {
		capabilities.push('moderation');
	}
	
	return capabilities;
};

const getStaticModelList = () => {
	const allModels = new Set();
	
	// Collect all models from all categories
	Object.values(AVAILABLE_MODELS).forEach(modelArray => {
		if (Array.isArray(modelArray)) {
			modelArray.forEach(model => allModels.add(model));
		}
	});
	
	return Array.from(allModels).map(modelId => ({
		id: modelId,
		object: 'model',
		created: Math.floor(Date.now() / 1000),
		owned_by: modelId.startsWith('@cf/') ? 'cloudflare' : 'huggingface',
		capabilities: getModelCapabilities(modelId),
	}));
};

const getCloudflareModels = async (env) => {
	try {
		if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_API_TOKEN) {
			// Fallback to static list if no API credentials
			return getStaticModelList();
		}

		const url = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/models/search?hide_experimental=false`;
		const headers = {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
		};

		const response = await fetch(url, { headers });

		if (!response.ok) {
			console.warn(`Failed to fetch models from Cloudflare API: ${response.statusText}`);
			return getStaticModelList();
		}

		const data = await response.json();
		
		return data.result.map(model => ({
			id: model.name,
			object: 'model',
			created: Math.floor(Date.now() / 1000),
			owned_by: model.source === 1 ? 'cloudflare' : 'huggingface',
			capabilities: getModelCapabilities(model.name),
		}));
	} catch (error) {
		console.warn('Error fetching models from Cloudflare API:', error);
		return getStaticModelList();
	}
};

export const modelsHandler = async (request, env) => {
	try {
		const models = await getCloudflareModels(env);

		return json({
			object: 'list',
			data: models,
		});
	} catch (error) {
		console.error('Error in modelsHandler:', error);
		
		// Fallback to static model list
		return json({
			object: 'list',
			data: getStaticModelList(),
		});
	}
};
