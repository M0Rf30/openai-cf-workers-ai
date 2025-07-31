// OpenAI-Compatible Fine-tuning Handler for Cloudflare Workers AI
// Note: This is a mock implementation as Cloudflare Workers AI doesn't support fine-tuning
// Provides compatible API responses for development and testing

import { 
	ValidationError,
	createErrorResponse, 
	createSuccessResponse,
	validateRequired,
	validateString,
	validateNumber,
	validateEnum,
	logError,
} from '../utils/errors.js';
import { getCORSHeaders } from '../utils/format.js';

// List fine-tuning jobs
// GET /fine_tuning/jobs
export const listFineTuningJobsHandler = async (request, env) => {
	try {
		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 200,
				headers: getCORSHeaders(),
			});
		}

		// Parse query parameters
		const url = new URL(request.url);
		const after = url.searchParams.get('after');
		const limit = parseInt(url.searchParams.get('limit') || '20');

		// Mock response - in real implementation, this would query a database
		const jobs = [
			{
				id: 'ftjob-abc123',
				object: 'fine_tuning.job',
				created_at: Math.floor(Date.now() / 1000) - 86400,
				finished_at: Math.floor(Date.now() / 1000) - 3600,
				model: 'gpt-3.5-turbo',
				fine_tuned_model: 'ft:gpt-3.5-turbo:my-org:custom_suffix:id',
				organization_id: 'org-123',
				status: 'succeeded',
				hyperparameters: {
					n_epochs: 4,
					batch_size: 1,
					learning_rate_multiplier: 1.0,
				},
				training_file: 'file-abc123',
				validation_file: null,
				result_files: ['file-def456'],
				trained_tokens: 10000,
			},
		];

		return createSuccessResponse({
			object: 'list',
			data: jobs,
			has_more: false,
		});

	} catch (error) {
		logError(error, {
			endpoint: '/fine_tuning/jobs',
			method: request.method,
		});
		return createErrorResponse(error);
	}
};

// Create fine-tuning job
// POST /fine_tuning/jobs
export const createFineTuningJobHandler = async (request, env) => {
	try {
		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 200,
				headers: getCORSHeaders(),
			});
		}

		// Validate request content type
		if (!request.headers.get('Content-Type')?.includes('application/json')) {
			throw new ValidationError('Content-Type must be application/json');
		}

		const body = await request.json();
		const validated = validateCreateFineTuningJobRequest(body);

		// Mock job creation - in real implementation, this would start a fine-tuning process
		console.log('Fine-tuning job creation request:', validated);

		const job = {
			id: `ftjob-${generateId()}`,
			object: 'fine_tuning.job',
			created_at: Math.floor(Date.now() / 1000),
			finished_at: null,
			model: validated.model,
			fine_tuned_model: null,
			organization_id: 'org-123',
			status: 'pending',
			hyperparameters: validated.hyperparameters,
			training_file: validated.training_file,
			validation_file: validated.validation_file,
			result_files: [],
			trained_tokens: null,
		};

		// Note: In a real implementation, you would:
		// 1. Store the job in a database
		// 2. Queue the training process
		// 3. Return the job ID for tracking

		return createSuccessResponse(job);

	} catch (error) {
		logError(error, {
			endpoint: '/fine_tuning/jobs',
			method: request.method,
		});
		return createErrorResponse(error);
	}
};

// Get fine-tuning job
// GET /fine_tuning/jobs/{fine_tuning_job_id}
export const getFineTuningJobHandler = async (request, env) => {
	try {
		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 200,
				headers: getCORSHeaders(),
			});
		}

		const url = new URL(request.url);
		const jobId = url.pathname.split('/').pop();

		if (!jobId) {
			throw new ValidationError('Fine-tuning job ID is required');
		}

		// Mock response - in real implementation, this would query a database
		const job = {
			id: jobId,
			object: 'fine_tuning.job',
			created_at: Math.floor(Date.now() / 1000) - 86400,
			finished_at: Math.floor(Date.now() / 1000) - 3600,
			model: 'gpt-3.5-turbo',
			fine_tuned_model: `ft:gpt-3.5-turbo:my-org:${jobId}:id`,
			organization_id: 'org-123',
			status: 'succeeded',
			hyperparameters: {
				n_epochs: 4,
				batch_size: 1,
				learning_rate_multiplier: 1.0,
			},
			training_file: 'file-abc123',
			validation_file: null,
			result_files: ['file-def456'],
			trained_tokens: 10000,
		};

		return createSuccessResponse(job);

	} catch (error) {
		logError(error, {
			endpoint: '/fine_tuning/jobs/{id}',
			method: request.method,
		});
		return createErrorResponse(error);
	}
};

// Cancel fine-tuning job
// POST /fine_tuning/jobs/{fine_tuning_job_id}/cancel
export const cancelFineTuningJobHandler = async (request, env) => {
	try {
		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 200,
				headers: getCORSHeaders(),
			});
		}

		const url = new URL(request.url);
		const pathParts = url.pathname.split('/');
		const jobId = pathParts[pathParts.length - 2]; // job ID is second to last

		if (!jobId) {
			throw new ValidationError('Fine-tuning job ID is required');
		}

		// Mock cancellation - in real implementation, this would stop the training process
		console.log(`Cancelling fine-tuning job: ${jobId}`);

		const job = {
			id: jobId,
			object: 'fine_tuning.job',
			created_at: Math.floor(Date.now() / 1000) - 3600,
			finished_at: Math.floor(Date.now() / 1000),
			model: 'gpt-3.5-turbo',
			fine_tuned_model: null,
			organization_id: 'org-123',
			status: 'cancelled',
			hyperparameters: {
				n_epochs: 4,
				batch_size: 1,
				learning_rate_multiplier: 1.0,
			},
			training_file: 'file-abc123',
			validation_file: null,
			result_files: [],
			trained_tokens: null,
		};

		return createSuccessResponse(job);

	} catch (error) {
		logError(error, {
			endpoint: '/fine_tuning/jobs/{id}/cancel',
			method: request.method,
		});
		return createErrorResponse(error);
	}
};

// List fine-tuning events
// GET /fine_tuning/jobs/{fine_tuning_job_id}/events
export const listFineTuningEventsHandler = async (request, env) => {
	try {
		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 200,
				headers: getCORSHeaders(),
			});
		}

		const url = new URL(request.url);
		const pathParts = url.pathname.split('/');
		const jobId = pathParts[pathParts.length - 2]; // job ID is second to last

		if (!jobId) {
			throw new ValidationError('Fine-tuning job ID is required');
		}

		// Parse query parameters
		const after = url.searchParams.get('after');
		const limit = parseInt(url.searchParams.get('limit') || '20');

		// Mock events - in real implementation, this would query training logs
		const events = [
			{
				id: 'ftevent-001',
				object: 'fine_tuning.job.event',
				created_at: Math.floor(Date.now() / 1000) - 3600,
				level: 'info',
				message: 'Job started',
				data: null,
				type: 'job.start',
			},
			{
				id: 'ftevent-002',
				object: 'fine_tuning.job.event',
				created_at: Math.floor(Date.now() / 1000) - 3000,
				level: 'info',
				message: 'Training progress: 25% complete',
				data: {
					step: 25,
					train_loss: 0.845,
					train_accuracy: 0.67,
				},
				type: 'metrics',
			},
			{
				id: 'ftevent-003',
				object: 'fine_tuning.job.event',
				created_at: Math.floor(Date.now() / 1000) - 1800,
				level: 'info',
				message: 'Training progress: 50% complete',
				data: {
					step: 50,
					train_loss: 0.623,
					train_accuracy: 0.78,
				},
				type: 'metrics',
			},
			{
				id: 'ftevent-004',
				object: 'fine_tuning.job.event',
				created_at: Math.floor(Date.now() / 1000) - 600,
				level: 'info',
				message: 'Job completed successfully',
				data: {
					step: 100,
					train_loss: 0.412,
					train_accuracy: 0.89,
				},
				type: 'job.complete',
			},
		];

		return createSuccessResponse({
			object: 'list',
			data: events,
			has_more: false,
		});

	} catch (error) {
		logError(error, {
			endpoint: '/fine_tuning/jobs/{id}/events',
			method: request.method,
		});
		return createErrorResponse(error);
	}
};

// Validation functions
function validateCreateFineTuningJobRequest(body) {
	const {
		model,
		training_file,
		hyperparameters,
		suffix,
		validation_file,
	} = body;

	validateRequired(model, 'model');
	validateRequired(training_file, 'training_file');

	// Validate model
	const allowedModels = [
		'gpt-3.5-turbo',
		'gpt-3.5-turbo-0613',
		'gpt-3.5-turbo-1106',
		'babbage-002',
		'davinci-002',
	];
	
	if (!allowedModels.includes(model)) {
		throw new ValidationError(
			`Model must be one of: ${allowedModels.join(', ')}`,
			'model'
		);
	}

	validateString(training_file, 'training_file');

	const validated = {
		model,
		training_file,
	};

	// Validate hyperparameters
	if (hyperparameters) {
		validated.hyperparameters = {};
		
		if (hyperparameters.batch_size !== undefined) {
			if (hyperparameters.batch_size === 'auto') {
				validated.hyperparameters.batch_size = 'auto';
			} else {
				validated.hyperparameters.batch_size = validateNumber(
					hyperparameters.batch_size,
					'hyperparameters.batch_size',
					1,
					256
				);
			}
		} else {
			validated.hyperparameters.batch_size = 'auto';
		}

		if (hyperparameters.learning_rate_multiplier !== undefined) {
			if (hyperparameters.learning_rate_multiplier === 'auto') {
				validated.hyperparameters.learning_rate_multiplier = 'auto';
			} else {
				validated.hyperparameters.learning_rate_multiplier = validateNumber(
					hyperparameters.learning_rate_multiplier,
					'hyperparameters.learning_rate_multiplier',
					0.02,
					2.0
				);
			}
		} else {
			validated.hyperparameters.learning_rate_multiplier = 'auto';
		}

		if (hyperparameters.n_epochs !== undefined) {
			if (hyperparameters.n_epochs === 'auto') {
				validated.hyperparameters.n_epochs = 'auto';
			} else {
				validated.hyperparameters.n_epochs = validateNumber(
					hyperparameters.n_epochs,
					'hyperparameters.n_epochs',
					1,
					50
				);
			}
		} else {
			validated.hyperparameters.n_epochs = 'auto';
		}
	} else {
		validated.hyperparameters = {
			batch_size: 'auto',
			learning_rate_multiplier: 'auto',
			n_epochs: 'auto',
		};
	}

	if (suffix) {
		validated.suffix = validateString(suffix, 'suffix', 1, 40);
	}

	if (validation_file) {
		validated.validation_file = validateString(validation_file, 'validation_file');
	}

	return validated;
}

// Utility function to generate unique IDs
function generateId(length = 29) {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}