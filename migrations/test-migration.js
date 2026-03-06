/**
 * Test script for Evolution API migration
 * This script tests the migration on the development database
 * 
 * Run from project root: node migrations/test-migration.js
 * Or from migrations folder: cd migrations && node test-migration.js
 */

const path = require('path');

// Determine if we're running from migrations folder or project root
const isInMigrationsFolder = __dirname.endsWith('migrations');
const backendPath = isInMigrationsFolder 
  ? path.join(__dirname, '..', 'backend')
  : path.join(__dirname, 'backend');

// Load dependencies from backend
const { createClient } = require(path.join(backendPath, 'node_modules', '@supabase/supabase-js'));
require(path.join(backendPath, 'node_modules', 'dotenv')).config({ 
  path: path.join(backendPath, '.env') 
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testMigration() {
  console.log('🔍 Testing Evolution API migration...\n');

  try {
    // Test 1: Check if clients table exists
    console.log('Test 1: Checking clients table...');
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);
    
    if (clientsError) {
      console.error('❌ Clients table not found:', clientsError.message);
      return;
    }
    console.log('✅ Clients table exists\n');

    // Test 2: Check if import_source column exists
    console.log('Test 2: Checking import_source column...');
    const { data: testClient, error: columnError } = await supabase
      .from('clients')
      .select('import_source')
      .limit(1);
    
    if (columnError) {
      console.log('⚠️  import_source column does not exist yet (migration not applied)');
      console.log('   Run the migration SQL script in Supabase SQL Editor\n');
    } else {
      console.log('✅ import_source column exists\n');
    }

    // Test 3: Check if evolution_api_config table exists
    console.log('Test 3: Checking evolution_api_config table...');
    const { data: configData, error: configError } = await supabase
      .from('evolution_api_config')
      .select('*')
      .limit(1);
    
    if (configError) {
      console.log('⚠️  evolution_api_config table does not exist yet (migration not applied)');
      console.log('   Run the migration SQL script in Supabase SQL Editor\n');
    } else {
      console.log('✅ evolution_api_config table exists\n');
    }

    // Test 4: If migration is applied, test data integrity
    if (!columnError && !configError) {
      console.log('Test 4: Testing data integrity...');
      
      // Check if existing clients have import_source set to 'manual'
      const { data: allClients, error: allClientsError } = await supabase
        .from('clients')
        .select('id, import_source');
      
      if (allClientsError) {
        console.error('❌ Error fetching clients:', allClientsError.message);
      } else {
        const manualCount = allClients.filter(c => c.import_source === 'manual').length;
        const autoCount = allClients.filter(c => c.import_source === 'auto-imported').length;
        const nullCount = allClients.filter(c => !c.import_source).length;
        
        console.log(`   Total clients: ${allClients.length}`);
        console.log(`   Manual: ${manualCount}`);
        console.log(`   Auto-imported: ${autoCount}`);
        console.log(`   Null: ${nullCount}`);
        
        if (nullCount > 0) {
          console.log('⚠️  Some clients have null import_source (migration may need to be re-run)');
        } else {
          console.log('✅ All clients have valid import_source values\n');
        }
      }
    }

    console.log('✅ Migration test completed successfully!');
    console.log('\nNext steps:');
    console.log('1. If migration not applied, run: migrations/add_evolution_api_support.sql');
    console.log('2. Apply the SQL in Supabase Dashboard > SQL Editor');
    console.log('3. Run this test script again to verify\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testMigration();
