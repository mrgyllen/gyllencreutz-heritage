const { app } = require('@azure/functions');
const fs = require('fs');
const path = require('path');

app.http('debug-deployment', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'debug-deployment',
    handler: async (request, context) => {
        context.log('DEBUG - Deployment debug endpoint called');
        try {
            const currentDir = __dirname;
            const sharedDir = path.resolve(currentDir, '../shared');
            const dataDir = path.resolve(sharedDir, 'data');
            const jsonFile = path.resolve(dataDir, 'family-members.json');

            const debugInfo = {
                timestamp: new Date().toISOString(),
                environment: {
                    __dirname: currentDir,
                    cwd: process.cwd(),
                    nodeVersion: process.version
                },
                paths: {
                    sharedDir: sharedDir,
                    dataDir: dataDir,
                    jsonFile: jsonFile
                },
                fileSystem: {
                    sharedDirExists: fs.existsSync(sharedDir),
                    dataDirExists: fs.existsSync(dataDir),
                    jsonFileExists: fs.existsSync(jsonFile)
                }
            };

            // Try to list directories
            try {
                debugInfo.fileSystem.functionsRoot = fs.readdirSync(path.resolve(currentDir, '..'));
            } catch (e) {
                debugInfo.fileSystem.functionsRootError = e.message;
            }

            try {
                debugInfo.fileSystem.sharedContents = fs.readdirSync(sharedDir);
            } catch (e) {
                debugInfo.fileSystem.sharedContentsError = e.message;
            }

            try {
                debugInfo.fileSystem.dataContents = fs.readdirSync(dataDir);
            } catch (e) {
                debugInfo.fileSystem.dataContentsError = e.message;
            }

            // Try to read the JSON file
            if (fs.existsSync(jsonFile)) {
                try {
                    const stats = fs.statSync(jsonFile);
                    debugInfo.fileSystem.jsonFileSize = stats.size;
                    debugInfo.fileSystem.jsonFileModified = stats.mtime;
                    
                    const content = fs.readFileSync(jsonFile, 'utf8');
                    debugInfo.fileSystem.jsonFileLength = content.length;
                    debugInfo.fileSystem.jsonFilePreview = content.substring(0, 200) + '...';
                    
                    const parsed = JSON.parse(content);
                    debugInfo.fileSystem.jsonRecordCount = parsed.length;
                } catch (e) {
                    debugInfo.fileSystem.jsonFileError = e.message;
                }
            }

            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(debugInfo, null, 2)
            };
        } catch (error) {
            context.log.error('Debug endpoint error:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    error: error.message,
                    stack: error.stack
                })
            };
        }
    }
});