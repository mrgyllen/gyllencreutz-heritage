// Shared storage logic for Azure Functions
// This mirrors the server/storage.ts functionality but in CommonJS format

const fs = require('fs');
const path = require('path');

class FunctionStorage {
    constructor() {
        this.familyMembers = [];
        this.loadData();
    }

    loadData() {
        try {
            // Load the family data from the functions data directory
            // In Azure, __dirname is /functions/family-members, need to go to /functions/shared/data/
            const dataPath = path.resolve(__dirname, '../shared/data', 'family-members.json');
            
            // Debug logging for Azure deployment
            console.log('Storage debug - __dirname:', __dirname);
            console.log('Storage debug - dataPath:', dataPath);
            console.log('Storage debug - file exists:', fs.existsSync(dataPath));
            console.log('Storage debug - Corrected dataPath:', dataPath);
            
            console.log('Attempting to read family-members.json');
            const rawData = fs.readFileSync(dataPath, 'utf8');
            console.log('Successfully read family-members.json, length:', rawData.length);
            
            console.log('Attempting to parse JSON data');
            const data = JSON.parse(rawData);
            console.log('Successfully parsed JSON, records:', data.length);
            
            this.familyMembers = data.map((member, index) => ({
                id: index + 1,
                externalId: member.ID || String(index),
                name: member.Name || '',
                birthDate: member.BirthDate || null,
                deathDate: member.DeathDate || null,
                biologicalSex: member.BiologicalSex || null,
                notes: member.Notes || '',
                father: member.Father || null,
                monarch: member.Monarch || null,
                monarchYears: member.MonarchYears || null,
                successionSon: member.SuccessionSon || null
            }));
        } catch (error) {
            console.error('Error loading family data:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                path: error.path,
                __dirname: __dirname,
                cwd: process.cwd()
            });
            this.familyMembers = [];
        }
    }

    async getAllFamilyMembers() {
        return this.familyMembers;
    }

    async searchFamilyMembers(query) {
        if (!query || query.length < 2) {
            return [];
        }
        
        const lowercaseQuery = query.toLowerCase();
        return this.familyMembers.filter(member => 
            member.name.toLowerCase().includes(lowercaseQuery) ||
            (member.notes && member.notes.toLowerCase().includes(lowercaseQuery))
        );
    }
}

const storage = new FunctionStorage();

module.exports = { storage };