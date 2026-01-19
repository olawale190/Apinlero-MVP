# Àpínlẹ̀rọ - Business Management Dashboard Setup

## Database Setup

Your Supabase database needs to be set up before the dashboard will work properly.

### Steps:

1. Go to your Supabase project: https://0ec90b57d6e95fcbda19832f.supabase.co

2. Navigate to the **SQL Editor** in the left sidebar

3. Create a new query and copy the entire contents of `database-schema.sql`

4. Click **Run** to execute the SQL

This will create:
- **products table** - stores your product catalog
- **orders table** - stores all customer orders
- Row Level Security (RLS) policies for secure access
- Sample products and orders to get you started

## Features

### Dashboard Overview
- Real-time order updates (automatically refreshes when new orders arrive)
- Today's statistics: Orders, Revenue, Pending Orders, Top Channel
- Fully responsive design (works on mobile, tablet, and desktop)

### Order Management
- View all orders with filtering (All, Pending, Confirmed, Delivered)
- Update order status with dropdown
- Expand order rows to see full details
- Color-coded channel badges (WhatsApp, Web, Phone, Walk-in)

### Create New Orders
- Select order channel
- Add customer information
- Add multiple products with quantities
- Automatic total calculation
- Custom delivery fee

### AI Summary
- Generate daily business summary with key metrics
- Order statistics breakdown
- Top-selling products
- Channel performance analysis

## Color Scheme

- **Primary (Teal)**: `#0d9488` - Main actions, buttons, highlights
- **Secondary (Navy)**: `#1e3a5f` - Headings, titles
- **Background**: `#f8fafc` - Page background
- **Cards**: White with shadow

## Technical Details

- Built with React + TypeScript + Vite
- Supabase for database and real-time updates
- Tailwind CSS for styling
- Lucide React for icons
- Inter font family

## Demo Credentials

The dashboard is configured for demo purposes with public access policies. In production, you should:
1. Implement proper authentication
2. Update RLS policies to restrict access based on user roles
3. Add data validation
4. Implement proper error handling
