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
            // Try multiple possible data locations for robust deployment
            const possiblePaths = [
                path.resolve(__dirname, '../data/family-members.json'),
                path.resolve(process.cwd(), 'data/family-members.json'),
                path.resolve(process.cwd(), 'functions/data/family-members.json')
            ];
            
            let dataPath = null;
            let rawData = null;
            
            for (const testPath of possiblePaths) {
                if (fs.existsSync(testPath)) {
                    dataPath = testPath;
                    rawData = fs.readFileSync(testPath, 'utf8');
                    break;
                }
            }
            
            if (!dataPath) {
                throw new Error(`Data file not found. Searched paths: ${possiblePaths.join(', ')}`);
            }
            
            const data = JSON.parse(rawData);
            
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
            
            console.log(`Loaded ${this.familyMembers.length} family members from ${dataPath}`);
        } catch (error) {
            console.error('Error loading family data:', error);
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