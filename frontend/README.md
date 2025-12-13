# Modular ERP Frontend

A modern, responsive React + TypeScript frontend for the Modular ERP system, built with Vite and Tailwind CSS.

## Features

- **Modern Tech Stack**: React 18 + TypeScript + Vite
- **Beautiful UI**: Tailwind CSS for responsive, modern design
- **Type Safety**: Full TypeScript coverage
- **Authentication**: JWT-based auth with role-based access control
- **Real-time Updates**: Live shift duration tracking
- **Responsive Design**: Works on desktop, tablet, and mobile

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first CSS framework
- **date-fns** - Date formatting and manipulation

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Alert.tsx
│   │   ├── Layout.tsx       # Main layout with navigation
│   │   └── ProtectedRoute.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx  # Authentication state management
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── EmployeeDashboard.tsx
│   │   └── ManagerDashboard.tsx
│   ├── services/
│   │   └── api.ts           # API client
│   ├── types/
│   │   └── index.ts         # TypeScript type definitions
│   ├── utils/
│   │   └── format.ts        # Formatting utilities
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Backend API running on http://localhost:8080

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Edit `.env` if your backend runs on a different URL:
```env
VITE_API_URL=http://localhost:8080
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at http://localhost:3000

### Build for Production

```bash
npm run build
```

The production files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## User Roles & Features

### All Users
- Login/Registration
- JWT token authentication
- Secure password handling

### Employee
- **Clock In/Out**: Start and end work shifts
- **Shift History**: View personal shift records
- **Active Shift**: See current shift duration in real-time
- **Add Notes**: Add notes when clocking out

### Manager/Admin
- All employee features, plus:
- **View All Shifts**: See all employee shifts
- **Attendance Reports**: View statistics and metrics
- **Date Filters**: Filter shifts by date range
- **Employee Details**: See who clocked in/out and when

## Components Guide

### UI Components

#### Button
```tsx
<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>
```

Variants: `primary`, `secondary`, `danger`, `success`
Sizes: `sm`, `md`, `lg`

#### Input
```tsx
<Input
  label="Username"
  type="text"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  error={errorMessage}
/>
```

#### Card
```tsx
<Card title="My Card" action={<Button>Action</Button>}>
  Card content here
</Card>
```

#### Alert
```tsx
<Alert variant="success" onClose={() => setMessage('')}>
  Operation successful!
</Alert>
```

Variants: `info`, `success`, `warning`, `error`

### Context

#### AuthContext
```tsx
const { user, token, login, register, logout } = useAuth();
```

### API Service

All API calls go through the centralized API service:

```tsx
import { api } from '@/services/api';

// Clock in
const response = await api.clockIn();

// Get shifts
const shifts = await api.getMyShifts(50, 0);

// Get report (manager only)
const report = await api.getReport(startDate, endDate);
```

## Styling

The app uses Tailwind CSS for styling. Key color scheme:

- Primary: Blue (#3b82f6)
- Success: Green (#10b981)
- Danger: Red (#ef4444)
- Warning: Yellow (#f59e0b)

### Customizing Colors

Edit `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom colors
      },
    },
  },
}
```

## Development Tips

### Hot Module Replacement

Vite provides instant HMR. Changes to components will reflect immediately without losing state.

### TypeScript

All components use TypeScript. The `@/` alias points to the `src/` directory.

```tsx
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';
import type { User } from '@/types';
```

### Date Formatting

Use the utilities in `utils/format.ts`:

```tsx
import { formatDateTime, calculateDuration } from '@/utils/format';

formatDateTime('2024-01-15T09:00:00Z'); // "Jan 15, 2024 09:00"
calculateDuration(clockIn, clockOut);     // "8h 30m"
```

## API Integration

The frontend automatically proxies `/api` requests to the backend in development mode (see `vite.config.ts`).

In production, set `VITE_API_URL` to your backend URL.

### Request Flow

1. User action triggers API call
2. API service adds JWT token to headers
3. Request sent to backend
4. Response handled, UI updated
5. Errors shown to user via Alert component

### Error Handling

All API errors are caught and displayed to users:

```tsx
try {
  await api.clockIn();
  setSuccess('Clocked in successfully!');
} catch (err) {
  setError(api.getErrorMessage(err));
}
```

## Protected Routes

Routes are protected based on authentication:

```tsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Layout>
        <Dashboard />
      </Layout>
    </ProtectedRoute>
  }
/>
```

Users are redirected to login if not authenticated.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Performance

- Code splitting with React Router
- Tree shaking with Vite
- Optimized production builds
- Lazy loading of routes

## Environment Variables

- `VITE_API_URL` - Backend API URL (default: http://localhost:8080)

## Troubleshooting

### API Connection Issues

Check that:
1. Backend is running on port 8080
2. CORS is enabled on backend
3. `.env` has correct API URL

### Build Errors

```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
npm run build
```

This will show all TypeScript errors.

## Contributing

1. Follow the existing code style
2. Use TypeScript for all new code
3. Add proper types for all props
4. Use Tailwind for styling
5. Test on multiple screen sizes

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

Part of the Modular ERP System - MIT License

---

Built with ❤️ using React + TypeScript + Vite
