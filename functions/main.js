// Azure Functions v4 main entry point
// This file imports all function handlers for deployment

require('./src/functions/familyMembers');
require('./src/functions/familyMembersSearch');
require('./src/functions/familyMembersAdmin');
require('./src/functions/debugDeployment');
require('./src/functions/githubSync');
require('./src/functions/debugData');
require('./src/functions/backups');
require('./src/functions/cosmosDbMembers');
require('./src/functions/cosmosDataImport');

// Monarch API functions
require('./get-all-monarchs');
require('./get-monarch');
require('./create-monarch');
require('./update-monarch');
require('./delete-monarch');
require('./import-monarchs-from-json');
require('./get-monarchs-during-lifetime');
require('./bulk-update-members-with-monarch-ids');
require('./bulk-update-members-with-monarch-ids-dry-run');