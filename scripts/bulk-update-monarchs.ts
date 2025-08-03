// Bulk update family members with monarch IDs
// This script will update all family members to use the new monarchIds field

// API endpoint (update this to match your deployment)
const API_ENDPOINT = 'http://localhost:5000'; // Change to your actual API endpoint

async function bulkUpdateMembersWithMonarchIds() {
  try {
    console.log('Starting bulk update of family members with monarch IDs...');
    
    const response = await fetch(`${API_ENDPOINT}/api/cosmos/members/bulk-update-monarchs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to bulk update members: ${error.message || response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ Bulk update completed successfully:', result.message);
    console.log(`📊 Summary: ${result.data.updated} of ${result.data.total} family members updated`);
  } catch (error) {
    console.error('❌ Error during bulk update:', error);
  }
}

// Run the bulk update
bulkUpdateMembersWithMonarchIds();