# Isha Treat - Setup Guide

A step-by-step guide to get your Isha Treat wholesale grocery platform running.

---

## Prerequisites

Before starting, make sure you have:

- [ ] **Node.js 18+** installed ([download here](https://nodejs.org/))
- [ ] **Git** installed
- [ ] **Code editor** (VS Code recommended)

---

## Step 1: Clone the Repository

```bash
# Clone the project
git clone https://github.com/olawale190/Apinlero-MVP.git

# Navigate to the project folder
cd Apinlero-MVP
```

---

## Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages (Express, Prisma, etc.)

---

## Step 3: Configure Environment Variables

### 3.1 Create `.env` file

```bash
# Copy the example file
cp .env.example .env
```

### 3.2 Edit `.env` file

Open `.env` in your editor and update these values:

```env
# Database (SQLite for development - no changes needed)
DATABASE_URL="file:./dev.db"

# JWT Secret (generate a random string or use this)
JWT_SECRET="your-super-secret-jwt-key-min-32-characters-long-here"

# Server
PORT=3000
NODE_ENV="development"

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME="dw4dzt8jp"
CLOUDINARY_API_KEY="121532887588236"
CLOUDINARY_API_SECRET="your-api-secret-here"
```

---

## Step 4: Set Up the Database

### 4.1 Generate Prisma Client

```bash
npm run prisma:generate
```

### 4.2 Run Database Migrations

```bash
npm run prisma:migrate
```

When prompted, enter a name like: `init`

This creates:
- The SQLite database file (`prisma/dev.db`)
- All tables (users, products, orders, etc.)

---

## Step 5: Start the Server

```bash
npm run dev
```

You should see:

```
╔════════════════════════════════════════════════════════════╗
║               ISHA TREAT - APINLERO MVP                    ║
╠════════════════════════════════════════════════════════════╣
║  Status:      Running                                      ║
║  Port:        3000                                         ║
║  API:         http://localhost:3000/api                    ║
║  Admin Panel: http://localhost:3000/admin                  ║
╚════════════════════════════════════════════════════════════╝
```

---

## Step 6: Create an Admin Account

### 6.1 Register a User

Open a **new terminal** and run:

**On Mac/Linux:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ishatreat.com",
    "password": "Admin123!",
    "firstName": "Isha",
    "lastName": "Admin",
    "phone": "08012345678"
  }'
```

**On Windows (PowerShell):**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method Post -ContentType "application/json" -Body '{"email":"admin@ishatreat.com","password":"Admin123!","firstName":"Isha","lastName":"Admin","phone":"08012345678"}'
```

**Or use Postman/Insomnia:**
- URL: `POST http://localhost:3000/api/auth/register`
- Body (JSON):
```json
{
  "email": "admin@ishatreat.com",
  "password": "Admin123!",
  "firstName": "Isha",
  "lastName": "Admin",
  "phone": "08012345678"
}
```

### 6.2 Make the User an Admin

Open Prisma Studio (database GUI):

```bash
npm run prisma:studio
```

This opens a browser at `http://localhost:5555`

1. Click on **User** table
2. Find your user (admin@ishatreat.com)
3. Click on the `role` field
4. Change `CUSTOMER` to `ADMIN`
5. Click **Save 1 change** (green button)

---

## Step 7: Access the Admin Panel

1. Open your browser
2. Go to: **http://localhost:3000/admin**
3. Login with:
   - Email: `admin@ishatreat.com`
   - Password: `Admin123!`

---

## What You Can Do Now

### Admin Panel (http://localhost:3000/admin)
- [ ] View dashboard statistics
- [ ] Add product categories (with images)
- [ ] Add products (with multiple images)
- [ ] Manage orders
- [ ] Update order status

### API Endpoints (http://localhost:3000/api)
- `/api/health` - Check if server is running
- `/api/auth/login` - User login
- `/api/products` - View products
- `/api/products/categories` - View categories

---

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Run production server |
| `npm run prisma:studio` | Open database GUI |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:generate` | Regenerate Prisma client |

---

## Troubleshooting

### "Port 3000 is already in use"
```bash
# Find and kill the process
# Mac/Linux:
lsof -i :3000
kill -9 <PID>

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### "Cannot find module '@prisma/client'"
```bash
npm run prisma:generate
```

### "Database does not exist"
```bash
npm run prisma:migrate
```

### Prisma Studio not opening
Make sure the server is running first, then open a new terminal for Prisma Studio.

---

## Project Structure

```
Apinlero-MVP/
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── dev.db           # SQLite database (created after migrate)
├── public/
│   └── admin/           # Admin panel files
├── src/
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   ├── middleware/      # Auth, security, validation
│   └── server.ts        # Main entry point
├── mobile/              # React Native app (separate setup)
├── .env                 # Your environment variables
└── package.json         # Dependencies
```

---

## Next Steps

1. **Add Categories** - Go to Admin Panel → Categories → Add Category
2. **Add Products** - Go to Admin Panel → Products → Add Product
3. **Test Mobile App** - See `mobile/README.md` for React Native setup
4. **Set Up Payments** - Add Paystack keys to `.env`

---

## Support

If you have issues:
1. Check the troubleshooting section above
2. Make sure all prerequisites are installed
3. Verify your `.env` file has correct values

---

**Isha Treat** - Your trusted wholesale grocery partner.
