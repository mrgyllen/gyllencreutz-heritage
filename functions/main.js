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
const tryRequire = (path) => {
  try {
    require(path);
  } catch (err) {
    console.warn(`[functions] Failed to load handler ${path}:`, err && err.message ? err.message : err);
  }
};

// Prefer compiled JS under build/ when present
tryRequire('./build/get-all-monarchs.js');
tryRequire('./build/get-monarch.js');
tryRequire('./build/create-monarch.js');
tryRequire('./build/update-monarch.js');
tryRequire('./build/delete-monarch.js');
tryRequire('./build/import-monarchs-from-json.js');
tryRequire('./build/get-monarchs-during-lifetime.js');
tryRequire('./build/bulk-update-members-with-monarch-ids.js');
tryRequire('./build/bulk-update-members-with-monarch-ids-dry-run.js');