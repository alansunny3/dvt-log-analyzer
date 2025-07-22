// Enhanced Claude AI API endpoint for DVT log analysis
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
        if (!apiKey) {
            console.error('ANTHROPIC_API_KEY environment variable not set');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'API configuration error. Please contact administrator.'
                })
            };
        }

        console.log('Calling Claude API for DVT log analysis...');
        console.log('Prompt length:', prompt.length);

        // Call Claude AI API
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 4000,
                temperature: 0.3, // Lower temperature for more focused technical analysis
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
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Claude API error:', response.status, response.statusText, errorText);
            
            let errorMessage = 'Claude AI service error';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error?.message || errorData.message || errorMessage;
            } catch (e) {
                // Use default error message
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }

            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: `Claude API error: ${errorMessage}`
                })
            };
        }

        const aiResponse = await response.json();
        
        // Extract the content from Claude's response
        if (!aiResponse.content || !aiResponse.content[0] || !aiResponse.content[0].text) {
            console.error('Unexpected Claude API response format:', JSON.stringify(aiResponse));
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

        console.log('Claude AI analysis completed successfully');
        console.log('Response length:', enhancedAnalysis.length);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                analysis: enhancedAnalysis,
                timestamp: new Date().toISOString(),
                model: 'claude-3-sonnet-20240229',
                usage: {
                    prompt_tokens: prompt.length / 4, // Rough estimate
                    completion_tokens: analysis.length / 4 // Rough estimate
                }
            })
        };

    } catch (error) {
        console.error('Function execution error:', error);
        
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
