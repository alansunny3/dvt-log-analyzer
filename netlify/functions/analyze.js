exports.handler = async (event, context) => {
  // Enable CORS
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

    // ULTRA-AGGRESSIVE PROMPT TRUNCATION FOR SPEED
    // Extract only the most important parts
    const lines = prompt.split('\n');
    let truncatedContent = '';
    
    // Strategy: Take recent errors, warnings, and key events
    const importantLines = [];
    const errorLines = [];
    const warningLines = [];
    const consensusLines = [];
    const relayLines = [];
    
    // Scan for important lines
    for (let i = 0; i < Math.min(lines.length, 2000); i++) { // Limit scan to 2000 lines
      const line = lines[i].toLowerCase();
      
      if (line.includes('error') && errorLines.length < 10) {
        errorLines.push(lines[i]);
      } else if (line.includes('warn') && warningLines.length < 5) {
        warningLines.push(lines[i]);
      } else if ((line.includes('consensus') || line.includes('qbft') || line.includes('leader')) && consensusLines.length < 5) {
        consensusLines.push(lines[i]);
      } else if ((line.includes('relay') || line.includes('mev')) && relayLines.length < 5) {
        relayLines.push(lines[i]);
      }
    }
    
    // Build focused prompt with only key information
    truncatedContent = `SUMMARY OF LOG ANALYSIS REQUEST:
    
Recent Errors (${errorLines.length}):
${errorLines.join('\n')}

Recent Warnings (${warningLines.length}):
${warningLines.join('\n')}

Consensus Events (${consensusLines.length}):
${consensusLines.join('\n')}

MEV/Relay Events (${relayLines.length}):
${relayLines.join('\n')}

Please provide a CONCISE analysis focusing on:
1. Critical errors and their causes
2. DVT consensus issues 
3. MEV relay problems
4. Quick recommendations

Keep response under 1000 words.`;

    console.log('Optimized prompt length:', truncatedContent.length);
    
    // Use 8-second timeout (2 seconds buffer before Netlify timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

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
          max_tokens: 1000, // Small response for speed
          messages: [{
            role: 'user',
            content: truncatedContent
          }]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Claude API error:', response.status, errorText);
        
        return {
          statusCode: response.status,
          headers,
          body: JSON.stringify({ 
            error: `Claude API error: ${response.status}. Try local analysis for detailed results.` 
          }),
        };
      }

      const data = await response.json();
      console.log('Claude API success');

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          analysis: data.content[0].text + '\n\n---\n*AI Analysis (Optimized for speed) - For detailed analysis, use Local Analysis mode*',
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
            error: 'AI analysis timeout. Your logs are complex - try Local Analysis for instant results!' 
          }),
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
        error: `Analysis failed: ${error.message}. Local Analysis is recommended for large files.`,
        timestamp: new Date().toISOString()
      }),
    };
  }
};
