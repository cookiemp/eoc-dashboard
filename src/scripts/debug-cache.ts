import { getFirestore } from '@/lib/firebase-admin';

async function main() {
  console.log('🔍 Checking Firestore cache...');
  const firestore = await getFirestore();
  
  if (!firestore) {
    console.error('❌ Firestore not available!');
    return;
  }

  const doc = await firestore.collection('cache').doc('daily-summary').get();
  
  if (doc.exists) {
    console.log('📄 Cache document exists:');
    console.log(JSON.stringify(doc.data(), null, 2));
    
    console.log('\n🗑️  Deleting cache document...');
    await firestore.collection('cache').doc('daily-summary').delete();
    console.log('✅ Cache document deleted!');
  } else {
    console.log('✅ No cache document found - already clear!');
  }
}

main().catch(console.error);
