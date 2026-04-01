/**
 * One-time script to create super admin config in Firestore
 * Run this once to set up the initial super admin
 *
 * Usage:
 * 1. Make sure you're logged in: `npx firebase login`
 * 2. Run: `node scripts/setup-super-admin.js`
 */

const { Firestore } = require('@google-cloud/firestore');
const PROJECT_ID = process.env.GCP_PROJECT_ID || 'gen-lang-client-0094031894';

async function setupSuperAdmin() {
  const db = new Firestore({
    projectId: PROJECT_ID,
  });

  const SUPER_ADMIN_EMAIL = 'thanhtd1987@gmail.com';

  try {
    // Path: config (collection) → superAdmins (document) → email (subcollection) → config (document)
    const docRef = db.collection('config').doc('superAdmins').collection(SUPER_ADMIN_EMAIL).doc('config');

    await docRef.set({
      active: true,
      createdAt: new Date().toISOString(),
      notes: 'Initial super admin - created via setup script'
    });

    console.log('✅ Super admin config created successfully!');
    console.log(`📧 Email: ${SUPER_ADMIN_EMAIL}`);
    console.log('🔥 Location: config/superAdmins/' + SUPER_ADMIN_EMAIL + '/config');
    console.log('');
    console.log('Next steps:');
    console.log('1. Deploy Firestore rules: firebase deploy --only firestore:rules');
    console.log('2. Login to the app to verify super admin access');

  } catch (error) {
    console.error('❌ Error creating super admin config:', error);
    process.exit(1);
  }
}

setupSuperAdmin();
