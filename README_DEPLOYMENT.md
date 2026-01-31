# Apinlero - Deployment Documentation

Complete guide to deploy your WhatsApp e-commerce platform to production.

---

## 📚 Documentation Index

Your project now includes comprehensive deployment guides:

### 1. [WHATSAPP_NGROK_SETUP.md](WHATSAPP_NGROK_SETUP.md) ⭐ START HERE
**Test WhatsApp locally with ngrok**
- Complete step-by-step ngrok setup
- Meta WhatsApp configuration
- Local testing instructions
- Debugging guide
- **Use this first** to verify everything works before deploying

### 2. [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md)
**All credentials you need**
- Complete list of environment variables
- Where to get each credential
- Security best practices
- Troubleshooting tips
- Quick copy templates

### 3. [DEPLOY_TO_PRODUCTION.md](DEPLOY_TO_PRODUCTION.md)
**Full production deployment**
- Deploy WhatsApp bot to Railway
- Deploy frontend to Vercel
- Configure production credentials
- Set up monitoring
- Post-deployment checklist

### 4. [Product Population Script](project/scripts/populate-products.js)
**Populate Supabase with products**
- 25 Nigerian grocery store products
- Categories and pricing
- Usage instructions

---

## 🚀 Quick Start Path

Follow this order for best results:

### Phase 1: Local Testing (30 minutes)
1. ✅ Read [WHATSAPP_NGROK_SETUP.md](WHATSAPP_NGROK_SETUP.md)
2. ✅ Get Meta WhatsApp credentials
3. ✅ Configure `.env` files
4. ✅ Start bot with ngrok
5. ✅ Test messaging

### Phase 2: Database Setup (10 minutes)
1. ✅ Get Supabase credentials
2. ✅ Run product population script
3. ✅ Verify data in Supabase dashboard

### Phase 3: Production Deployment (45 minutes)
1. ✅ Read [DEPLOY_TO_PRODUCTION.md](DEPLOY_TO_PRODUCTION.md)
2. ✅ Generate permanent WhatsApp token
3. ✅ Deploy to Railway
4. ✅ Deploy to Vercel
5. ✅ Update Meta webhook URL
6. ✅ Test production

**Total time: ~90 minutes**

---

## 📋 Prerequisites Checklist

Before you begin, ensure you have:

### Accounts
- [ ] Meta Developer Account (free)
- [ ] WhatsApp Business Account (free)
- [ ] Supabase Account (free tier available)
- [ ] Railway Account (free tier available)
- [ ] Vercel Account (free tier available)
- [ ] GitHub Account (free)
- [ ] Stripe Account (optional, for payments)

### Tools Installed
- [ ] Node.js (v18 or higher)
- [ ] npm or yarn
- [ ] ngrok (`brew install ngrok`)
- [ ] Git
- [ ] Code editor (VS Code recommended)

### Access Ready
- [ ] Phone number for WhatsApp testing
- [ ] Admin access to Meta Business Suite
- [ ] Ability to receive WhatsApp messages

---

## 🎯 What You're Deploying

### WhatsApp Bot (Backend)
**Location:** `/whatsapp-bot/`
**Deploy to:** Railway
**Features:**
- Receives WhatsApp messages
- Processes orders
- Manages product catalog
- Customer interactions
- Multi-tenant support

**Tech Stack:**
- Node.js + Express
- Meta WhatsApp Cloud API
- Supabase (PostgreSQL)
- OpenAI integration (optional)

### Frontend Dashboard (Admin Panel)
**Location:** `/project/`
**Deploy to:** Vercel
**Features:**
- Order management
- Product catalog
- Customer management
- Analytics dashboard
- Stripe payments

**Tech Stack:**
- React + TypeScript
- Vite
- TailwindCSS
- Supabase Auth
- Stripe integration

---

## 🔑 Credentials You'll Need

### Meta WhatsApp
- Phone Number ID
- Access Token (temporary for testing, permanent for production)
- Verify Token (you create this)
- Business ID
- App Secret

**Get from:** [developers.facebook.com](https://developers.facebook.com)

### Supabase
- Project URL
- Anon Key (for frontend)
- Service Role Key (for backend)

**Get from:** [supabase.com/dashboard](https://supabase.com/dashboard)

### Stripe (Optional)
- Publishable Key
- Secret Key
- Webhook Secret

**Get from:** [dashboard.stripe.com](https://dashboard.stripe.com)

**See [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) for detailed instructions**

---

## 🏗️ Architecture Overview

```
┌─────────────────┐
│   Customer      │
│  (WhatsApp)     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Meta Cloud    │
│   WhatsApp API  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐      ┌──────────────┐
│  WhatsApp Bot   │─────→│   Supabase   │
│   (Railway)     │      │  (Database)  │
└─────────────────┘      └──────┬───────┘
                                 │
                                 ↓
                         ┌──────────────┐
                         │   Frontend   │
                         │   (Vercel)   │
                         └──────────────┘
                                 │
                                 ↓
                         ┌──────────────┐
                         │    Admin     │
                         │ (Dashboard)  │
                         └──────────────┘
```

---

## 🧪 Testing Checklist

### Local Testing (ngrok)
- [ ] Bot server starts without errors
- [ ] ngrok tunnel is active
- [ ] Webhook verification succeeds
- [ ] Bot responds to "Hello"
- [ ] Products can be queried
- [ ] Orders can be placed
- [ ] Logs show activity

### Production Testing
- [ ] Railway deployment successful
- [ ] Vercel deployment successful
- [ ] Production webhook configured
- [ ] Bot responds on production
- [ ] Frontend loads correctly
- [ ] Login/signup works
- [ ] Products display
- [ ] Orders sync from WhatsApp
- [ ] Payments work (if enabled)

---

## 🛠️ Common Issues & Solutions

### Issue: "Webhook verification failed"
**Solution:**
- Check ngrok/Railway URL is correct
- Verify token must match exactly (case-sensitive)
- Ensure bot server is running
- Check Meta webhook configuration

### Issue: "Bot not responding to messages"
**Solution:**
- Check Railway logs for errors
- Verify environment variables are set
- Ensure webhook is subscribed to 'messages' field
- Test webhook endpoint manually

### Issue: "Products not loading in dashboard"
**Solution:**
- Check Supabase credentials
- Run product population script
- Verify RLS policies are correct
- Check browser console for errors

### Issue: "Payments not processing"
**Solution:**
- Verify using correct Stripe keys (test vs live)
- Check webhook is configured
- Ensure VITE_ENABLE_STRIPE_PAYMENTS=true
- Review Stripe dashboard logs

**More troubleshooting in [DEPLOY_TO_PRODUCTION.md](DEPLOY_TO_PRODUCTION.md#troubleshooting)**

---

## 📊 Monitoring Your Deployment

### Railway (WhatsApp Bot)
```bash
# View logs
railway logs

# Check status
railway status

# View environment variables
railway variables
```

### Vercel (Frontend)
```bash
# View logs
vercel logs

# Check deployments
vercel ls

# View environment variables
vercel env ls
```

### Supabase (Database)
- Go to Dashboard > Table Editor
- Check SQL Editor > Logs
- Monitor API usage
- Review Auth users

---

## 💰 Cost Estimates

### Free Tier (For Testing)
- **Railway**: 500 hours/month free
- **Vercel**: 100GB bandwidth/month free
- **Supabase**: 500MB database free
- **Meta WhatsApp**: 1,000 messages/month free
- **ngrok**: Free with limitations

**Total: $0/month** for testing and small scale

### Production (Recommended)
- **Railway**: ~$5-10/month (hobby plan)
- **Vercel**: $20/month (pro) or free for personal
- **Supabase**: $25/month (pro) or free for starter
- **Meta WhatsApp**: Pay per message after free tier
- **Stripe**: 2.9% + $0.30 per transaction

**Estimated: $50-60/month** + transaction fees

---

## 🔒 Security Checklist

Before going live:

- [ ] All `.env` files in `.gitignore`
- [ ] No credentials committed to git
- [ ] Production keys different from test
- [ ] RLS enabled on all Supabase tables
- [ ] Webhook signature verification enabled
- [ ] HTTPS only (HTTP disabled)
- [ ] Rate limiting configured
- [ ] Error monitoring set up (Sentry)
- [ ] Backup strategy defined
- [ ] Access logs reviewed

---

## 📈 Post-Deployment Tasks

### Within 24 Hours
1. Monitor error rates
2. Test all user flows
3. Check database for anomalies
4. Verify email notifications work
5. Test from multiple devices

### Within 1 Week
1. Add custom domains
2. Set up SSL certificates
3. Configure monitoring alerts
4. Implement backup strategy
5. Performance optimization
6. Load testing

### Within 1 Month
1. Review costs and optimize
2. Set up CI/CD pipeline
3. Add more test coverage
4. Document internal processes
5. Train team on platform
6. Collect user feedback

---

## 🎓 Learning Resources

### Official Documentation
- **WhatsApp Business API**: https://developers.facebook.com/docs/whatsapp
- **Railway**: https://docs.railway.app
- **Vercel**: https://vercel.com/docs
- **Supabase**: https://supabase.com/docs
- **Stripe**: https://stripe.com/docs

### Video Tutorials
- Meta WhatsApp Setup: Search YouTube for "WhatsApp Cloud API tutorial"
- Railway Deployment: "Deploy Node.js to Railway"
- Vercel Deployment: "Deploy React app to Vercel"

### Community Support
- **Railway Discord**: https://discord.gg/railway
- **Vercel Discord**: https://vercel.com/discord
- **Supabase Discord**: https://discord.supabase.com

---

## 🆘 Getting Help

### Before Asking for Help
1. Check error logs (Railway/Vercel)
2. Review troubleshooting section
3. Verify environment variables
4. Test individual components
5. Search documentation

### When Asking for Help
Provide:
- Exact error message
- What you were trying to do
- Steps to reproduce
- Relevant logs
- Environment (dev/production)

---

## ✅ Success Criteria

You'll know deployment is successful when:

1. ✅ Bot responds to WhatsApp messages within 2 seconds
2. ✅ Dashboard loads and shows products
3. ✅ Orders placed via WhatsApp appear in dashboard
4. ✅ Payments process successfully (if enabled)
5. ✅ No errors in logs for 24 hours
6. ✅ Performance is acceptable (< 1s page load)
7. ✅ Mobile experience is smooth
8. ✅ You can process a real order end-to-end

---

## 🎉 Next Steps After Deployment

1. **Add more products** - Expand your catalog
2. **Customize branding** - Update colors, logos, text
3. **Set up analytics** - Add Google Analytics
4. **Create marketing materials** - Share your WhatsApp number
5. **Train staff** - Show them how to use the dashboard
6. **Gather feedback** - Get customer input
7. **Iterate** - Improve based on usage

---

## 📞 Quick Links

- **Meta Developers**: https://developers.facebook.com
- **Railway Dashboard**: https://railway.app/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Stripe Dashboard**: https://dashboard.stripe.com
- **GitHub Repository**: https://github.com/your-repo

---

## 📝 Version History

- **v1.0** - Initial deployment documentation
- Includes: WhatsApp bot, frontend dashboard, product catalog
- Multi-tenant architecture
- Stripe payments integration
- Comprehensive monitoring

---

**Ready to deploy? Start with [WHATSAPP_NGROK_SETUP.md](WHATSAPP_NGROK_SETUP.md)!** 🚀

Questions? Check the troubleshooting sections in each guide or review [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) for credential issues.

**Good luck with your deployment!** 🎊
