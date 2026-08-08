require('dotenv').config();

const CLOUDFLARE_CONFIG = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  apiToken: process.env.CLOUDFLARE_API_TOKEN,
  modelId: process.env.CLOUDFLARE_MODEL_ID || '@cf/meta/llama-3.1-8b-instruct',
  baseUrl: 'https://api.cloudflare.com/client/v4',
};

/**
 * Validasi konfigurasi Cloudflare
 */
function validateConfig() {
  if (!CLOUDFLARE_CONFIG.accountId || !CLOUDFLARE_CONFIG.apiToken) {
    console.warn(
      'Warning: Cloudflare AI not configured. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env'
    );
    return false;
  }
  return true;
}

/**
 * Call Cloudflare AI API untuk analisis teks
 */
async function callCloudflareAI(prompt, options = {}) {
  if (!validateConfig()) {
    throw new Error('Cloudflare AI not configured');
  }

  const {
    maxTokens = 512,
    temperature = 0.7,
  } = options;

  const url = `${CLOUDFLARE_CONFIG.baseUrl}/accounts/${CLOUDFLARE_CONFIG.accountId}/ai/run/${CLOUDFLARE_CONFIG.modelId}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_CONFIG.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Cloudflare API Error: ${error.errors?.[0]?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.result?.response || '';
  } catch (error) {
    console.error('Cloudflare AI Error:', error.message);
    throw error;
  }
}

module.exports = {
  CLOUDFLARE_CONFIG,
  validateConfig,
  callCloudflareAI,
};
