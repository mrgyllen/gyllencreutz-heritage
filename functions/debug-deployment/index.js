const { app } = require('@azure/functions');
const fs = require('fs');
const path = require('path');

app.http('debug-deployment', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'debug-deployment',
    handler: async (request, context) => {
        const logs = [];
        
        try {
            context.log('DEBUG - Deployment debug endpoint called');
            logs.push('DEBUG - Deployment debug endpoint called');
            
            const dataPath = path.resolve(__dirname, '../data/family-members.json');
            logs.push(`__dirname: ${__dirname}`);
            logs.push(`Resolved dataPath: ${dataPath}`);

            const exists = fs.existsSync(dataPath);
            logs.push(`File exists: ${exists}`);

            let size = 0;
            if (exists) {
                try {
                    const raw = fs.readFileSync(dataPath, 'utf8');
                    size = raw.length;
                    logs.push(`Read file, size: ${size}`);

                    const json = JSON.parse(raw);
                    logs.push(`Parsed JSON, records: ${json.length}`);
                } catch (e) {
                    logs.push(`Error reading/parsing file: ${e.message}`);
                }
            }

            return {
                status: 200,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    status: 'OK', 
                    logs: logs,
                    timestamp: new Date().toISOString()
                })
            };
        } catch (err) {
            context.log.error('DEBUG DEPLOYMENT ERROR:', err);
            logs.push(`CRITICAL ERROR: ${err.message}`);
            return {
                status: 500,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    error: err.message,
                    stack: err.stack,
                    logs: logs
                })
            };
        }
    }
});