const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '..', 'db', 'db.json');

function setupAdmin() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log('\n❌ Usage: node scripts/setup-admin.js <username> <password> [name]\n');
        process.exit(1);
    }

    const [username, password, nameArg] = args;
    const name = nameArg || 'Admin User';

    let db = { admins: {} };
    if (fs.existsSync(DB_PATH)) {
        try {
            db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        } catch (e) {
            console.error('Error reading db.json, starting fresh', e);
        }
    }

    if (!db.admins) db.admins = {};

    // Check if admin exists
    const existingId = Object.keys(db.admins).find(id => db.admins[id].username === username);
    const id = existingId || `adm-${String(Object.keys(db.admins).length + 1).padStart(4, '0')}`;

    db.admins[id] = {
        id,
        name,
        username,
        password,
        role: 'superadmin'
    };

    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');

    console.log(`\n✅ Admin "${username}" has been ${existingId ? 'updated' : 'created'}.`);
    console.log(`👤 Name: ${name}`);
    console.log(`🔑 Password: ${password.replace(/./g, '*')}\n`);
}

setupAdmin();
