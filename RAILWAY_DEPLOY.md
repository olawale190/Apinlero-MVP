# Deploy Isha Treat to Railway

Step-by-step guide to deploy your Isha Treat wholesale platform to Railway.

---

## Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app/)
2. Click **Login** → **Login with GitHub**
3. Authorize Railway to access your GitHub

---

## Step 2: Create New Project

1. Click **New Project**
2. Select **Deploy from GitHub repo**
3. Find and select `olawale190/Apinlero-MVP`
4. Railway will start building automatically

---

## Step 3: Add PostgreSQL Database

1. In your project, click **New**
2. Select **Database** → **Add PostgreSQL**
3. Railway automatically sets `DATABASE_URL`

---

## Step 4: Add Environment Variables

Click on your app service → **Variables** → **Add Variable**

Add these variables:

| Variable | Value |
|----------|-------|
| `JWT_SECRET` | (generate a random 32+ character string) |
| `NODE_ENV` | `production` |
| `CLOUDINARY_CLOUD_NAME` | `dw4dzt8jp` |
| `CLOUDINARY_API_KEY` | `121532887588236` |
| `CLOUDINARY_API_SECRET` | (your secret) |
| `WHATSAPP_PHONE_NUMBER_ID` | (from Meta) |
| `WHATSAPP_ACCESS_TOKEN` | (from Meta) |
| `ADMIN_WHATSAPP_PHONE` | `2348012345678` |

**Note:** `DATABASE_URL` is added automatically by Railway when you add PostgreSQL.

---

## Step 5: Deploy

Railway deploys automatically when you:
- Add environment variables
- Push to GitHub

Check the **Deployments** tab to see build progress.

---

## Step 6: Get Your URL

Once deployed:
1. Click **Settings** → **Domains**
2. Click **Generate Domain**
3. Your app is live at: `https://your-app.up.railway.app`

**URLs:**
- API: `https://your-app.up.railway.app/api`
- Admin Panel: `https://your-app.up.railway.app/admin`
- Health Check: `https://your-app.up.railway.app/api/health`

---

## Step 7: Create Admin User

1. Open your app URL in browser
2. Register a new account via API:

```bash
curl -X POST https://your-app.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ishatreat.com",
    "password": "Admin123!",
    "firstName": "Isha",
    "lastName": "Admin",
    "phone": "08012345678"
  }'
```

3. Connect to Railway's PostgreSQL to update role:
   - Go to PostgreSQL service → **Data** tab
   - Run: `UPDATE users SET role = 'ADMIN' WHERE email = 'admin@ishatreat.com';`

4. Login at `https://your-app.up.railway.app/admin`

---

## Troubleshooting

### Build Failed
- Check **Deployments** → Click on failed deployment → View logs
- Common issues: missing environment variables

### Database Connection Error
- Make sure PostgreSQL service is running
- Check `DATABASE_URL` is set correctly

### 502 Error
- App might still be starting (wait 1-2 minutes)
- Check logs for errors

---

## Costs

| Plan | Limits | Price |
|------|--------|-------|
| **Free Trial** | $5 credit, no credit card | Free |
| **Hobby** | $5/month included | $5/month |
| **Pro** | Team features | $20/month |

The free trial is enough to test your MVP!

---

## Updating Your App

To deploy updates:
1. Push changes to GitHub
2. Railway automatically rebuilds and deploys

```bash
git add .
git commit -m "Update feature"
git push
```

---

## Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Click **Add Custom Domain**
3. Enter your domain (e.g., `api.ishatreat.com`)
4. Add the DNS records Railway provides

---

**Your Isha Treat platform is now live!** 🎉
