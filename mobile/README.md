# Isha Treat Mobile App

React Native mobile app for Isha Treat wholesale grocery platform.

## Features

- **Browse Products** - Categories and product listings
- **Search** - Find products quickly
- **Shopping Cart** - Add, update, remove items
- **Checkout** - Place orders with multiple payment options
- **Order Tracking** - Real-time order status updates
- **Profile** - Manage addresses and view order history

## Tech Stack

- React Native with Expo
- TypeScript
- React Navigation
- Axios for API calls
- Expo Secure Store for token storage

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone (for testing)

### Installation

```bash
cd mobile
npm install
```

### Configuration

Update the API base URL in `src/services/api.ts`:

```typescript
const API_BASE_URL = 'http://your-api-url:3000/api';
```

For local development:
- iOS Simulator: `http://localhost:3000/api`
- Android Emulator: `http://10.0.2.2:3000/api`
- Physical device: Use your computer's IP address

### Running the App

```bash
# Start Expo development server
npm start

# Or run directly on:
npm run ios     # iOS Simulator
npm run android # Android Emulator
```

## Project Structure

```
mobile/
├── App.tsx                    # Main entry point
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── ProductCard.tsx
│   │   ├── CartItemCard.tsx
│   │   ├── OrderCard.tsx
│   │   └── Loading.tsx
│   ├── context/               # React Context providers
│   │   ├── AuthContext.tsx    # Authentication state
│   │   └── CartContext.tsx    # Shopping cart state
│   ├── navigation/            # React Navigation setup
│   │   └── AppNavigator.tsx
│   ├── screens/               # App screens
│   │   ├── auth/              # Login, Register
│   │   ├── home/              # Home/Dashboard
│   │   ├── products/          # Product listing & details
│   │   ├── cart/              # Cart & Checkout
│   │   ├── orders/            # Order list & details
│   │   └── profile/           # Profile & Addresses
│   ├── services/              # API service
│   │   └── api.ts
│   └── types/                 # TypeScript types
│       └── index.ts
└── assets/                    # Images and fonts
```

## Screens

| Screen | Description |
|--------|-------------|
| Login | Email/password login |
| Register | New account registration |
| Home | Categories, featured products, search |
| Products | Product grid with filters |
| ProductDetail | Product info, add to cart |
| Cart | Cart items, quantities |
| Checkout | Address, payment method, place order |
| Orders | Order history list |
| OrderDetail | Order info, tracking timeline |
| Profile | User info, stats, menu |
| Addresses | Manage delivery addresses |

## Building for Production

```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android

# Or use EAS Build (recommended)
eas build --platform ios
eas build --platform android
```

## Notes

- The app uses Expo for easier development and deployment
- Tokens are stored securely using Expo Secure Store
- Automatic token refresh on 401 errors
- Pull-to-refresh on all list screens
