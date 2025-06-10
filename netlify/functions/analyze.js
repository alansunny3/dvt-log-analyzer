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
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { prompt } = JSON.parse(event.body || '{}');
    
    if (!prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing prompt' }),
      };
    }

    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API key not configured' }),
      };
    }

    // Truncate prompt if too long to speed up processing
    const maxPromptLength = 8000;
    const truncatedPrompt = prompt.length > maxPromptLength 
      ? prompt.substring(0, maxPromptLength) + "\n\n[Content truncated for faster processing]"
      : prompt;

    console.log('Making Claude API request...');
    
    // Use shorter timeout and smaller response
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2000, // Reduced for faster response
          messages: [{
            role: 'user',
            content: `Please provide a concise DVT log analysis (max 1500 words) for:\n\n${truncatedPrompt}`
          }]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Claude API error:', response.status, errorText);
        
        // Handle specific error codes
        if (response.status === 429) {
          return {
            statusCode: 429,
            headers,
            body: JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          };
        }
        
        if (response.status === 401) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Invalid API key. Please check your configuration.' }),
          };
        }

        return {
          statusCode: response.status,
          headers,
          body: JSON.stringify({ error: `Claude API error: ${response.status}` }),
        };
      }

      const data = await response.json();
      console.log('Claude API success');

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          analysis: data.content[0].text,
          usage: data.usage,
          timestamp: new Date().toISOString()
        }),
      };

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('Request timeout');
        return {
          statusCode: 504,
          headers,
          body: JSON.stringify({ error: 'Request timeout. Please try with a smaller file or use local analysis.' }),
        };
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: `Analysis failed: ${error.message}. Try using local analysis for large files.`,
        timestamp: new Date().toISOString()
      }),
    };
  }
};
