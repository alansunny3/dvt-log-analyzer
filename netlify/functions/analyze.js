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
            console.error('❌ ANTHROPIC_API_KEY environment variable not set');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'API configuration error. ANTHROPIC_API_KEY not found.'
                })
            };
        }

        // 🔍 TEST DIFFERENT MODELS IN ORDER OF PREFERENCE
        const modelsToTry = [
            'claude-3-haiku-20240307',        // Cheapest, most basic
            'claude-3-sonnet-20240229',       // Good balance (what we were using)
            'claude-3-opus-20240229',         // Most powerful
            'claude-3-5-sonnet-20241022'      // Latest (if available)
        ];

        console.log('=== DEBUG: Testing Multiple Models ===');
        
        // Try a simple test message first
        const testPrompt = "Hello, this is a test message for DVT log analysis.";
        
        for (const model of modelsToTry) {
            console.log(`🧪 Testing model: ${model}`);
            
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

                console.log(`Model ${model} - Status: ${testResponse.status}`);
                
                if (testResponse.ok) {
                    console.log(`✅ SUCCESS: Model ${model} works!`);
                    
                    // Now make the real request with this working model
                    console.log(`Making full request
