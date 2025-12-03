# Finance Tracker - Manual AI-Prompting Implementation

This is the **manual AI-prompting approach** implementation of the Finance Tracker app, developed as part of a comparison study between different AI-assisted development methodologies.

## Project Overview

A privacy-first, offline-capable mobile application for managing personal finances built using manual AI prompting with advanced language models. The app allows users to track expenses and incomes, categorize transactions, analyze monthly reports, and scan receipts for automatic entry — all without requiring an internet connection.

## Architecture

### Tech Stack
- **Framework**: React Native 0.72+
- **State Management**: Redux Toolkit + RTK Query
- **Navigation**: React Navigation 6
- **Database**: SQLite with SQLCipher (encrypted)
- **UI Framework**: React Native Elements
- **Testing**: Jest + React Native Testing Library + Detox
- **Languages**: TypeScript
- **Build**: React Native CLI with Fastlane

### Key Features
- 🔒 **Offline-First**: Complete functionality without internet
- 🛡️ **Privacy by Design**: All data stored locally, encrypted
- 📱 **Cross-Platform**: iOS and Android with single codebase
- 🔐 **Security**: PIN/Biometric authentication, AES-256 encryption
- 📸 **OCR**: Receipt scanning with Tesseract.js
- 📊 **Reports**: Comprehensive financial analytics
- 🔄 **Recurring Transactions**: Automated regular payments
- 🎨 **Themeable**: Light/Dark mode support

## 🚀 Getting Started

### 🎯 **Demo Version (SOFORT STARTEN)**
```bash
# Option 1: Direkt aus manual/ starten
npm run demo

# Option 2: In Demo-Verzeichnis wechseln
cd demo
npm install
npm run web

# Öffnet sich automatisch im Browser auf http://localhost:8084
```
**➡️ Vollständig funktionsfähige Finance Tracker App im Browser**  
**Features**: Dashboard, Transaktionen, Berichte, Einstellungen

### Quick Start (5 Minutes)
See **[QUICK-START.md](QUICK-START.md)** for rapid setup.

### Detailed Installation Guide
See **[INSTALLATION-GUIDE.md](INSTALLATION-GUIDE.md)** for comprehensive setup instructions.

### Basic Commands
```bash
# Clone and setup
git clone <repository-url>
cd finance-tracker/manual
npm install

# Start development
npm start          # Metro Bundler
npm run android    # Android App  
npm run ios        # iOS App (macOS only)
```

### Prerequisites
- Node.js 18+
- React Native CLI
- Android Studio (for Android)
- Xcode (for iOS, macOS only)

For detailed setup, troubleshooting, and platform-specific guides, see the **[INSTALLATION-GUIDE.md](INSTALLATION-GUIDE.md)**.

## Project Structure

```
manual/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # Screen components
│   ├── navigation/         # Navigation setup
│   ├── services/           # Business logic and data services
│   ├── store/              # Redux store and slices
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript type definitions
│   └── styles/             # Themes and styling
├── __tests__/              # Test files
├── e2e/                    # End-to-end tests
├── assets/                 # Images, icons, etc.
├── docs/                   # Project documentation
│   ├── project-requirements.md
│   ├── use-cases-user-stories.md
│   ├── architecture-system-design.md
│   ├── technical-decisions-adrs.md
│   ├── test-concept-plan.md
│   └── iterative-development-plan.md
└── README.md
```

## Development Approach

This implementation follows the **Manual AI-Prompting approach** using sophisticated language models to:

1. **Generate comprehensive documentation** (requirements, architecture, test plans)
2. **Create boilerplate code structure** with proper TypeScript typing
3. **Implement core services** (security, database, crypto)
4. **Build UI components** following design patterns
5. **Write comprehensive tests** with high coverage targets

### Development Methodology
- **Agile Development**: 13 two-week sprints
- **Test-Driven Development**: >90% code coverage target
- **Continuous Integration**: GitHub Actions pipeline
- **Security-First**: Privacy by design principles

## Sprint Plan

The project follows a 13-sprint development plan (26 weeks total):

- **Sprint 0**: Project setup and CI/CD
- **Sprints 1-3**: MVP with basic transaction management and security
- **Sprints 4-6**: Full transaction system with categorization and reports
- **Sprints 7-9**: Advanced features (OCR, recurring transactions)
- **Sprints 10-12**: Polish, performance optimization, and testing
- **Sprint 13**: Release preparation and deployment

## Getting Started

### Prerequisites
- Node.js 18+
- React Native CLI
- Xcode (for iOS development)
- Android Studio (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd finance-tracker/manual
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **iOS Setup**
   ```bash
   cd ios && pod install && cd ..
   ```

4. **Run the app**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   ```

### Development Commands

```bash
# Start Metro bundler
npm start

# Run tests
npm test
npm run test:coverage
npm run test:watch

# Run E2E tests
npm run test:e2e:ios
npm run test:e2e:android

# Linting and formatting
npm run lint
npm run lint:fix

# Type checking
npm run typecheck

# Build for production
npm run build:ios
npm run build:android
```

## Testing Strategy

### Test Pyramid
- **70% Unit Tests**: Services, utilities, business logic
- **25% Integration Tests**: Component + service integration
- **5% E2E Tests**: Critical user journeys

### Coverage Targets
- **Code Coverage**: >90%
- **Security Tests**: Encryption, authentication
- **Performance Tests**: Memory, startup time, database operations
- **Accessibility**: WCAG AA compliance

## Security Features

### Data Protection
- **AES-256-GCM Encryption**: All sensitive data encrypted at rest
- **PBKDF2 Key Derivation**: Secure key generation from user PIN
- **SQLCipher Database**: Transparent database encryption
- **Secure Storage**: iOS Keychain / Android Keystore integration

### Authentication
- **Multi-Factor Auth**: PIN + Biometric (TouchID/FaceID/Fingerprint)
- **Auto-Lock**: Configurable inactivity timeout
- **Failed Attempt Protection**: Progressive delays and temporary lockouts

## Architecture Decisions

Key architectural decisions are documented in [ADRs](docs/technical-decisions-adrs.md):

- **ADR-001**: React Native for cross-platform development
- **ADR-002**: SQLite + SQLCipher for local encrypted storage
- **ADR-003**: Offline-First architecture for maximum privacy
- **ADR-004**: Tesseract.js for offline OCR processing
- **ADR-005**: AES-256-GCM encryption strategy

## Performance Targets

- **App Start Time**: <3 seconds (95th percentile)
- **Screen Load Time**: <1 second (95th percentile)
- **Memory Usage**: <150MB peak, <100MB average
- **Database Queries**: <100ms for standard operations
- **Crash-Free Sessions**: >99.9%

## Privacy Compliance

- **GDPR Compliant**: Data minimization, right to be forgotten
- **No Telemetry**: Zero data collection or tracking
- **Local Processing**: All operations performed on-device
- **Transparent**: Open documentation of data handling

## Development Status

**Current Status**: Sprint 0 - Project Setup Complete ✅

### Completed
- ✅ Project structure and configuration
- ✅ TypeScript type definitions
- ✅ Core services architecture
- ✅ Redux store setup
- ✅ Theme system implementation
- ✅ Authentication flow
- ✅ Basic navigation structure
- ✅ Comprehensive documentation

### Next Steps (Sprint 1)
- [ ] Complete UI navigation implementation
- [ ] Error handling and loading states
- [ ] Settings persistence
- [ ] Initial testing setup

## Contributing

This project follows strict development standards:

1. **Code Quality**: ESLint + Prettier configuration
2. **Type Safety**: Full TypeScript coverage
3. **Testing**: Write tests before implementation
4. **Documentation**: Update docs with code changes
5. **Security**: Security review for all PRs

## Comparison Study

This implementation is part of a study comparing AI-assisted development approaches:

- **BMAD Method**: Automated agents with guided workflows (see `/bmad` folder)
- **Manual Prompting**: Direct AI assistance with manual oversight (this implementation)

The goal is to evaluate effectiveness, code quality, and development velocity of different AI-augmented development methodologies.

## License

MIT License - See LICENSE file for details

## Documentation

Comprehensive documentation available in `/docs`:
- [Project Requirements](docs/project-requirements.md)
- [Architecture & System Design](docs/architecture-system-design.md)
- [Technical Decisions (ADRs)](docs/technical-decisions-adrs.md)
- [Test Concept & Plan](docs/test-concept-plan.md)
- [Iterative Development Plan](docs/iterative-development-plan.md)
- [Use Cases & User Stories](docs/use-cases-user-stories.md)
