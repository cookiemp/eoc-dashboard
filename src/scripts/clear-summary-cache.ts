import { clearSummaryCache } from '@/app/actions';

async function main() {
  console.log('🗑️  Clearing summary cache...');
  await clearSummaryCache();
  console.log('✅ Summary cache cleared! Refresh your browser to generate a new summary.');
}

main().catch(console.error);
