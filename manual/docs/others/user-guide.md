# Finance Tracker - User Guide

**Welcome to Finance Tracker!** Your privacy-first personal finance management app.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Security & Privacy](#security--privacy)  
3. [Managing Transactions](#managing-transactions)
4. [Receipt Scanning](#receipt-scanning)
5. [Categories & Organization](#categories--organization)
6. [Recurring Transactions](#recurring-transactions)
7. [Reports & Analytics](#reports--analytics)
8. [Data Management](#data-management)
9. [Settings & Customization](#settings--customization)
10. [Troubleshooting](#troubleshooting)
11. [Privacy & Security](#privacy--security-1)

---

## Getting Started

### First Launch

When you first open Finance Tracker, you'll be guided through a quick setup:

1. **Welcome Screen**: Introduction to the app's privacy-first approach
2. **PIN Setup**: Create a 4-6 digit PIN for app security
3. **Biometric Authentication**: Optionally enable fingerprint/Face ID (recommended)
4. **Default Categories**: The app creates standard expense and income categories
5. **Dashboard**: You're ready to start tracking your finances!

### Main Navigation

The app has four main sections accessible from the bottom navigation:

- **📊 Dashboard**: Overview of your finances with quick actions
- **💰 Transactions**: View and manage all your transactions
- **📈 Reports**: Analytics, charts, and detailed financial insights  
- **⚙️ Settings**: App preferences, security, and data management

---

## Security & Privacy

### Your Privacy is Protected

Finance Tracker is designed with privacy as the top priority:

- ✅ **No Account Required**: No sign-up, login, or personal information needed
- ✅ **Local Storage Only**: All data stays on your device, never sent to servers
- ✅ **Bank-Grade Encryption**: AES-256 encryption protects your data
- ✅ **No Tracking**: We don't track you or collect analytics
- ✅ **Open Source**: Transparent, auditable code

### Security Features

#### PIN Protection
- Required on every app launch
- 4-6 digit PIN (you choose the length)
- Auto-lock after 5 minutes of inactivity (customizable)
- Protection against brute force attempts

#### Biometric Authentication  
- Fingerprint unlock (Android)
- Touch ID / Face ID (iOS)
- PIN fallback always available
- Secure hardware-based authentication

#### Data Protection
- Database encrypted with AES-256-GCM
- Sensitive data cleared from memory after use
- No screenshots allowed in recent apps
- Secure deletion of removed data

---

## Managing Transactions

### Adding Transactions

#### Quick Add
1. Tap the **+** button on the Dashboard
2. Choose **Income** or **Expense**
3. Enter the amount and description
4. Select a category
5. Tap **Save**

#### Detailed Entry
- **Amount**: Required field, supports decimals
- **Description**: What was this transaction for?
- **Category**: Choose from your categories or create new ones
- **Date**: Defaults to today, tap to change
- **Notes**: Optional additional details

#### Tips for Better Organization
- Use descriptive but concise descriptions
- Add relevant details in notes (receipt numbers, locations)
- Choose the most specific category available
- Double-check amounts for accuracy

### Viewing Transactions

#### Transaction List
- **All Transactions**: Complete chronological list
- **Search**: Find transactions by description or notes
- **Filter**: By category, date range, or amount
- **Sort**: By date, amount, or description

#### Transaction Details
Tap any transaction to view:
- Complete transaction information
- Edit or delete options
- Associated receipt image (if available)
- Category and tags

### Editing and Deleting

#### Edit Transaction
1. Tap on the transaction
2. Select **Edit**
3. Modify any field
4. Tap **Save Changes**

#### Delete Transaction
1. Tap on the transaction  
2. Select **Delete**
3. Confirm the deletion
4. The transaction is permanently removed

> **Note**: Deleted transactions cannot be recovered, so be careful!

---

## Receipt Scanning

### How OCR Scanning Works

Finance Tracker uses OCR (Optical Character Recognition) to automatically extract data from receipt photos:

1. **Take a Photo**: Use the in-app camera to photograph your receipt
2. **Processing**: The app analyzes the image locally (never uploaded anywhere)
3. **Data Extraction**: Amount, date, and merchant information are identified
4. **Review & Confirm**: Check the extracted data and make corrections if needed
5. **Save**: The transaction is created with the original receipt attached

### Getting the Best Scanning Results

#### Photo Tips
- **Good Lighting**: Natural light works best, avoid shadows
- **Flat Surface**: Place receipt on a flat, contrasting background
- **Full Receipt**: Capture the entire receipt, including top and bottom
- **Steady Hands**: Keep the camera still to avoid blurry photos
- **Clean Lens**: Make sure your camera lens is clean

#### Optimal Receipt Conditions
- Recent receipts (text not faded)
- Thermal receipts work well if not expired
- High contrast between text and background
- Minimal creases or wrinkles
- Clear, printed text (not handwritten)

### Merchant Recognition

The app includes an intelligent merchant recognition system:

- **500+ German Merchants**: Automatically recognizes major retailers, restaurants, and services
- **Auto-Categorization**: Known merchants are automatically assigned to appropriate categories
- **Learning System**: The app learns from your corrections and improves over time

#### Supported Merchants Include
- **Grocery**: REWE, EDEKA, ALDI, LIDL, and more
- **Gas Stations**: Shell, ARAL, Esso, and others
- **Restaurants**: McDonald's, Burger King, local chains
- **Pharmacies**: DM, Rossmann, Apotheken
- **Online**: Amazon, eBay, PayPal transactions

### Manual Review Process

After scanning, always review the extracted data:

1. **Check Amount**: Verify the total amount is correct
2. **Verify Date**: Ensure the date matches the receipt
3. **Confirm Merchant**: Check if the merchant name is accurate
4. **Category**: Verify or change the suggested category
5. **Add Notes**: Include any additional details

### Receipt Archive

All scanned receipts are saved in the app:
- **Original Images**: Full-resolution photos are stored locally
- **Search Receipts**: Find receipts by merchant, amount, or date
- **Export Archive**: Include receipt images in data exports
- **Storage Management**: Monitor and clean up old receipts

---

## Categories & Organization

### Understanding Categories

Categories help you organize and analyze your spending:

- **Income Categories**: Salary, freelancing, investments, gifts, etc.
- **Expense Categories**: Food, transport, housing, entertainment, etc.
- **Custom Categories**: Create your own for specific needs

### Default Categories

The app comes with these categories pre-installed:

#### Expense Categories
- 🛒 **Lebensmittel** (Groceries): Food and household items
- 🚗 **Transport**: Gas, public transport, parking, car maintenance  
- 🏠 **Wohnen** (Housing): Rent, utilities, insurance, repairs
- 🎬 **Unterhaltung** (Entertainment): Movies, concerts, hobbies, dining out
- 🏥 **Gesundheit** (Health): Medical, pharmacy, fitness, healthcare
- 👕 **Kleidung** (Clothing): Clothes, shoes, accessories
- 📚 **Bildung** (Education): Books, courses, training, school supplies
- 💼 **Geschäft** (Business): Work-related expenses, equipment
- 🎁 **Geschenke** (Gifts): Presents, donations, charity
- 📱 **Technologie** (Technology): Electronics, software, subscriptions
- ✈️ **Reisen** (Travel): Vacation, flights, hotels, travel expenses
- 🔧 **Sonstiges** (Other): Miscellaneous expenses

#### Income Categories  
- 💰 **Gehalt** (Salary): Regular employment income
- 💼 **Freelancing**: Contract and freelance work
- 📈 **Investments**: Dividends, capital gains, interest
- 🎁 **Geschenke** (Gifts): Money gifts, bonuses
- 💱 **Sonstiges** (Other): Miscellaneous income

### Creating Custom Categories

To create a new category:

1. Go to **Settings** → **Categories**
2. Tap **Add New Category**
3. Choose category type (Income or Expense)
4. Enter category name
5. Select an icon and color
6. Tap **Save**

### Managing Categories

#### Edit Categories
- Change name, icon, or color
- Modify category type (with caution)
- Add notes or descriptions

#### Delete Categories
- Only unused categories can be deleted
- Transactions must be recategorized first
- Default categories cannot be deleted

### Category Best Practices

- **Be Specific**: Use detailed categories that match your spending habits
- **Stay Consistent**: Use the same category for similar transactions
- **Review Regularly**: Add new categories as your life changes
- **Use Colors Wisely**: Choose colors that make sense (green for income, red for bills)

---

## Recurring Transactions

### What Are Recurring Transactions?

Recurring transactions are regular income or expenses that happen automatically:

- **Salary**: Monthly or bi-weekly paychecks
- **Bills**: Rent, utilities, insurance, subscriptions
- **Investments**: Regular investment contributions
- **Savings**: Automatic transfers to savings accounts

### Setting Up Recurring Transactions

1. Navigate to **Transactions** → **Recurring**
2. Tap **Add New Recurring Transaction**
3. Fill in transaction details:
   - Amount and description
   - Category
   - Notes (optional)
4. Set the recurrence pattern:
   - **Daily**: Every day, weekdays only, or every X days
   - **Weekly**: Specific days of the week
   - **Monthly**: Specific date or end of month
   - **Yearly**: Annual transactions like insurance
5. Choose start date and end conditions
6. Tap **Save**

### Recurrence Patterns

#### Daily Options
- Every day
- Weekdays only (Monday-Friday)
- Every X days (2, 3, 5, etc.)

#### Weekly Options
- Specific days (Monday, Wednesday, Friday)
- Every week, every 2 weeks, etc.
- End of week options

#### Monthly Options
- Specific date (15th of each month)
- End of month (last day)
- Last business day
- Every X months

#### Yearly Options
- Specific date (birthday, anniversary)
- Tax deadlines
- Insurance renewals

### Managing Recurring Transactions

#### Active Recurring Transactions
- View all active recurring transactions
- See next execution date
- Modify frequency or amounts
- Pause temporarily without deleting

#### Execution History
- See all transactions created from recurrence
- Verify amounts and dates
- Edit individual generated transactions

#### Manual Execution
- Execute a recurring transaction early
- Skip a scheduled execution
- Create one-off transactions from template

### Notifications

Get notified when recurring transactions are created:
- **Immediate**: Notification when transaction is added
- **Daily Summary**: Daily recap of recurring transactions
- **Weekly Overview**: Summary of upcoming recurring transactions

---

## Reports & Analytics

### Dashboard Overview

The Dashboard provides a quick snapshot of your finances:

#### Current Month Summary
- **Total Income**: All income for the current month
- **Total Expenses**: All expenses for the current month  
- **Net Amount**: Income minus expenses (your savings/deficit)
- **Transaction Count**: Number of transactions this month

#### Quick Stats
- **Largest Expense**: Biggest single expense this month
- **Most Used Category**: Your most frequent spending category
- **Average Transaction**: Mean transaction amount
- **Budget Status**: How you're tracking against any set budgets

### Advanced Reports

Access detailed reports from the **Reports** tab:

#### Monthly Reports
- Income vs. expenses comparison
- Month-over-month trends
- Category breakdowns with percentages
- Daily spending patterns

#### Category Analysis
- **Spending by Category**: Pie chart of expense categories
- **Category Trends**: How category spending changes over time
- **Top Categories**: Your highest spending categories
- **Category Comparison**: Compare different time periods

#### Time-Based Analysis
- **Weekly Trends**: Spending patterns by day of week
- **Monthly Patterns**: Seasonal spending changes
- **Yearly Overview**: Annual financial summary
- **Custom Date Ranges**: Analyze any specific time period

### Interactive Charts

All charts are interactive and provide detailed insights:

#### Chart Types
- **Line Charts**: Track trends over time
- **Bar Charts**: Compare different categories or time periods
- **Pie Charts**: Show proportion of spending by category
- **Area Charts**: Visualize cumulative spending
- **Stacked Charts**: Compare multiple data series

#### Chart Interactions
- **Zoom**: Pinch to zoom into specific time periods
- **Pan**: Scroll through different date ranges
- **Tap for Details**: Tap chart elements for specific values
- **Export**: Save charts as images for sharing

### Spending Insights

The app provides intelligent insights about your spending:

#### Automatic Analysis
- **Spending Trends**: Whether you're spending more or less
- **Category Alerts**: Unusual spending in specific categories
- **Budget Warnings**: When you're approaching spending limits
- **Savings Opportunities**: Categories where you could save money

#### Predictive Analytics
- **Future Spending**: Predictions based on historical data
- **Budget Projections**: How current spending affects monthly budget
- **Seasonal Adjustments**: Account for seasonal spending variations

### Custom Reports

Create personalized reports for your specific needs:

1. **Select Time Range**: Choose start and end dates
2. **Filter Categories**: Include only relevant categories
3. **Choose Metrics**: Select what to analyze
4. **Pick Visualization**: Choose appropriate chart types
5. **Save Template**: Reuse reports in the future

---

## Data Management

### Export Options

Finance Tracker offers multiple ways to export your data:

#### CSV Export
- **All Transactions**: Complete transaction history
- **Date Range**: Specific time periods
- **Category Filter**: Only certain categories
- **Compatible**: Works with Excel, Google Sheets, and other finance apps

#### PDF Reports
- **Formatted Reports**: Professional-looking reports with charts
- **Custom Date Ranges**: Any time period you choose
- **Category Breakdowns**: Detailed analysis by category
- **Print Ready**: Formatted for printing

#### JSON Backup
- **Complete Data**: All transactions, categories, settings, and receipts
- **Encrypted**: Password-protected backup files
- **Restore Capable**: Can restore complete app state

### Import Options

#### CSV Import
- **Bank Statements**: Import transactions from your bank
- **Other Apps**: Migrate from other finance tracking apps
- **Spreadsheets**: Import from Excel or Google Sheets

#### Supported CSV Formats
- **Standard Format**: Date, Amount, Description, Category
- **Bank Formats**: Most major German banks supported
- **Custom Mapping**: Map your CSV columns to app fields

### Backup and Restore

#### Creating Backups
1. Go to **Settings** → **Data Management**
2. Select **Create Backup**
3. Choose backup options:
   - Include receipt images
   - Password protection
   - Compression level
4. Choose save location
5. Backup is created and encrypted

#### Restoring Backups
1. **Settings** → **Data Management** → **Restore Backup**
2. Select backup file
3. Enter backup password
4. Choose restore options:
   - Replace all data
   - Merge with existing data
   - Preview before restoring
5. Confirm restore operation

### Data Storage Information

#### What's Stored Locally
- All transaction data
- Categories and customizations
- Receipt images
- App settings and preferences
- Recurring transaction templates

#### Storage Usage
- **Typical Usage**: 10-50 MB for most users
- **With Receipts**: 100-500 MB depending on photo count
- **Large Datasets**: Up to several GB for heavy users

#### Storage Management
- **View Usage**: See how much space the app uses
- **Clean Old Receipts**: Remove receipt images older than X months
- **Optimize Database**: Compress and optimize data storage
- **Archive Old Data**: Move old transactions to archive files

---

## Settings & Customization

### General Settings

#### Language & Region
- **Language**: German (Deutsch) or English
- **Currency**: EUR (Euro) or other currencies
- **Date Format**: DD.MM.YYYY, MM/DD/YYYY, or YYYY-MM-DD
- **Number Format**: European (1.234,56) or US (1,234.56)

#### Theme & Appearance
- **Theme**: Light, Dark, or Automatic (follows system)
- **Color Scheme**: Choose accent colors
- **Font Size**: Adjust text size for readability
- **High Contrast**: Enhanced visibility option

### Security Settings

#### Authentication
- **PIN Settings**: Change PIN, require on launch
- **Biometric Authentication**: Enable/disable fingerprint or Face ID
- **Auto-Lock**: Set timeout period (1-10 minutes or never)
- **Lock on Background**: Require PIN when returning from background

#### Privacy Controls
- **Analytics**: Choose whether to send anonymous usage data
- **Crash Reports**: Help improve the app with crash information
- **Screenshot Protection**: Prevent screenshots in sensitive areas

### Transaction Settings

#### Default Values
- **Default Category**: Set default category for new transactions
- **Quick Amounts**: Set common amounts for fast entry
- **Auto-Fill**: Enable smart suggestions for descriptions

#### OCR Settings
- **OCR Language**: Primary language for text recognition
- **Auto-Save Receipts**: Automatically save receipt images
- **Image Quality**: Balance between quality and storage space
- **Merchant Learning**: Enable/disable merchant recognition learning

### Notification Settings

#### Transaction Notifications
- **New Transactions**: Notify when transactions are added
- **Recurring Transactions**: Alert when recurring transactions execute
- **Budget Alerts**: Warn when approaching spending limits

#### Report Notifications
- **Weekly Summary**: Weekly spending summary
- **Monthly Report**: End-of-month financial overview
- **Unusual Activity**: Alert for unusual spending patterns

---

## Troubleshooting

### Common Issues

#### App Won't Start
**Symptoms**: App crashes immediately after opening
**Solutions**:
1. Restart your phone
2. Clear app cache (Android Settings → Apps → Finance Tracker → Storage)
3. Update to the latest app version
4. Free up device storage space
5. Reinstall the app (backup data first!)

#### Forgot PIN
**Symptoms**: Can't remember your PIN
**Solutions**:
1. **If biometric is enabled**: Use fingerprint/Face ID to unlock
2. **No biometric access**: Unfortunately, there's no PIN recovery for security reasons
3. **Last resort**: Delete and reinstall app (all data will be lost)
4. **Prevention**: Set up biometric authentication as backup

#### OCR Not Working
**Symptoms**: Receipt scanning doesn't extract text
**Solutions**:
1. Check camera permission in phone settings
2. Ensure good lighting when taking photos
3. Clean camera lens
4. Try different angle or distance
5. Use manual entry as backup
6. Update app to latest version

#### Slow Performance
**Symptoms**: App is laggy or slow to respond
**Solutions**:
1. Check available storage space (need at least 1GB free)
2. Restart the app completely
3. Clear app cache
4. Reduce number of stored receipts
5. Archive old transactions
6. Restart your phone

#### Data Sync Issues
**Symptoms**: Transactions seem to be missing or duplicated
**Solutions**:
1. Check if you're viewing the correct date range
2. Verify filter settings aren't hiding transactions
3. Force close and restart the app
4. Create backup and restore if problem persists

### Performance Optimization

#### Keep the App Running Smoothly
- **Regular Cleanup**: Delete old receipt images monthly
- **Archive Data**: Move old transactions to backup files
- **Update Regularly**: Install app updates promptly
- **Monitor Storage**: Keep device storage above 10% free

#### Manage Large Datasets
- **Archive Strategy**: Keep current year active, archive previous years
- **Receipt Management**: Only keep receipt images for tax-relevant transactions
- **Category Cleanup**: Remove unused categories periodically
- **Export Regularly**: Export data monthly for additional backup

### Getting Help

#### In-App Help
- **Help Section**: Settings → Help for searchable help articles
- **Tooltips**: Tap (?) icons throughout the app for context help
- **Guided Tours**: First-time user tutorials for each feature

#### Contact Support
While Finance Tracker is designed to be self-sufficient, you can:
- **Check Documentation**: Review this user guide
- **Community Forums**: Join user discussion groups
- **Bug Reports**: Report issues through app feedback system

---

## Privacy & Security

### Your Data Rights

#### What We DON'T Do
- ❌ **No Data Collection**: We don't collect your personal financial data
- ❌ **No Cloud Storage**: Your data never leaves your device
- ❌ **No Tracking**: We don't track your usage or behavior
- ❌ **No Third Parties**: We don't share data with anyone
- ❌ **No Advertising**: No ads based on your financial information

#### What We DO
- ✅ **Local Storage**: All data stays on your device
- ✅ **Strong Encryption**: Military-grade AES-256 encryption
- ✅ **Your Control**: You decide what to backup and export
- ✅ **Open Source**: Code is public and auditable
- ✅ **Privacy by Design**: Built with privacy as the foundation

### Security Best Practices

#### Strong Authentication
- Use a strong, unique PIN
- Enable biometric authentication
- Set auto-lock to 5 minutes or less
- Never share your PIN with others

#### Regular Backups
- Create encrypted backups monthly
- Store backups in secure locations
- Test restore process occasionally
- Keep multiple backup copies

#### Device Security
- Keep your phone updated with latest OS
- Use strong device passcode/pattern
- Avoid public WiFi for financial activities
- Install apps only from official app stores

#### Data Protection
- Regularly review and clean old data
- Be cautious with exported files
- Securely delete old backup files
- Don't store sensitive notes in descriptions

### Compliance & Standards

#### Privacy Regulations
- **GDPR Compliant**: Meets European privacy standards
- **Data Minimization**: Only stores necessary data
- **Right to Erasure**: Complete data deletion available
- **Transparency**: Clear data practices disclosure

#### Security Standards
- **AES-256-GCM Encryption**: Industry standard encryption
- **PBKDF2 Key Derivation**: Secure password-based encryption
- **Hardware Security**: Leverages device secure enclaves
- **Regular Security Audits**: Continuous security testing

---

## Frequently Asked Questions

### General Questions

**Q: Is Finance Tracker really free?**
A: Yes, Finance Tracker is completely free with no ads, subscriptions, or in-app purchases. It's our commitment to making financial management accessible to everyone.

**Q: How do you make money if the app is free?**
A: Finance Tracker is developed as a privacy-focused open source project. We believe financial privacy is a right, not a privilege.

**Q: Can I use Finance Tracker for business accounting?**
A: While designed for personal use, many small business owners use Finance Tracker for simple business expense tracking. However, consult your accountant for business-specific requirements.

### Privacy & Security

**Q: How can I be sure my data is safe?**
A: Your data is encrypted with AES-256 (bank-grade security) and never leaves your device. The app is open source, so security experts can audit the code.

**Q: What happens if I lose my phone?**
A: Your data is protected by your PIN and device security. If you have encrypted backups, you can restore your data on a new device.

**Q: Can you recover my data if I forget my PIN?**
A: No, by design we cannot recover your PIN or data. This ensures your privacy but means you should set up biometric authentication and keep secure backups.

### Technical Questions

**Q: Which phones are supported?**
A: Finance Tracker works on iOS 13+ and Android 8.0+. Most phones from the last 5 years are supported.

**Q: How much storage space does the app use?**
A: The app itself is about 50MB. Your data typically uses 10-50MB, but can grow larger with many receipt photos.

**Q: Does the app work offline?**
A: Yes! Finance Tracker works completely offline. All features work without internet connection.

**Q: Can I sync data between devices?**
A: Not automatically for privacy reasons. However, you can export encrypted backups and restore them on other devices.

### Feature Questions

**Q: How accurate is the receipt scanning?**
A: OCR accuracy is typically 80-90% for clear receipts. The app works best with good lighting and flat receipts.

**Q: Can I import data from my bank?**
A: Yes, you can import CSV files from most banks. The app supports various CSV formats and includes mapping tools.

**Q: Is there a limit on transactions?**
A: No, you can add unlimited transactions. Performance remains good even with thousands of transactions.

**Q: Can I track multiple currencies?**
A: Currently, the app is optimized for single-currency use. Multi-currency support may be added in future versions.

---

## Getting Support

### Self-Service Resources

1. **This User Guide**: Comprehensive documentation for all features
2. **In-App Help**: Context-sensitive help throughout the app
3. **Video Tutorials**: Step-by-step guides for common tasks
4. **FAQ Section**: Answers to frequently asked questions

### Community Support

- **User Forums**: Connect with other Finance Tracker users
- **Feature Requests**: Suggest new features and improvements
- **Tips & Tricks**: Learn from experienced users
- **Beta Testing**: Help test new features early

### Feedback & Bug Reports

Help us improve Finance Tracker:

1. **In-App Feedback**: Settings → Send Feedback
2. **Bug Reports**: Include steps to reproduce the issue
3. **Feature Requests**: Describe what you'd like to see added
4. **General Comments**: Let us know how we're doing

---

**Thank you for choosing Finance Tracker!** We're committed to providing you with the most secure and private personal finance management experience possible.

Remember: Your financial privacy is worth protecting. Finance Tracker keeps your data yours, always.

---

*Last updated: June 12, 2025*
*Version: 1.0.0*
