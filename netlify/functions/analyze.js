exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

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

    // Extract only critical information for speed
    const lines = prompt.split('\n');
    let criticalContent = 'DVT Log Analysis Request:\n\n';
    
    const errorLines = [];
    const consensusLines = [];
    const relayLines = [];
    
    // Scan first 500 lines only
    for (let i = 0; i < Math.min(lines.length, 500); i++) {
      const line = lines[i].toLowerCase();
      
      if (line.includes('error') && (line.includes('critical') || line.includes('fatal'))) {
        if (errorLines.length < 3) errorLines.push(lines[i]);
      }
      else if ((line.includes('leader') || line.includes('qbft')) && consensusLines.length < 3) {
        consensusLines.push(lines[i]);
      }
      else if (line.includes('relay') && line.includes('timeout') && relayLines.length < 3) {
        relayLines.push(lines[i]);
      }
    }
    
    // Build minimal prompt
    if (errorLines.length > 0) {
      criticalContent += 'ERRORS:\n' + errorLines.join('\n') + '\n\n';
    }
    if (consensusLines.length > 0) {
      criticalContent += 'CONSENSUS:\n' + consensusLines.join('\n') + '\n\n';
    }
    if (relayLines.length > 0) {
      criticalContent += 'RELAYS:\n' + relayLines.join('\n') + '\n\n';
    }
    
    criticalContent += 'Provide brief analysis: 1. Critical Issues 2. Consensus Status 3. Quick Recommendations (under 500 words)';

    // 7-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

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
          max_tokens: 800,
          messages: [{
            role: 'user',
            content: criticalContent
          }]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          statusCode: response.status,
          headers,
          body: JSON.stringify({ 
            error: `AI analysis unavailable. Use Enhanced Local Analysis for detailed results.` 
          }),
        };
      }

      const data = await response.json();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          analysis: data.content[0].text + '\n\n---\n*Ultra-Fast AI Analysis*',
          usage: data.usage,
          timestamp: new Date().toISOString()
        }),
      };

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return {
          statusCode: 504,
          headers,
          body: JSON.stringify({ 
            error: 'AI analysis timeout. Enhanced Local Analysis provides better results!' 
          }),
        };
      }
      
      throw fetchError;
    }

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: `AI analysis failed. Enhanced Local Analysis is recommended.`,
        timestamp: new Date().toISOString()
      }),
    };
  }
};
