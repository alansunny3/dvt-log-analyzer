// netlify/functions/analyze.js
// DEBUG VERSION - Enhanced Claude AI API endpoint for DVT log analysis
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

        // Check for API key with DEBUG logging
        const apiKey = process.env.ANTHROPIC_API_KEY;
        
        // 🐛 DEBUG: Log detailed API key information
        console.log('=== DEBUG: Environment Variables Check ===');
        console.log('All env vars available:', Object.keys(process.env).filter(key => key.includes('API') || key.includes('CLAUDE') || key.includes('ANTHROPIC')));
        console.log('API Key Debug Info:', {
            hasApiKey: !!apiKey,
            keyExists: apiKey !== undefined,
            keyLength: apiKey ? apiKey.length : 0,
            keyPrefix: apiKey ? apiKey.substring(0, 15) : 'MISSING',
            keyEnding: apiKey ? '...' + apiKey.substring(apiKey.length - 15) : 'MISSING',
            keyType: typeof apiKey,
            isEmpty: apiKey === '',
            isNull: apiKey === null,
            isUndefined: apiKey === undefined
        });
        
        // Also check for alternative key names (in case of confusion)
        const altKeys = {
            CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
            ANTHROPIC_KEY: process.env.ANTHROPIC_KEY,
            CLAUDE_KEY: process.env.CLAUDE_KEY
        };
        console.log('Alternative keys check:', Object.keys(altKeys).map(key => ({
            name: key,
            exists: !!altKeys[key],
            length: altKeys[key] ? altKeys[key].length : 0
        })));

        if (!apiKey) {
            console.error('❌ ANTHROPIC_API_KEY environment variable not set');
            console.error('Available environment variables:', Object.keys(process.env).sort());
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'API configuration error. ANTHROPIC_API_KEY environment variable not found.'
                })
            };
        }

        // 🐛 DEBUG: Validate API key format
        const keyValidation = {
            startsWithCorrectPrefix: apiKey.startsWith('sk-ant-'),
            hasMinimumLength: apiKey.length >= 100, // Anthropic keys are typically 100+ chars
            hasNoSpaces: !apiKey.includes(' '),
            hasNoNewlines: !apiKey.includes('\n') && !apiKey.includes('\r'),
            hasNoQuotes: !apiKey.includes('"') && !apiKey.includes("'")
        };
        
        console.log('=== DEBUG: API Key Validation ===');
        console.log('Key validation results:', keyValidation);
        
        if (!keyValidation.startsWithCorrectPrefix) {
            console.error('❌ API key does not start with sk-ant-');
        }
        if (!keyValidation.hasMinimumLength) {
            console.error('❌ API key is too short (should be 100+ characters)');
        }
        if (!keyValidation.hasNoSpaces || !keyValidation.hasNoNewlines || !keyValidation.hasNoQuotes) {
            console.error('❌ API key contains invalid characters (spaces, newlines, or quotes)');
        }

        console.log('=== DEBUG: Making API Call ===');
        console.log('Calling Claude API for DVT log analysis...');
        console.log('Prompt length:', prompt.length);
        console.log('Using model: claude-3-sonnet-20240229');

        // Call Claude AI API
        const apiUrl = 'https://api.anthropic.com/v1/messages';
        const requestBody = {
            model: 'claude-3-sonnet-20240229',
            max_tokens: 4000,
            temperature: 0.3,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            system: `You are an expert Obol Network DVT (Distributed Validator Technology) analyst with deep knowledge of:

- Obol Network ecosystem and Charon middleware
- DVT consensus mechanisms (QBFT) and cluster coordination
- Ethereum validator operations and MEV-Boost integration
- Distributed validator troubleshooting and optimization
- P2P networking and validator key management

Provide clear, actionable analysis with:
- Specific technical insights relevant to DVT operations
- Relevant Obol documentation links (docs.obol.org)
- Markdown formatting for excellent readability
- Focus on consensus health, Charon status, MEV-Boost performance, cluster coordination
- Practical troubleshooting steps when issues are identified
- Professional tone appropriate for DevOps and validator operators

Always include contextual Obol Network documentation links and keep responses focused on DVT-specific concerns.`
        };

        console.log('Request body prepared, making fetch call...');

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(requestBody)
        });

        console.log('=== DEBUG: API Response ===');
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Claude API error details:');
            console.error('Status:', response.status);
            console.error('Status text:', response.statusText);
            console.error('Error body:', errorText);
            
            let errorMessage = 'Claude AI service error';
            let detailedError = errorText;
            
            try {
                const errorData = JSON.parse(errorText);
                console.error('Parsed error data:', errorData);
                errorMessage = errorData.error?.message || errorData.message || errorMessage;
                detailedError = JSON.stringify(errorData, null, 2);
            } catch (e) {
                console.error('Could not parse error response as JSON');
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }

            // 🐛 DEBUG: Provide detailed error info for debugging
            const debugErrorInfo = {
                httpStatus: response.status,
                statusText: response.statusText,
                errorBody: errorText,
                keyPrefix: apiKey.substring(0, 15),
                keyLength: apiKey.length
            };
            console.error('Full debug error info:', debugErrorInfo);

            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: `Claude API error: ${errorMessage}`,
                    debug: process.env.NODE_ENV === 'development' ? debugErrorInfo : undefined
                })
            };
        }

        const aiResponse = await response.json();
        console.log('✅ Received successful response from Claude API');
        console.log('Response content length:', aiResponse.content?.[0]?.text?.length || 0);
        
        // Extract the content from Claude's response
        if (!aiResponse.content || !aiResponse.content[0] || !aiResponse.content[0].text) {
            console.error('❌ Unexpected Claude API response format:');
            console.error('Response structure:', JSON.stringify(aiResponse, null, 2));
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Invalid response format from Claude AI'
                })
            };
        }

        const analysis = aiResponse.content[0].text;

        // Enhanced analysis with Obol footer
        const enhancedAnalysis = analysis + `

---

## 📚 Additional Obol Network Resources

### 🚀 Essential Documentation:
- **[Quick Start Guide](https://docs.obol.org/docs/start/quickstart_group)** - Get your DVT cluster running
- **[Troubleshooting](https://docs.obol.org/docs/advanced/troubleshooting)** - Common issues and solutions
- **[Monitoring & Health Checks](https://docs.obol.org/docs/advanced/monitoring)** - Keep your cluster healthy
- **[Performance Tuning](https://docs.obol.org/docs/advanced/performance-tuning)** - Optimize your setup

### 🔧 Technical Resources:
- **[Charon Configuration](https://docs.obol.org/docs/charon/intro)** - Middleware setup and config
- **[Networking & P2P](https://docs.obol.org/docs/advanced/networking)** - P2P connectivity guide
- **[MEV-Boost Integration](https://docs.obol.org/docs/advanced/mev-boost)** - DVT with MEV-Boost
- **[Key Management](https://docs.obol.org/docs/advanced/key-management)** - Distributed key security

### 🤝 Community & Support:
- **[Full Documentation](https://docs.obol.org)** - Complete Obol Network docs
- **[Discord Community](https://discord.gg/obol)** - Get help from operators and developers
- **[GitHub Repository](https://github.com/ObolNetwork)** - Open source development

*🤖 Analysis powered by Claude AI with specialized Obol Network expertise*
*🔗 Enhanced DVT Log Analyzer - Built for the Obol Collective*`;

        console.log('✅ Claude AI analysis completed successfully');
        console.log('Final response length:', enhancedAnalysis.length);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                analysis: enhancedAnalysis,
                timestamp: new Date().toISOString(),
                model: 'claude-3-sonnet-20240229',
                usage: {
                    prompt_tokens: Math.ceil(prompt.length / 4), // Rough estimate
                    completion_tokens: Math.ceil(analysis.length / 4) // Rough estimate
                }
            })
        };

    } catch (error) {
        console.error('❌ Function execution error:');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Full error object:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message || 'Internal server error',
                timestamp: new Date().toISOString(),
                debug: process.env.NODE_ENV === 'development' ? {
                    stack: error.stack,
                    name: error.name
                } : undefined
            })
        };
    }
};
