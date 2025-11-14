#!/usr/bin/env node
const { SQLiteTransactionRepo } = require('../services/sqliteTransactionRepo');
const { TransactionService } = require('../services/transactionService');

async function main() {
    const repo = new SQLiteTransactionRepo();
    const svc = new TransactionService(repo);
    const args = process.argv.slice(2);
    const cmd = args[0];
    try {
        if (cmd === 'create') {
            const [_, id, amountStr, date, category, merchant, notes] = args;
            if (!id || !amountStr) {
                console.log('Usage: cli.js create <id> <amountCents> [date] [category] [merchant] [notes]');
                process.exit(2);
            }
            const amountCents = Number(amountStr);
            if (!Number.isFinite(amountCents)) {
                console.error('amountCents must be a number');
                process.exit(2);
            }
            const tx = await svc.create({ id, amountCents, date, category, merchant, notes });
            console.log('Created', tx);
        } else if (cmd === 'update') {
            const [_, id, field, value] = args;
            if (!id || !field) {
                console.log('Usage: cli.js update <id> <field> <value>');
                process.exit(2);
            }
            const patch = {};
            if (field === 'amount') {
                const n = Number(value);
                if (!Number.isFinite(n)) { console.error('amount must be a number'); process.exit(2); }
                patch.amountCents = n;
            } else {
                patch[field] = value;
            }
            const updated = await svc.update(id, patch);
            console.log('Updated', updated);
        } else if (cmd === 'delete') {
            const [_, id] = args;
            await svc.delete(id);
            console.log('Deleted', id);
        } else if (cmd === 'list') {
            const all = await svc.list();
            console.log(all);
        } else {
            console.log('Usage: cli.js <create|update|delete|list> ...');
        }
    } catch (e) {
        console.error('Error:', e && e.message ? e.message : e);
        process.exit(1);
    }
}

main();
