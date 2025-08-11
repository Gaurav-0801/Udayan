# Udyam Registration Form Replica

A comprehensive replica of the official Udyam Registration portal built with Next.js, TypeScript, and PostgreSQL. This project demonstrates advanced web scraping, responsive UI development, REST API implementation, and database integration.

## 🚀 Features

### Core Functionality
- **Exact UI Replica**: Pixel-perfect recreation of the official Udyam registration portal
- **Multi-step Form**: Progressive form with Aadhaar verification and PAN validation 
- **Real-time Validation**: Instant field validation with proper error messages
- **OTP Verification**: Complete Aadhaar OTP verification flow with alert display
- **PIN Code Auto-fill**: Automatic city/state population based on PIN code using free PostalPinCode API
- **Form Submission**: Automatic form saving after successful OTP verification
- **Print Functionality**: Generate printable form after successful submission
- **Form Reset**: Clean form reset for new submissions

### Advanced Features
- **Multi-language Support**: Hindi/English toggle functionality
- **Form Auto-save**: Automatic form data persistence with local storage
- **Document Upload**: File upload capabilities for required documents
- **Progress Tracking**: Visual progress indicator for form completion
- **Success Workflow**: Complete OTP → Save → Print → Reset workflow
- **Accessibility**: WCAG compliant with keyboard navigation support
- **Responsive Design**: Mobile-first approach with 100% responsiveness

### Technical Features
- **Web Scraping**: Python-based scraping of official Udyam portal
- **REST API**: Complete Node.js API with validation and storage
- **Database Integration**: PostgreSQL with Prisma ORM
- **Comprehensive Testing**: Unit, integration, and component tests
- **Docker Support**: Full containerization with multi-stage builds
- **Type Safety**: Full TypeScript implementation

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Zod schema validation
- **Testing**: Jest, React Testing Library
- **Web Scraping**: Python, Selenium, BeautifulSoup
- **UI Components**: shadcn/ui, Radix UI
- **Containerization**: Docker, Docker Compose

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Python 3.8+ (for web scraping)
- Chrome/Chromium browser (for Selenium)
- Docker and Docker Compose (optional)

## 🚀 Quick Start

### Option 1: Local Development

#### 1. Clone and Install
\`\`\`bash
git clone <repository-url>
cd udyam-replica
npm install
\`\`\`

#### 2. Environment Setup
\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` with your configuration:
\`\`\`env
DATABASE_URL="postgresql://username:password@localhost:5432/udyam_db"
NEXTAUTH_URL="http://localhost:3000"
JWT_SECRET="your_jwt_secret"
\`\`\`

#### 3. Database Setup
\`\`\`bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Optional: Run custom SQL setup
npm run db:setup
\`\`\`

#### 4. Run Development Server
\`\`\`bash
npm run dev
\`\`\`

### Option 2: Docker Development

#### 1. Clone Repository
\`\`\`bash
git clone <repository-url>
cd udyam-replica
\`\`\`

#### 2. Environment Setup
\`\`\`bash
cp .env.example .env
# Edit .env with your configuration
\`\`\`

#### 3. Run with Docker Compose
\`\`\`bash
# Development environment
docker-compose -f docker-compose.dev.yml up --build

# Production environment
docker-compose up --build
\`\`\`

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🔄 OTP Verification Workflow

### Complete User Journey
1. **Aadhaar Entry**: User enters 12-digit Aadhaar number
2. **OTP Generation**: Click "Send OTP" → OTP displayed in browser alert
3. **OTP Verification**: Enter OTP and click "Validate"
4. **Form Submission**: Successful verification automatically saves form to database
5. **Success Screen**: Display success message with print option
6. **Print Form**: Generate printable version of submitted form
7. **Form Reset**: Option to reset form for new submission

### OTP Features
- **Alert Display**: OTP shown in browser alert (no SMS required)
- **6-digit Generation**: Secure random OTP generation
- **Database Storage**: OTP verification tracking
- **Expiration**: 10-minute OTP validity
- **Attempt Limiting**: Maximum 3 verification attempts

## 📊 Database Schema

### Tables
- **udyam_submissions**: Stores complete form submission data
  - Aadhaar number, entrepreneur details, business information
  - Verification status, submission timestamp
  - Address details with PIN code lookup data
- **otp_verifications**: Manages OTP verification records
  - OTP codes, expiration times, attempt counts
  - Verification status and timestamps

### Key Features
- **Data Persistence**: All form data saved after OTP verification
- **Audit Trail**: Complete submission history
- **Security**: Encrypted sensitive data storage

## 🔌 API Endpoints

### Form Validation
\`\`\`
POST /api/form/validate
\`\`\`
Real-time field validation with detailed error messages and debounced validation.

### Form Submission
\`\`\`
POST /api/form/submit
\`\`\`
Complete form submission with database storage after OTP verification.

### OTP Management
\`\`\`
POST /api/form/otp
\`\`\`
- **Send OTP**: Generate and return OTP for alert display
- **Verify OTP**: Validate entered OTP and trigger form submission

## 🕷️ Web Scraping

### Run Scraping Scripts
\`\`\`bash
# Detailed form structure extraction
python scripts/scrape-udyam-detailed.py

# Analyze scraped data
python scripts/analyze-scraped-data.py
\`\`\`

### Scraped Data
- Input field specifications and validation rules
- UI component structures and styling
- Form flow requirements and business logic
- Bilingual content and government branding

## 🧪 Testing

### Run All Tests
\`\`\`bash
npm test
\`\`\`

### Test Coverage
\`\`\`bash
npm run test:coverage
\`\`\`

### Test Categories
- **Unit Tests**: Validation functions, OTP generation, form utilities
- **API Tests**: Endpoint functionality, OTP verification, error handling
- **Component Tests**: Form fields, OTP workflow, print functionality
- **Integration Tests**: Complete form submission and reset flow

## 🎨 UI Components

### Core Components
- `UdyamRegistrationForm`: Main form container with state management
- `FormField`: Reusable form field with OTP actions and validation
- `ProgressTracker`: Multi-step progress indicator
- `DocumentUpload`: File upload with validation
- `SuccessScreen`: Post-submission success display with print option

### UI Features
- **Government Portal Styling**: Exact color scheme and layout
- **Bilingual Content**: English/Hindi text support
- **Loading States**: Smooth transitions and feedback
- **Print Optimization**: CSS print styles for form output
- **Error Handling**: Comprehensive error display and recovery

## 🖨️ Print Functionality

### Features
- **Formatted Output**: Professional form layout for printing
- **Complete Data**: All submitted information included
- **Government Styling**: Official document appearance
- **Browser Print**: Uses browser's native print functionality
- **PDF Generation**: Print to PDF option available

### Usage
1. Complete form submission with OTP verification
2. Success screen displays with "Print Form" button
3. Click to open print dialog with formatted form
4. Print or save as PDF

## 🔒 Security Features

- **Input Sanitization**: All form inputs cleaned and validated
- **SQL Injection Prevention**: Parameterized queries with Prisma
- **XSS Protection**: Content sanitization and CSP headers
- **Rate Limiting**: API endpoint protection
- **Secure OTP Handling**: Encrypted storage and expiration
- **Data Validation**: Server-side validation for all inputs

## 📱 Responsive Design

- **Mobile-First**: Optimized for mobile devices
- **Breakpoint Optimization**: Tailored layouts for all screen sizes
- **Touch-Friendly**: Large buttons and touch targets
- **Accessibility**: Screen reader support and keyboard navigation
- **Performance**: Optimized images and lazy loading

## 🐳 Docker Support

### Development
\`\`\`bash
docker-compose -f docker-compose.dev.yml up --build
\`\`\`

### Production
\`\`\`bash
docker-compose up --build
\`\`\`

### Features
- **Multi-stage Builds**: Optimized production images
- **Database Integration**: PostgreSQL container included
- **Volume Persistence**: Data persistence across restarts
- **Health Checks**: Container health monitoring
- **Hot Reload**: Development environment with live updates

## 🚀 Deployment

### Frontend (Vercel)
\`\`\`bash
npm run build
vercel deploy
\`\`\`

### Database
- Set up PostgreSQL instance (Neon, Supabase, or self-hosted)
- Configure DATABASE_URL in environment variables
- Run migrations: `npx prisma migrate deploy`

### Docker Deployment
\`\`\`bash
# Build production image
docker build -t udyam-replica .

# Run with environment variables
docker run -p 3000:3000 --env-file .env udyam-replica
\`\`\`

### Environment Variables
Ensure all required environment variables are set:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_URL`: Application URL
- `JWT_SECRET`: JWT signing secret

## 📝 Development Guidelines

### Code Quality
- **TypeScript Strict Mode**: Full type safety
- **ESLint and Prettier**: Code formatting and linting
- **Error Handling**: Comprehensive error boundaries
- **Modular Architecture**: Reusable components and utilities

### Best Practices
- **Mobile-First Design**: Responsive development approach
- **Accessibility Standards**: WCAG 2.1 compliance
- **Performance Optimization**: Code splitting and lazy loading
- **SEO Optimization**: Meta tags and structured data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper testing
4. Add tests for new functionality
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Submit a pull request

## 📄 License

This project is for educational and demonstration purposes only. The original Udyam registration portal is owned by the Government of India, Ministry of Micro, Small & Medium Enterprises.

## 🆘 Support

For issues and questions:
1. Check existing issues in the repository
2. Create a new issue with detailed description
3. Include error logs, environment details, and steps to reproduce
4. Use appropriate labels for categorization

## 📚 Additional Resources

- [Official Udyam Portal](https://udyamregistration.gov.in/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Docker Documentation](https://docs.docker.com/)
- [PostalPinCode API](https://api.postalpincode.in/)

## 🎯 Project Highlights

This project demonstrates:
- **Full-Stack Development**: Complete application with frontend, backend, and database
- **Government Portal Replication**: Exact UI/UX matching official portal
- **Modern Web Technologies**: Latest React, Next.js, and TypeScript features
- **Production-Ready Code**: Comprehensive testing, error handling, and deployment
- **User Experience**: Complete workflow from form entry to print output
- **Security Best Practices**: Input validation, data sanitization, and secure storage
#   U d a y a n 
 
 
