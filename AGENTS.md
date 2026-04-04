# Project Documentation

## Project Structure

```
/user-app/
├── src/
│   ├── client/                      # React frontend
│   │   ├── assets/                  # Images/logos (favicon.svg, modelence.svg)
│   │   ├── components/
│   │   │   ├── ui/                  # Reusable UI components (shadcn-style)
│   │   │   │   ├── Button.tsx       # Multiple variants and sizes
│   │   │   │   ├── Input.tsx        # Form input with focus states
│   │   │   │   ├── Label.tsx        # Form labels
│   │   │   │   ├── Card.tsx         # Card container with subcomponents
│   │   │   │   ├── Checkbox.tsx     # Checkbox with checked state
│   │   │   │   ├── Textarea.tsx     # Multi-line text input
│   │   │   │   ├── Select.tsx       # Dropdown select
│   │   │   │   ├── FormField.tsx    # Reusable form field wrapper
│   │   │   │   └── Toast.tsx        # Toast notification wrapper
│   │   │   ├── LoadingSpinner.tsx   # Custom loading component
│   │   │   └── Page.tsx             # Page wrapper with header
│   │   ├── pages/                   # Route pages
│   │   │   ├── HomePage.tsx         # Landing page
│   │   │   ├── LoginPage.tsx        # Login with react-hook-form
│   │   │   ├── SignupPage.tsx       # Signup with react-hook-form
│   │   │   ├── TodoPage.tsx         # Todo CRUD example
│   │   │   ├── DashboardPage.tsx    # Main dashboard
│   │   │   ├── DevicesPage.tsx      # Device management
│   │   │   ├── SensorSimulatorPage.tsx
│   │   │   ├── ExamplePage.tsx      # Legacy example
│   │   │   ├── PrivateExamplePage.tsx
│   │   │   ├── LogoutPage.tsx
│   │   │   ├── TermsPage.tsx
│   │   │   └── NotFoundPage.tsx
│   │   ├── lib/
│   │   │   ├── utils.ts             # cn() helper for class merging
│   │   │   └── autoLogin.ts         # Auto login utility
│   │   ├── router.tsx               # React Router configuration
│   │   ├── index.tsx                # App entry point
│   │   ├── types.d.ts
│   │   └── index.css
│   │
│   └── server/                      # Node.js backend
│       ├── app.ts                   # Server entry point with modules
│       ├── todo/                    # Todo module
│       │   ├── index.ts             # Module with queries/mutations
│       │   ├── db.ts                # Database Store definition
│       │   └── cron.ts              # Scheduled jobs
│       ├── example/                 # Legacy example module
│       │   ├── index.ts
│       │   ├── db.ts
│       │   └── cron.ts
│       ├── regenerate/              # Regenerate feature module
│       │   ├── index.ts
│       │   └── db.ts
│       └── migrations/
│           └── createDemoUser.ts
│
├── Configuration Files
│   ├── tsconfig.json                # TypeScript config with strict settings
│   ├── tailwind.config.js           # Tailwind CSS setup
│   ├── vite.config.ts               # Vite bundler config
│   ├── postcss.config.js
│   ├── modelence.config.ts          # Modelence framework config
│   ├── .eslintrc.cjs                # ESLint configuration
│   ├── .prettierrc                  # Prettier configuration
│   ├── lint-staged.config.js        # Lint-staged configuration
│   └── .husky/                      # Husky pre-commit hooks
│
├── .env.example                     # Environment variables template
├── .gitignore                       # Git ignore patterns
├── package.json                     # Dependencies & scripts
└── README.md                        # Project readme
```

## Available UI Components

All components in `/src/client/components/ui/`:

| Component | Description | Key Props |
|-----------|-------------|-----------|
| Button | Action button | variant, size, disabled |
| Input | Text input | All HTML input attributes |
| Label | Form label | htmlFor |
| Card | Container card | CardHeader, CardTitle, CardContent, CardFooter |
| Checkbox | Toggle checkbox | checked, onCheckedChange |
| Textarea | Multi-line input | rows |
| Select | Dropdown select | SelectOption children |
| FormField | Form field wrapper | label, error, description, required |
| Toast | Notification system | showToast.success/error/loading |

## Form Handling

Forms use `react-hook-form` with `@hookform/resolvers/zod`:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

## Backend Module Pattern

Modules in `/src/server/[module]/`:

```typescript
// index.ts
export default new Module('moduleName', {
  configSchema: { /* config */ },
  stores: [dbStore],
  queries: {
    getItems: async (args, { user }) => { /* ... */ },
  },
  mutations: {
    createItem: async (args, { user }) => { /* ... */ },
  },
  cronJobs: { /* ... */ },
});

// db.ts
export const dbStore = new Store('collectionName', {
  schema: {
    field: schema.string(),
    userId: schema.userId(),
  },
  indexes: [{ key: { userId: 1 } }],
});
```

## Key Dependencies

- **modelence** - Framework core
- **@modelence/react-query** - Query/mutation hooks
- **@tanstack/react-query** - Server state
- **react-hook-form** - Form handling
- **@hookform/resolvers** - Zod resolver
- **zod** - Schema validation
- **react-router-dom** - Client routing
- **react-hot-toast** - Notifications
- **lucide-react** - Icons
- **tailwindcss** - Styling

## Available Scripts

```bash
npm run dev        # Development server
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
npm run lint:fix   # Fix ESLint issues
npm run format     # Format with Prettier
```

## Developer Experience

- **ESLint** - Code linting with React, hooks, and TypeScript rules
- **Prettier** - Code formatting (single quotes, trailing commas)
- **Husky** - Pre-commit hooks
- **lint-staged** - Run linters on staged files

## Routes

| Path | Access | Component |
|------|--------|-----------|
| `/` | Public | HomePage |
| `/login` | Guest only | LoginPage |
| `/signup` | Guest only | SignupPage |
| `/todos` | Authenticated | TodoPage |
| `/dashboard` | Authenticated | DashboardPage |
| `/impact` | Authenticated | ImpactPage |
| `/devices` | Authenticated | DevicesPage |
| `/simulator` | Authenticated | SensorSimulatorPage |
| `/terms` | Public | TermsPage |
| `/logout` | Public | LogoutPage |

## Recent Changes

### Navigation & Impact Visualization (Latest)
- Added persistent sidebar navigation for easy section switching
- Redesigned HomePage to fit without scrolling (vertically centered, compact design)
- Created Impact Summary page (`/impact`) with real-time line graphs:
  - 30-day trends for devices, CO₂ offset, credits, and schools
  - Data sourced from actual user activity via `getImpactHistory` query
  - Empty state when no data exists yet
- Installed recharts library for data visualization
- Updated sidebar and router with Impact Summary section

### DX Improvements
- Added ESLint + Prettier + Husky toolchain
- Created new UI components: Checkbox, Textarea, Select, FormField, Toast
- Refactored Login/Signup pages to use react-hook-form + zod
- Added todo module as a full CRUD example
- Updated tsconfig.json with stricter settings
- Added .env.example template
