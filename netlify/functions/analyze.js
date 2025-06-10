const https = require('https');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request body
    const { prompt } = JSON.parse(event.body);
    
    if (!prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing prompt in request body' }),
      };
    }

    // Get Claude API key from environment variables
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Claude API key not configured' }),
      };
    }

    // Prepare Claude API request
    const claudeData = JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(claudeData)
      },
      timeout: 30000 // 30 second timeout
    };

    // Make request to Claude API
    const claudeResponse = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ statusCode: res.statusCode, data: parsed });
          } catch (e) {
            reject(new Error('Invalid JSON response from Claude API'));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.write(claudeData);
      req.end();
    });

    // Handle Claude API response
    if (claudeResponse.statusCode === 200) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          analysis: claudeResponse.data.content[0].text,
          usage: claudeResponse.data.usage,
          timestamp: new Date().toISOString()
        }),
      };
    } else {
      // Handle Claude API errors
      let errorMessage = 'Claude API error';
      
      if (claudeResponse.statusCode === 401) {
        errorMessage = 'Invalid API key';
      } else if (claudeResponse.statusCode === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (claudeResponse.statusCode >= 500) {
        errorMessage = 'Claude API service unavailable';
      } else if (claudeResponse.data && claudeResponse.data.error) {
        errorMessage = claudeResponse.data.error.message || errorMessage;
      }

      return {
        statusCode: claudeResponse.statusCode,
        headers,
        body: JSON.stringify({ error: errorMessage }),
      };
    }

  } catch (error) {
    console.error('Function error:', error);
    
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error.message.includes('timeout')) {
      errorMessage = 'Request timeout. Please try again.';
      statusCode = 504;
    } else if (error.message.includes('JSON')) {
      errorMessage = 'Invalid request format';
      statusCode = 400;
    }

    return {
      statusCode,
      headers,
      body: JSON.stringify({ 
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
    };
  }
};
