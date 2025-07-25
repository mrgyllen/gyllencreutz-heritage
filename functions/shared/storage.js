// Shared storage logic for Azure Functions
// This mirrors the server/storage.ts functionality but in CommonJS format

const fs = require('fs');
const path = require('path');

// GitHub API integration for Azure Functions
class GitHubSyncAzure {
    constructor() {
        this.token = process.env.GITHUB_TOKEN;
        this.owner = process.env.GITHUB_REPO_OWNER;
        this.repo = process.env.GITHUB_REPO_NAME;
        this.enabled = !!(this.token && this.owner && this.repo);
        
        if (this.enabled) {
            console.log('✅ Azure Functions GitHub sync initialized');
        } else {
            console.log('⚠️ Azure Functions GitHub sync disabled - missing environment variables');
        }
    }

    async syncFamilyData(operation, memberData, familyData) {
        if (!this.enabled) {
            console.log('⚠️ GitHub sync skipped - not configured');
            return { success: true, message: 'Sync disabled' };
        }

        try {
            // Import fetch dynamically (Node.js 18+)
            const fetch = (await import('node-fetch')).default;

            // Get current file SHA
            const fileResponse = await fetch(
                `https://api.github.com/repos/${this.owner}/${this.repo}/contents/functions/data/family-members.json`,
                {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'User-Agent': 'Gyllencreutz-Admin/1.0'
                    }
                }
            );

            const fileData = await fileResponse.json();
            
            // Create commit message
            const commitMessage = `[data-only] admin: ${this.generateCommitMessage(operation, memberData)}`;
            
            // Update file content
            const updateResponse = await fetch(
                `https://api.github.com/repos/${this.owner}/${this.repo}/contents/functions/data/family-members.json`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'User-Agent': 'Gyllencreutz-Admin/1.0',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: commitMessage,
                        content: Buffer.from(JSON.stringify(familyData, null, 2)).toString('base64'),
                        sha: fileData.sha
                    })
                }
            );

            if (updateResponse.ok) {
                console.log('✅ Azure Functions: Synced to GitHub successfully');
                return { success: true, message: 'Synced to GitHub' };
            } else {
                const error = await updateResponse.text();
                throw new Error(`GitHub API error: ${error}`);
            }

        } catch (error) {
            console.error('❌ Azure Functions GitHub sync failed:', error);
            return { success: false, error: error.message };
        }
    }

    generateCommitMessage(operation, data) {
        switch (operation) {
            case 'create':
                return `add family member '${data?.name || 'unknown'}' (${data?.externalId || 'no-id'})`;
            case 'update':
                return `update ${data?.name || 'family member'} (${data?.externalId || 'no-id'})`;
            case 'delete':
                return `delete family member '${data?.name || 'unknown'}' (${data?.externalId || 'no-id'})`;
            case 'bulk':
                return `bulk update ${data?.count || 'multiple'} family members`;
            default:
                return `${operation} family data`;
        }
    }
}

// Initialize GitHub sync for Azure Functions
const gitHubSync = new GitHubSyncAzure();

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
                born: member.Born || null,
                died: member.Died || null,
                biologicalSex: member.BiologicalSex || null,
                notes: member.Notes || '',
                father: member.Father || null,
                ageAtDeath: member.AgeAtDeath || null,
                diedYoung: member.DiedYoung || false,
                isSuccessionSon: member.IsSuccessionSon || false,
                hasMaleChildren: member.HasMaleChildren || false,
                nobleBranch: member.NobleBranch || null,
                monarchDuringLife: (() => {
                    try {
                        if (typeof member.MonarchDuringLife === 'string') {
                            // Handle Python-style array format with single quotes
                            const cleanedString = member.MonarchDuringLife.replace(/'/g, '"');
                            return JSON.parse(cleanedString);
                        } else if (Array.isArray(member.MonarchDuringLife)) {
                            return member.MonarchDuringLife;
                        }
                        return [];
                    } catch (e) {
                        console.log('Failed to parse MonarchDuringLife for', member.Name, ':', member.MonarchDuringLife);
                        return [];
                    }
                })()
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

    async getFamilyMember(externalId) {
        return this.familyMembers.find(m => m.externalId === externalId) || null;
    }

    async createFamilyMember(memberData) {
        // Generate new ID
        const maxId = this.familyMembers.reduce((max, member) => Math.max(max, member.id), 0);
        const newId = maxId + 1;
        
        const newMember = {
            id: newId,
            externalId: memberData.externalId,
            name: memberData.name || '',
            born: memberData.born || null,
            died: memberData.died || null,
            biologicalSex: memberData.biologicalSex || null,
            notes: memberData.notes || '',
            father: memberData.father || null,
            ageAtDeath: memberData.ageAtDeath || null,
            diedYoung: memberData.diedYoung || false,
            isSuccessionSon: memberData.isSuccessionSon || false,
            hasMaleChildren: memberData.hasMaleChildren || false,
            nobleBranch: memberData.nobleBranch || null,
            monarchDuringLife: memberData.monarchDuringLife || []
        };
        
        this.familyMembers.push(newMember);
        await this.persistToFile();
        
        // Sync to GitHub if available
        try {
            await gitHubSync.syncFamilyData('create', newMember, this.familyMembers);
        } catch (error) {
            console.error('❌ GitHub sync failed for create:', error);
            // Don't throw error - local create succeeded
        }
        
        return newMember;
    }

    async updateFamilyMember(externalId, updateData) {
        const memberIndex = this.familyMembers.findIndex(m => m.externalId === externalId);
        if (memberIndex === -1) {
            return null;
        }
        
        const existingMember = this.familyMembers[memberIndex];
        const updatedMember = {
            ...existingMember,
            ...updateData,
            id: existingMember.id, // Preserve original ID
            externalId: existingMember.externalId // Preserve original externalId
        };
        
        this.familyMembers[memberIndex] = updatedMember;
        await this.persistToFile();
        
        // Sync to GitHub if available
        try {
            await gitHubSync.syncFamilyData('update', updatedMember, this.familyMembers);
        } catch (error) {
            console.error('❌ GitHub sync failed for update:', error);
            // Don't throw error - local update succeeded
        }
        
        return updatedMember;
    }

    async deleteFamilyMember(externalId) {
        const memberIndex = this.familyMembers.findIndex(m => m.externalId === externalId);
        if (memberIndex === -1) {
            return null;
        }
        
        const deletedMember = this.familyMembers[memberIndex];
        this.familyMembers.splice(memberIndex, 1);
        await this.persistToFile();
        
        // Sync to GitHub if available
        try {
            await gitHubSync.syncFamilyData('delete', deletedMember, this.familyMembers);
        } catch (error) {
            console.error('❌ GitHub sync failed for delete:', error);
            // Don't throw error - local delete succeeded
        }
        
        return deletedMember;
    }

    async bulkUpdateFamilyMembers(members) {
        // Create backup before bulk operation
        await this.createBackup();
        
        let updated = 0;
        let created = 0;
        
        for (const memberData of members) {
            const existingIndex = this.familyMembers.findIndex(m => m.externalId === memberData.externalId);
            
            if (existingIndex !== -1) {
                // Update existing member
                const existingMember = this.familyMembers[existingIndex];
                const updatedMember = {
                    ...existingMember,
                    ...memberData,
                    id: existingMember.id // Preserve original ID
                };
                this.familyMembers[existingIndex] = updatedMember;
                updated++;
            } else {
                // Create new member
                const maxId = this.familyMembers.reduce((max, member) => Math.max(max, member.id), 0);
                const newMember = {
                    id: maxId + 1,
                    externalId: memberData.externalId,
                    name: memberData.name || '',
                    born: memberData.born || null,
                    died: memberData.died || null,
                    biologicalSex: memberData.biologicalSex || null,
                    notes: memberData.notes || '',
                    father: memberData.father || null,
                    ageAtDeath: memberData.ageAtDeath || null,
                    diedYoung: memberData.diedYoung || false,
                    isSuccessionSon: memberData.isSuccessionSon || false,
                    hasMaleChildren: memberData.hasMaleChildren || false,
                    nobleBranch: memberData.nobleBranch || null,
                    monarchDuringLife: memberData.monarchDuringLife || []
                };
                this.familyMembers.push(newMember);
                created++;
            }
        }
        
        await this.persistToFile();
        
        // Sync to GitHub if available
        try {
            await gitHubSync.syncFamilyData('bulk', { count: updated + created }, this.familyMembers);
        } catch (error) {
            console.error('❌ GitHub sync failed for bulk update:', error);
            // Don't throw error - local bulk update succeeded
        }
        
        return { updated, created };
    }

    async persistToFile() {
        try {
            // In Azure Functions, we need to write to the correct data path
            const fs = require('fs');
            const path = require('path');
            
            // Try multiple possible paths for data persistence
            const possiblePaths = [
                path.resolve(__dirname, '../data/family-members.json'),
                path.resolve(process.cwd(), 'data/family-members.json'),
                path.resolve(process.cwd(), 'functions/data/family-members.json')
            ];
            
            let dataPath = null;
            for (const testPath of possiblePaths) {
                const dir = path.dirname(testPath);
                if (fs.existsSync(dir)) {
                    dataPath = testPath;
                    break;
                }
            }
            
            if (!dataPath) {
                throw new Error('Could not find data directory for persistence');
            }
            
            // Convert family members back to original JSON format
            const familyArray = this.familyMembers.map(member => ({
                ID: member.externalId,
                Name: member.name,
                Born: member.born,
                Died: member.died,
                BiologicalSex: member.biologicalSex,
                Notes: member.notes,
                Father: member.father,
                AgeAtDeath: member.ageAtDeath,
                DiedYoung: member.diedYoung,
                IsSuccessionSon: member.isSuccessionSon,
                HasMaleChildren: member.hasMaleChildren,
                NobleBranch: member.nobleBranch,
                MonarchDuringLife: JSON.stringify(member.monarchDuringLife || [])
            }));
            
            const jsonData = JSON.stringify(familyArray, null, 2);
            fs.writeFileSync(dataPath, jsonData, 'utf8');
            
            console.log(`Persisted ${familyArray.length} family members to ${dataPath}`);
        } catch (error) {
            console.error('Error persisting data to file:', error);
            throw new Error('Failed to persist data changes');
        }
    }

    async createBackup() {
        try {
            const fs = require('fs');
            const path = require('path');
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.resolve(__dirname, `../data/backup_${timestamp}.json`);
            
            // Create backup of current data
            const familyArray = this.familyMembers.map(member => ({
                ID: member.externalId,
                Name: member.name,
                Born: member.born,
                Died: member.died,
                BiologicalSex: member.biologicalSex,
                Notes: member.notes,
                Father: member.father,
                AgeAtDeath: member.ageAtDeath,
                DiedYoung: member.diedYoung,
                IsSuccessionSon: member.isSuccessionSon,
                HasMaleChildren: member.hasMaleChildren,
                NobleBranch: member.nobleBranch,
                MonarchDuringLife: JSON.stringify(member.monarchDuringLife || [])
            }));
            
            const jsonData = JSON.stringify(familyArray, null, 2);
            fs.writeFileSync(backupPath, jsonData, 'utf8');
            
            console.log(`Created backup at ${backupPath}`);
        } catch (error) {
            console.error('Error creating backup:', error);
            // Don't throw error for backup failure, just log it
        }
    }
}

const storage = new FunctionStorage();

module.exports = { storage };