/**
 * Test script to verify the monarch bulk update functionality
 * This script tests the actual implementation against real data
 */

async function testBulkUpdate() {
  console.log('Testing monarch bulk update functionality...');
  
  try {
    // Test dry-run first
    console.log('\n1. Testing dry-run mode...');
    const dryRunResponse = await fetch('http://localhost:5000/api/cosmos/members/bulk-update-monarchs?dryRun=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const dryRunResult = await dryRunResponse.json();
    console.log('Dry-run result:', JSON.stringify(dryRunResult, null, 2));
    
    if (dryRunResult.success) {
      console.log('✅ Dry-run completed successfully');
      console.log(`   Total members: ${dryRunResult.data.total}`);
      console.log(`   Processed: ${dryRunResult.data.processed}`);
      console.log(`   Would be updated: ${dryRunResult.data.updated}`);
    } else {
      console.log('❌ Dry-run failed:', dryRunResult.error);
    }
    
    // Test actual update
    console.log('\n2. Testing actual update (press Enter to continue)...');
    // In a real scenario, we'd ask for confirmation here
    // For this test, we'll proceed directly
    
    const updateResponse = await fetch('http://localhost:5000/api/cosmos/members/bulk-update-monarchs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const updateResult = await updateResponse.json();
    console.log('Update result:', JSON.stringify(updateResult, null, 2));
    
    if (updateResult.success) {
      console.log('✅ Bulk update completed successfully');
      console.log(`   Total members: ${updateResult.data.total}`);
      console.log(`   Processed: ${updateResult.data.processed}`);
      console.log(`   Updated: ${updateResult.data.updated}`);
    } else {
      console.log('❌ Bulk update failed:', updateResult.error);
    }
    
    // Test individual member monarch lookup
    console.log('\n3. Testing individual member monarch lookup...');
    // Get a sample family member
    const membersResponse = await fetch('http://localhost:5000/api/cosmos/members');
    const members = await membersResponse.json();
    
    if (members && members.data && members.data.length > 0) {
      const sampleMember = members.data[0];
      console.log(`   Testing with member: ${sampleMember.name} (${sampleMember.born}-${sampleMember.died || 'present'})`);
      
      const monarchsResponse = await fetch(`http://localhost:5000/api/cosmos/members/${sampleMember.id}/monarchs`);
      const monarchsResult = await monarchsResponse.json();
      
      if (monarchsResult.success) {
        console.log('✅ Monarchs lookup successful');
        console.log(`   Found ${monarchsResult.data.length} monarchs during this person's lifetime:`);
        monarchsResult.data.forEach((monarch: any) => {
          console.log(`   - ${monarch.name} (${monarch.reignFrom.split('-')[0]}-${monarch.reignTo.split('-')[0]})`);
        });
      } else {
        console.log('❌ Monarchs lookup failed:', monarchsResult.error);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testBulkUpdate().then(() => {
  console.log('\n🎉 Test completed');
}).catch((error) => {
  console.error('💥 Test failed:', error);
});