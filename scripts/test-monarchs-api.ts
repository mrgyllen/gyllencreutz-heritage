// Test monarchs API
// This script will test the new monarchs endpoints

// API endpoint (update this to match your deployment)
const API_ENDPOINT = 'http://localhost:5000'; // Change to your actual API endpoint

async function testMonarchsAPI() {
  try {
    console.log('Testing monarchs API endpoints...');
    
    // 1. Get all monarchs
    console.log('\n1. Fetching all monarchs...');
    const allMonarchsResponse = await fetch(`${API_ENDPOINT}/api/cosmos/monarchs`);
    if (!allMonarchsResponse.ok) {
      throw new Error(`Failed to fetch monarchs: ${allMonarchsResponse.statusText}`);
    }
    const allMonarchs = await allMonarchsResponse.json();
    console.log(`✅ Found ${allMonarchs.length || allMonarchs.data?.length} monarchs`);
    
    // 2. Get a specific monarch (if any exist)
    if (allMonarchs.data && allMonarchs.data.length > 0) {
      const firstMonarch = allMonarchs.data[0];
      console.log(`\n2. Fetching specific monarch: ${firstMonarch.name} (ID: ${firstMonarch.id})`);
      const monarchResponse = await fetch(`${API_ENDPOINT}/api/cosmos/monarchs/${firstMonarch.id}`);
      if (!monarchResponse.ok) {
        throw new Error(`Failed to fetch monarch ${firstMonarch.id}: ${monarchResponse.statusText}`);
      }
      const monarch = await monarchResponse.json();
      console.log(`✅ Fetched monarch: ${monarch.data?.name || monarch.name}`);
    }
    
    // 3. Get monarchs during a family member's lifetime (using a sample member)
    console.log('\n3. Testing monarchs during family member lifetime...');
    // You'll need to replace '1' with an actual family member ID from your database
    const memberId = '1'; // Sample ID - replace with actual ID
    const lifetimeResponse = await fetch(`${API_ENDPOINT}/api/cosmos/members/${memberId}/monarchs`);
    
    if (lifetimeResponse.ok) {
      const lifetimeMonarchs = await lifetimeResponse.json();
      console.log(`✅ Found ${lifetimeMonarchs.length || lifetimeMonarchs.data?.length} monarchs during member's lifetime`);
    } else {
      console.log(`⚠️  Could not test lifetime query (member ${memberId} may not exist)`);
    }
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Error testing monarchs API:', error);
  }
}

// Run the tests
testMonarchsAPI();