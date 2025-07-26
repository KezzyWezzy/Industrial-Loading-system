# Industrial Loading System - Frontend Application

A comprehensive React-based frontend application for managing industrial loading operations including tank management, loading bays, transactions, and regulatory compliance.

## Features

### Core Modules
- **Tank Management**: Real-time tank monitoring, manual gauging, strapping tables, inventory reconciliation
- **Loading Operations**: Truck, rail, and barge loading with safety controls and weight enforcement
- **Transaction Management**: BOL generation, custody transfer documentation, batch tracking (optional)
- **Reporting System**: Operational, compliance, and performance reports with scheduling
- **Maintenance Tracking**: Work orders, preventive maintenance, equipment history
- **User Management**: Role-based access control, permissions matrix, user administration
- **PLC Communication**: Allen Bradley Ethernet/IP and Modbus TCP/RTU integration
- **Scale Integration**: Weight-based loading controls with DOT compliance

### Safety Features
- Emergency stop functionality
- Overfill protection
- Weight limit enforcement
- Ground fault detection
- Vapor recovery monitoring

## Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **State Management**: React Context API with custom hooks
- **UI Components**: Custom components with Tailwind CSS
- **Routing**: React Router v6
- **API Communication**: Fetch API with JWT authentication
- **Build Tool**: Create React App with TypeScript template
- **Styling**: Tailwind CSS with custom design system
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast

## Prerequisites

- Node.js 16.x or higher
- npm or yarn package manager
- Access to backend API (see backend documentation)
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd industrial-loading-system/frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create environment configuration:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WEBSOCKET_URL=ws://localhost:8000/ws
REACT_APP_ENVIRONMENT=development
```

5. Start the development server:
```bash
npm start
# or
yarn start
```

The application will open at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── components/          # Shared UI components
│   ├── ui/             # Base UI components (buttons, cards, etc.)
│   └── shared/         # Application-specific shared components
├── modules/            # Feature modules
│   ├── auth/          # Authentication
│   ├── tanks/         # Tank management
│   ├── loading/       # Loading operations
│   ├── transactions/  # Transaction management
│   ├── reports/       # Reporting system
│   ├── maintenance/   # Maintenance tracking
│   └── users/         # User management
├── lib/               # Utility functions and helpers
├── hooks/             # Global custom hooks
├── contexts/          # React contexts
├── types/             # TypeScript type definitions
└── App.tsx            # Main application component
```

### Module Structure

Each module follows a consistent structure:
```
module-name/
├── components/        # Module-specific components
├── hooks/            # Module-specific hooks
├── services/         # API services
├── types/            # TypeScript types
└── index.ts          # Module exports
```

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow React best practices and hooks guidelines
- Use functional components with hooks
- Implement proper error boundaries
- Add JSDoc comments for complex functions

### Component Guidelines
```typescript
// Example component structure
interface ComponentProps {
  // Props interface
}

export const ComponentName: React.FC<ComponentProps> = ({ props }) => {
  // Hooks first
  const [state, setState] = useState();
  
  // Effects
  useEffect(() => {
    // Effect logic
  }, []);
  
  // Handlers
  const handleEvent = () => {
    // Handler logic
  };
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

### State Management
- Use local state for component-specific data
- Use context for cross-component state
- Keep state as close to where it's used as possible
- Use custom hooks to encapsulate complex state logic

### API Integration
- All API calls should go through service files
- Handle loading and error states consistently
- Use proper TypeScript types for API responses
- Implement retry logic for critical operations

## Available Scripts

### Development
```bash
npm start          # Start development server
npm test           # Run tests
npm run lint       # Run ESLint
npm run format     # Format code with Prettier
```

### Building
```bash
npm run build      # Build for production
npm run analyze    # Analyze bundle size
```

## Configuration

### Environment Variables
- `REACT_APP_API_URL`: Backend API URL
- `REACT_APP_WEBSOCKET_URL`: WebSocket server URL
- `REACT_APP_ENVIRONMENT`: Current environment (development/staging/production)

### Feature Flags
Feature flags can be configured in `src/config/features.ts`:
```typescript
export const features = {
  batchTracking: process.env.REACT_APP_ENABLE_BATCH_TRACKING === 'true',
  advancedReporting: process.env.REACT_APP_ENABLE_ADVANCED_REPORTING === 'true',
};
```

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

## Deployment

### Production Build
1. Set production environment variables
2. Build the application:
```bash
npm run build
```
3. Deploy the `build` directory to your web server

### Docker Deployment
```bash
docker build -t industrial-loading-frontend .
docker run -p 80:80 industrial-loading-frontend
```

## Security Considerations

- All API requests require JWT authentication
- Implement proper CORS configuration
- Use HTTPS in production
- Sanitize user inputs
- Implement rate limiting
- Regular security audits

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check API URL in environment configuration
   - Verify backend is running
   - Check network connectivity

2. **Authentication Issues**
   - Clear browser local storage
   - Check token expiration
   - Verify user credentials

3. **Performance Issues**
   - Clear browser cache
   - Check network latency
   - Review browser console for errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For technical support:
- Email: support@industrialloading.com
- Documentation: [docs.industrialloading.com](https://docs.industrialloading.com)
- Issue Tracker: [GitHub Issues](https://github.com/company/industrial-loading/issues)

## Acknowledgments

- Built with React and TypeScript
- UI components inspired by shadcn/ui
- Icons from Lucide React
- Developed by KJV Solutions