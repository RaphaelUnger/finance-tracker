#!/usr/bin/env node
// Simple CSV import helper: reads CSV and emits SQL INSERT statements to stdout
// Usage: node scripts/import-csv.js path/to/file.csv > imports.sql

const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
    console.error('Usage: node scripts/import-csv.js path/to/file.csv');
    process.exit(2);
}

const csvPath = process.argv[2];
if (!fs.existsSync(csvPath)) {
    console.error('File not found:', csvPath);
    process.exit(2);
}

const text = fs.readFileSync(csvPath, 'utf8');
const lines = text.split(/\r?\n/).filter(Boolean);
const header = lines.shift().split(',').map(h => h.trim());

// Expected header: id,amount,date,category,notes,merchant,createdAt
for (const line of lines) {
    const cols = line.split(',');
    const obj = {};
    for (let i = 0; i < header.length; i++) obj[header[i]] = (cols[i] || '').trim();

    // convert amount to integer cents
    const amountFloat = parseFloat(obj.amount || '0');
    const cents = Math.round(amountFloat * 100);
    const id = obj.id || 'uuid_' + Math.random().toString(36).slice(2, 10);
    const date = obj.date || new Date().toISOString();
    const category = (obj.category || '').replace(/'/g, "''");
    const notes = (obj.notes || '').replace(/'/g, "''");
    const merchant = (obj.merchant || '').replace(/'/g, "''");
    const createdAt = obj.createdAt || new Date().toISOString();

    const sql = `INSERT INTO transactions (id, amount, date, category, notes, merchant, created_at) VALUES ('${id}', ${cents}, '${date}', '${category}', '${notes}', '${merchant}', '${createdAt}');`;
    console.log(sql);
}
