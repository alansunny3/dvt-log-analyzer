// netlify/functions/analyze.js
// MODEL DEBUG VERSION - Test different Claude models
exports.handler = async (event, context) => {
    // Set CORS headers for all responses
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Only allow POST method
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Method not allowed. Use POST.'
            })
        };
    }

    try {
        // Parse request body
        if (!event.body) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Request body is required'
                })
            };
        }

        const { prompt } = JSON.parse(event.body);

        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Valid prompt is required in request body'
                })
            };
        }

        // Check for API key
        const apiKey = process.env.ANTHROPIC_API_KEY;
        
        console.log('=== DEBUG: API Key Check ===');
        console.log('API Key exists:', !!apiKey);
        console.log('API Key length:', apiKey ? apiKey.length : 0);
        console.log('API Key prefix:', apiKey ? apiKey.substring(0, 15) : 'MISSING');

        if (!apiKey) {
            console.error('ANTHROPIC_API_KEY environment variable not set');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'API configuration error. ANTHROPIC_API_KEY not found.'
                })
            };
        }

        // Test different models in order of preference
        const modelsToTry = [
            'claude-3-haiku-20240307',
            'claude-3-sonnet-20240229',
            'claude-3-opus-20240229'
        ];

        console.log('=== DEBUG: Testing Multiple Models ===');
        
        // Try a simple test message first
        const testPrompt = "Hello, this is a test message.";
        
        for (const model of modelsToTry) {
            console.log('Testing model:', model);
            
            try {
                const testResponse = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: model,
                        max_tokens: 50,
                        messages: [{ role: 'user', content: testPrompt }]
                    })
                });

                console.log(`Model ${model} status:`, testResponse.status);
                
                if (testResponse.ok) {
                    console.log('SUCCESS: Model', model, 'works!');
                    
                    // Make the full request with this working model
                    const fullResponse = await fetch('https://api.anthropic.com/v1/messages', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                            'anthropic-version': '2023-06-01'
                        },
                        body: JSON.stringify({
                            model: model,
                            max_tokens: 4000,
                            temperature: 0.3,
                            messages: [{ role: 'user', content: prompt }],
                            system: 'You are an expert Obol Network DVT analyst. Provide clear analysis of DVT logs with relevant Obol documentation links.'
                        })
                    });

                    if (!fullResponse.ok) {
                        const errorText = await fullResponse.text();
                        console.error('Full request failed:', fullResponse.status, errorText);
                        continue;
                    }

                    const aiResponse = await fullResponse.json();
                    
                    if (!aiResponse.content || !aiResponse.content[0] || !aiResponse.content[0].text) {
                        console.error('Invalid response format');
                        continue;
                    }

                    const analysis = aiResponse.content[0].text;
                    
                    const enhancedAnalysis = `🎉 **Success!** Analysis completed using model: **${model}**

${analysis}

---

## 📚 Additional Obol Network Resources

- **[Quick Start Guide](https://docs.obol.org/docs/start/quickstart_group)**
- **[Troubleshooting](https://docs.obol.org/docs/advanced/troubleshooting)**
- **[Monitoring](https://docs.obol.org/docs/advanced/monitoring)**
- **[Charon Config](https://docs.obol.org/docs/charon/intro)**

*🤖 Analysis powered by Claude AI (${model})*`;

                    console.log('Analysis completed successfully with', model);

                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({
                            success: true,
                            analysis: enhancedAnalysis,
                            model: model,
                            timestamp: new Date().toISOString()
                        })
                    };
                    
                } else {
                    const errorText = await testResponse.text();
                    console.log('Model', model, 'failed:', testResponse.status, errorText);
                    
                    try {
                        const errorData = JSON.parse(errorText);
                        console.log('Error type:', errorData.error?.type);
                        console.log('Error message:', errorData.error?.message);
                    } catch (e) {
                        console.log('Could not parse error response');
                    }
                }
                
            } catch (fetchError) {
                console.error('Network error testing', model, ':', fetchError.message);
            }
        }

        // If all models failed
        console.error('ALL MODELS FAILED');
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'All Claude models failed. Please check your API key and account status.',
                modelsAttempted: modelsToTry,
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Function execution error:', error.message);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message || 'Internal server error',
                timestamp: new Date().toISOString()
            })
        };
    }
};
