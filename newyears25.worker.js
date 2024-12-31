export default {
    async fetch(request, env) {
        const corsHeaders = {
            'Access-Control-Allow-Origin': 'https://newyears25.pages.dev',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        };

        // Handle CORS
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Generate responses (initial or continuation)
        if (request.method === 'POST' && request.url.endsWith('/api/generate')) {
            try {
                const { userInput, selectedModel } = await request.json();
                
                // If selectedModel is provided, generate single response from chosen model
                if (selectedModel) {
                    const response = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${env.OPENAI_API_KEY}`
                        },
                        body: JSON.stringify({
                            model: selectedModel,
                            messages: [
                                {
                                    role: "system",
                                    content: "You are a thoughtful guide helping users explore their goals for 2025. Focus on constructive dialogue and practical steps."
                                },
                                {
                                    role: "user",
                                    content: userInput
                                }
                            ],
                            temperature: 0.7
                        })
                    });

                    const data = await response.json();
                    return new Response(JSON.stringify({
                        response: data.choices[0].message.content
                    }), {
                        headers: {
                            ...corsHeaders,
                            'Content-Type': 'application/json'
                        }
                    });
                }
                
                // Generate initial two responses from different models
                const [response1, response2] = await Promise.all([
                    fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${env.OPENAI_API_KEY}`
                        },
                        body: JSON.stringify({
                            model: "ft:gpt-4o-mini-2024-07-18:personal:sj-v4:ALMRhmup",
                            messages: [
                                {
                                    role: "system",
                                    content: "You are a thoughtful guide helping users explore their goals for 2025. Focus on constructive dialogue and practical steps."
                                },
                                {
                                    role: "user",
                                    content: userInput
                                }
                            ],
                            temperature: 0.7
                        })
                    }),
                    fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${env.OPENAI_API_KEY}`
                        },
                        body: JSON.stringify({
                            model: "ft:gpt-4o-mini-2024-07-18:personal:ft-sj-v5-1:ALdL8xoC",
                            messages: [
                                {
                                    role: "system",
                                    content: "You are a thoughtful guide helping users explore their goals for 2025. Focus on constructive dialogue and practical steps."
                                },
                                {
                                    role: "user",
                                    content: userInput
                                }
                            ],
                            temperature: 0.7
                        })
                    })
                ]);

                const [data1, data2] = await Promise.all([
                    response1.json(),
                    response2.json()
                ]);

                return new Response(JSON.stringify({
                    responses: [
                        {
                            content: data1.choices[0].message.content,
                            model: "ft:gpt-4o-mini-2024-07-18:personal:sj-v4:ALMRhmup"
                        },
                        {
                            content: data2.choices[0].message.content,
                            model: "ft:gpt-4o-mini-2024-07-18:personal:ft-sj-v5-1:ALdL8xoC"
                        }
                    ]
                }), {
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json'
                    }
                });
            } catch (error) {
                console.error('Error generating responses:', error);
                return new Response('Error generating responses', {
                    status: 500,
                    headers: corsHeaders
                });
            }
        }

        // Log regular conversations
        if (request.method === 'POST' && request.url.endsWith('/api/log')) {
            try {
                const data = await request.json();
                const key = `${data.sessionId}-${data.message.timestamp}`;
                
                await env.CONVERSATIONS.put(
                    key,
                    JSON.stringify(data),
                    { expirationTtl: 60 * 60 * 24 * 30 } // 30 days
                );

                console.log(`Logged conversation for session ${data.sessionId}`);
                
                return new Response('Logged', { 
                    status: 200,
                    headers: corsHeaders
                });
            } catch (error) {
                console.error('Error logging conversation:', error);
                return new Response('Error logging data', { 
                    status: 500,
                    headers: corsHeaders
                });
            }
        }

        // Store DPO training data
        if (request.method === 'POST' && request.url.endsWith('/api/dpo')) {
            try {
                const data = await request.json();
                const key = `${data.sessionId}-${Date.now()}`;
                
                // Format for OpenAI's DPO training
                const dpoData = {
                    input: {
                        messages: [{
                            role: "user",
                            content: data.userInput
                        }],
                        tools: [],
                        parallel_tool_calls: true
                    },
                    preferred_output: [{
                        role: "assistant",
                        content: data.chosenResponse
                    }],
                    non_preferred_output: [{
                        role: "assistant",
                        content: data.rejectedResponse
                    }]
                };

                await env.DPO_PAIRS.put(
                    key,
                    JSON.stringify(dpoData),
                    { expirationTtl: 60 * 60 * 24 * 30 } // 30 days
                );

                console.log(`Logged DPO data for session ${data.sessionId}`);
                
                return new Response('DPO data logged', { 
                    status: 200,
                    headers: corsHeaders
                });
            } catch (error) {
                console.error('Error logging DPO data:', error);
                return new Response('Error logging DPO data', { 
                    status: 500,
                    headers: corsHeaders
                });
            }
        }

        // Fetch all data (separate endpoints for each type)
        if (request.method === 'GET') {
            try {
                if (request.url.endsWith('/api/dump/conversations')) {
                    const list = await env.CONVERSATIONS.list();
                    const values = await Promise.all(
                        list.keys.map(key => env.CONVERSATIONS.get(key))
                    );
                    
                    return new Response(JSON.stringify(values), {
                        headers: {
                            ...corsHeaders,
                            'Content-Type': 'application/json'
                        }
                    });
                }
                
                if (request.url.endsWith('/api/dump/dpo')) {
                    const list = await env.DPO_PAIRS.list();
                    const values = await Promise.all(
                        list.keys.map(key => env.DPO_PAIRS.get(key))
                    );
                    
                    return new Response(JSON.stringify(values), {
                        headers: {
                            ...corsHeaders,
                            'Content-Type': 'application/json'
                        }
                    });
                }
            } catch (error) {
                console.error('Error dumping data:', error);
                return new Response('Error fetching data', { 
                    status: 500,
                    headers: corsHeaders
                });
            }
        }

        return new Response('Not found', { 
            status: 404,
            headers: corsHeaders
        });
    }
}; 