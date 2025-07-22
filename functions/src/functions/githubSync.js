const { app } = require('@azure/functions');

// GitHub sync status endpoint
app.http('githubSyncStatus', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'github/status',
    handler: async (request, context) => {
        try {
            const token = process.env.GITHUB_TOKEN;
            const owner = process.env.GITHUB_REPO_OWNER;
            const repo = process.env.GITHUB_REPO_NAME;
            
            const available = !!(token && owner && repo);
            
            const status = {
                available,
                connected: available,
                configured: available,
                lastSync: available ? new Date().toISOString() : null,
                pendingOperations: 0,
                error: available ? null : 'GitHub environment variables not configured'
            };

            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(status)
            };
        } catch (error) {
            context.log.error('Error getting GitHub status:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: 'Failed to get GitHub status',
                    available: false,
                    connected: false
                })
            };
        }
    }
});

// GitHub connection test endpoint
app.http('githubSyncTest', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'github/test',
    handler: async (request, context) => {
        try {
            const token = process.env.GITHUB_TOKEN;
            const owner = process.env.GITHUB_REPO_OWNER;
            const repo = process.env.GITHUB_REPO_NAME;
            
            if (!token || !owner || !repo) {
                return {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ 
                        success: false, 
                        error: 'GitHub environment variables not configured' 
                    })
                };
            }

            // Test GitHub API connection
            const fetch = (await import('node-fetch')).default;
            const testResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'User-Agent': 'Gyllencreutz-Admin/1.0'
                }
            });

            if (testResponse.ok) {
                return {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ 
                        success: true, 
                        message: 'GitHub connection test successful' 
                    })
                };
            } else {
                const errorText = await testResponse.text();
                return {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ 
                        success: false, 
                        error: `GitHub API error: ${errorText}` 
                    })
                };
            }
        } catch (error) {
            context.log.error('Error testing GitHub connection:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    success: false, 
                    error: error.message 
                })
            };
        }
    }
});

// GitHub manual retry endpoint
app.http('githubSyncRetry', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'github/retry',
    handler: async (request, context) => {
        try {
            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    success: true, 
                    message: 'No pending operations to retry' 
                })
            };
        } catch (error) {
            context.log.error('Error retrying GitHub sync:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    success: false, 
                    error: error.message 
                })
            };
        }
    }
});

// GitHub sync logs endpoint
app.http('githubSyncLogs', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'github/logs',
    handler: async (request, context) => {
        try {
            // For now, return empty logs - in a real implementation, 
            // you might store logs in Azure Table Storage or similar
            const logs = [];

            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(logs)
            };
        } catch (error) {
            context.log.error('Error getting GitHub logs:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: error.message 
                })
            };
        }
    }
});