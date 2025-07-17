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
            // Load the family data from the attached assets
            const dataPath = path.join(__dirname, '../../attached_assets/Gyllencreutz_Ancestry_Flat_CLEAN_Final_1752612544769.json');
            const rawData = fs.readFileSync(dataPath, 'utf8');
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