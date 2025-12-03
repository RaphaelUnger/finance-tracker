#!/usr/bin/env node

/**
 * Project Overview Script for Finance Tracker Manual Implementation
 *
 * This script provides a comprehensive overview of the project structure,
 * statistics, and development status.
 */

const fs = require('fs');
const path = require('path');

function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length;
  } catch (error) {
    return 0;
  }
}

function getFileStats(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const stats = {
    files: 0,
    lines: 0,
    directories: 0
  };

  function traverse(currentPath) {
    try {
      const items = fs.readdirSync(currentPath);

      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
          if (!item.startsWith('.') && item !== 'node_modules') {
            stats.directories++;
            traverse(itemPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(item);
          if (extensions.includes(ext)) {
            stats.files++;
            stats.lines += countLines(itemPath);
          }
        }
      }
    } catch (error) {
      // Skip inaccessible directories
    }
  }

  traverse(dir);
  return stats;
}

function generateOverview() {
  const projectRoot = __dirname;

  console.log('🚀 Finance Tracker - Manual AI-Prompting Implementation');
  console.log('=' .repeat(60));
  console.log();

  // Project Statistics
  console.log('📊 PROJECT STATISTICS');
  console.log('-'.repeat(30));

  const srcStats = getFileStats(path.join(projectRoot, 'src'));
  const testStats = getFileStats(path.join(projectRoot, '__tests__'));
  const docsStats = getFileStats(path.join(projectRoot, 'docs'), ['.md']);

  console.log(`Source Code:`);
  console.log(`  Files: ${srcStats.files}`);
  console.log(`  Lines: ${srcStats.lines.toLocaleString()}`);
  console.log(`  Directories: ${srcStats.directories}`);
  console.log();

  console.log(`Tests:`);
  console.log(`  Files: ${testStats.files}`);
  console.log(`  Lines: ${testStats.lines.toLocaleString()}`);
  console.log();

  console.log(`Documentation:`);
  console.log(`  Files: ${docsStats.files}`);
  console.log(`  Lines: ${docsStats.lines.toLocaleString()}`);
  console.log();

  // Architecture Overview
  console.log('🏗️  ARCHITECTURE OVERVIEW');
  console.log('-'.repeat(30));
  console.log('Framework: React Native 0.72+');
  console.log('Language: TypeScript');
  console.log('State Management: Redux Toolkit');
  console.log('Database: SQLite + SQLCipher');
  console.log('Authentication: PIN + Biometric');
  console.log('Testing: Jest + RNTL + Detox');
  console.log('Encryption: AES-256-GCM');
  console.log();

  // Development Status
  console.log('🚧 DEVELOPMENT STATUS');
  console.log('-'.repeat(30));
  console.log('Current Sprint: Sprint 0 - Project Setup');
  console.log('Status: Foundation Complete ✅');
  console.log();

  console.log('Completed:');
  console.log('  ✅ Project structure and configuration');
  console.log('  ✅ TypeScript type definitions');
  console.log('  ✅ Core services (Crypto, Database, Security)');
  console.log('  ✅ Redux store setup');
  console.log('  ✅ Theme system');
  console.log('  ✅ Navigation structure');
  console.log('  ✅ Authentication screens');
  console.log('  ✅ Dashboard UI');
  console.log('  ✅ Comprehensive documentation');
  console.log();

  console.log('Next Sprint Goals:');
  console.log('  🎯 Complete UI navigation');
  console.log('  🎯 Transaction CRUD operations');
  console.log('  🎯 SQLite integration');
  console.log('  🎯 Form validation');
  console.log('  🎯 Unit test implementation');
  console.log();

  // File Structure
  console.log('📁 KEY DIRECTORIES');
  console.log('-'.repeat(30));
  console.log('src/');
  console.log('├── components/     # Reusable UI components');
  console.log('├── screens/        # Screen components');
  console.log('├── navigation/     # Navigation setup');
  console.log('├── services/       # Business logic & data');
  console.log('├── store/          # Redux store & slices');
  console.log('├── hooks/          # Custom React hooks');
  console.log('├── utils/          # Utility functions');
  console.log('├── types/          # TypeScript definitions');
  console.log('└── styles/         # Themes and styling');
  console.log();

  // Security Features
  console.log('🔒 SECURITY FEATURES');
  console.log('-'.repeat(30));
  console.log('• AES-256-GCM encryption at rest');
  console.log('• PBKDF2 key derivation (10k iterations)');
  console.log('• PIN + biometric authentication');
  console.log('• SQLCipher database encryption');
  console.log('• Auto-lock with configurable timeout');
  console.log('• Progressive lockout on failed attempts');
  console.log('• Offline-first (no data transmission)');
  console.log();

  // Commands
  console.log('🚀 QUICK START COMMANDS');
  console.log('-'.repeat(30));
  console.log('npm install           # Install dependencies');
  console.log('npm start             # Start Metro bundler');
  console.log('npm run ios           # Run on iOS');
  console.log('npm run android       # Run on Android');
  console.log('npm test              # Run tests');
  console.log('npm run test:coverage # Test coverage');
  console.log('npm run lint          # Code linting');
  console.log('npm run typecheck     # TypeScript check');
  console.log();

  console.log('📖 For detailed information, see:');
  console.log('   • README.md - Complete setup guide');
  console.log('   • docs/ - Comprehensive documentation');
  console.log('   • docs/iterative-development-plan.md - Sprint details');
  console.log();
}

// Execute if run directly
if (require.main === module) {
  generateOverview();
}

module.exports = { generateOverview, getFileStats, countLines };
