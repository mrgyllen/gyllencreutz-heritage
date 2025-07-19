const { app } = require('@azure/functions');
const fs = require('fs');
const path = require('path');

app.http('debugDeployment', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'debug-deployment',
    handler: async (request, context) => {
        const diagnostics = {
            timestamp: new Date().toISOString(),
            status: 'checking...',
            logs: [],
            paths: {},
            dataInfo: {}
        };
        
        try {
            context.log('DEBUG - Deployment debug endpoint called');
            diagnostics.logs.push('Deployment debug endpoint called');
            
            // Check current directory structure
            diagnostics.paths.cwd = process.cwd();
            diagnostics.paths.dirname = __dirname;
            
            // Try multiple possible data file locations
            const possiblePaths = [
                path.resolve(__dirname, '../../data/family-members.json'),
                path.resolve(process.cwd(), 'data/family-members.json'),
                path.resolve(process.cwd(), 'functions/data/family-members.json')
            ];
            
            for (const testPath of possiblePaths) {
                const exists = fs.existsSync(testPath);
                diagnostics.paths[`exists_${testPath}`] = exists;
                
                if (exists) {
                    try {
                        const stats = fs.statSync(testPath);
                        const raw = fs.readFileSync(testPath, 'utf8');
                        const json = JSON.parse(raw);
                        
                        diagnostics.dataInfo.foundPath = testPath;
                        diagnostics.dataInfo.fileSize = stats.size;
                        diagnostics.dataInfo.recordCount = json.length;
                        diagnostics.dataInfo.firstRecord = json[0] ? json[0].Name : 'No records';
                        diagnostics.status = 'success';
                        break;
                    } catch (e) {
                        diagnostics.logs.push(`Error reading ${testPath}: ${e.message}`);
                    }
                }
            }
            
            if (!diagnostics.dataInfo.foundPath) {
                diagnostics.status = 'data_file_not_found';
                diagnostics.logs.push('No data file found in any expected location');
            }

            return {
                status: 200,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(diagnostics)
            };
        } catch (err) {
            context.log.error('DEBUG DEPLOYMENT ERROR:', err);
            diagnostics.status = 'error';
            diagnostics.error = err.message;
            diagnostics.stack = err.stack;
            
            return {
                status: 500,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(diagnostics)
            };
        }
    }
});