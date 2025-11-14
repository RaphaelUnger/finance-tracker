#!/usr/bin/env node
const { runMigrations } = require('../services/db/helpers');

function main() {
    try {
        runMigrations();
        console.log('Migrations applied');
    } catch (e) {
        console.error('Migration failed:', e && e.message ? e.message : e);
        process.exit(1);
    }
}

main();
