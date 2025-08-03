import fs from 'fs';
import path from 'path';

// Import Swedish monarchs data
const monarchsDataPath = path.join(__dirname, 'swedish_monarchs.json');
const monarchsData = JSON.parse(fs.readFileSync(monarchsDataPath, 'utf-8'));

// API endpoint (update this to match your deployment)
const API_ENDPOINT = 'http://localhost:5000'; // Change to your actual API endpoint

async function importMonarchs() {
  try {
    console.log(`Importing ${monarchsData.length} Swedish monarchs...`);
    
    const response = await fetch(`${API_ENDPOINT}/api/cosmos/monarchs/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ monarchs: monarchsData }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to import monarchs: ${error.message || response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ Monarchs imported successfully:', result.message);
    console.log(`📊 Summary: ${result.data.summary.successful} successful, ${result.data.summary.failed} failed`);
    
    if (result.data.summary.errors && result.data.summary.errors.length > 0) {
      console.log('⚠️ Errors:', result.data.summary.errors);
    }
  } catch (error) {
    console.error('❌ Error importing monarchs:', error);
  }
}

// Run the import
importMonarchs();