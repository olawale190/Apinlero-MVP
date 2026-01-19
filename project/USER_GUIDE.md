# 📱 Isha's Treat Order Management System - User Guide

## Welcome!

This guide will help you use the Àpínlẹ̀rọ order management platform for Isha's Treat & Groceries.

## 🚀 Getting Started

### Accessing the System

**Local Development:**
- URL: http://localhost:5173
- No login required (will be added in Phase 2)

**Production:**
- URL: (Your deployed URL)
- Bookmark this for quick access

### Dashboard Overview

When you open the application, you'll see:

1. **AI Daily Insight** (top section with colored cards)
2. **Orders Table** (main section showing all orders)
3. **Navigation** (sidebar or tabs)

## 📊 Understanding the AI Daily Insight

### What is it?

The AI Daily Insight appears at the top of your dashboard and gives you smart insights about your business today.

### Insight Cards Explained:

#### 1. Order Volume Trend (Teal card)
- **What it shows:** How today's orders compare to your usual [weekday] average
- **Example:** "Orders 25% above your Tuesday average"
- **What to do:** If higher than usual, prepare extra stock. If lower, check if there's a reason.

#### 2. Top Product (Blue card)
- **What it shows:** Your best-selling product today
- **Example:** "Jollof Rice Mix (12 orders) - stock running low"
- **What to do:** Reorder popular items before they run out

#### 3. Peak Channel (Purple card)
- **What it shows:** Which channel (WhatsApp, Web, Phone, Walk-in) has the most orders
- **Example:** "WhatsApp: 8 orders (53%)"
- **What to do:** Know where your customers prefer to order from

#### 4. Urgent Actions (Orange/Green card)
- **What it shows:** Orders that need immediate attention
- **Example:** "5 orders awaiting confirmation - prioritize now"
- **What to do:** Process pending orders first

### Priority Orders Section

Below the cards, if there are urgent orders, you'll see:

```
⚡ Urgent: Prioritize These Orders
• John Smith - WhatsApp - £45.50
• Mary Johnson - Web - £62.00
```

**Action:** These orders are pending and should be confirmed/processed first.

## 📋 Managing Orders

### Orders Table Columns:

| Column | What it means |
|--------|---------------|
| **Time** | When the order was placed |
| **Customer** | Customer name and phone number |
| **Channel** | How they ordered (WhatsApp/Web/Phone/Walk-in) |
| **Items** | Number of products in the order |
| **Total** | Order total including delivery fee |
| **Status** | Current order status |
| **Actions** | Click to expand details |

### Order Statuses:

🟡 **Pending** - New order, awaiting confirmation
- **What to do:** Review order, confirm stock available, change to "Confirmed"

🔵 **Confirmed** - Order confirmed, ready for preparation/delivery
- **What to do:** Prepare items, arrange delivery, change to "Delivered" when complete

🟢 **Delivered** - Order completed
- **What to do:** Nothing - order is complete

### How to View Order Details

1. **Click on any order row** in the table
2. The row expands to show:
   - **Order Details:** Item breakdown with quantities and prices
   - **Customer Information:** Full address, phone, notes
   - **Delivery Information:** Delivery fee, special instructions
   - **Payment Status:** Paid/Pending, payment method

### How to Change Order Status

1. **Find the order** in the table
2. **Click the status dropdown** (on the right)
3. **Select new status:**
   - Pending → Confirmed (when you've verified the order)
   - Confirmed → Delivered (when order is delivered)

The system automatically saves the change.

### Channel Badges Explained:

- 🟢 **WhatsApp** - Green badge
- 🔵 **Web** - Blue badge
- 🟣 **Phone** - Purple badge
- 🟡 **Walk-in** - Yellow badge

## 💰 Payment Tracking

### Payment Status:

- **Pending** - Payment not received yet
- **Paid** - Payment received
- **Failed** - Payment attempt failed (for card payments)
- **Refunded** - Payment refunded to customer

### Payment Methods:

- **Cash** - Cash on delivery or in-store
- **Card** - Debit/credit card (via Stripe)
- **Bank Transfer** - Direct bank transfer
- **Online** - Website payment

## 🛍️ Product Management

### Current Products:

Your catalog includes 15 products:
- Jollof Rice Mix - £8.50
- Plantain (Green) - £3.25
- Palm Oil (5L) - £25.00
- Egusi Seeds - £12.50
- (and 11 more...)

### Stock Tracking:

Each product has:
- **Current stock quantity** - How many you have
- **Low stock threshold** - When to reorder (default: 10 units)

The AI will alert you when stock is running low.

## 👥 Customer Information

### Customer Details:

When you click on an order, you can see:
- Customer name
- Phone number
- Email (if provided)
- Delivery address
- Order history (in future update)

### Customer Types:

- **Regular** - Standard customer
- **VIP** - High-value repeat customer
- **Wholesale** - Business/bulk buyer

## 📈 Understanding Your Numbers

### Today's Revenue:

Look at the AI Daily Insight or top of dashboard to see:
- **Total orders today** - Number of orders
- **Total revenue** - Money earned today
- **Average order value** - Revenue ÷ Number of orders

### Example:
```
15 orders | £702.50 revenue | £46.83 avg order value
```

### Channel Distribution:

The AI shows which channels bring in the most orders:
- WhatsApp: 45%
- Web: 25%
- Walk-in: 20%
- Phone: 10%

**Use this to:** Focus marketing efforts on popular channels.

## ⚙️ Daily Operations Workflow

### Morning Routine (9:00 AM):

1. **Open the dashboard**
2. **Read AI Daily Insight**
   - Check order volume trend
   - Note any urgent orders
   - Check low stock alerts
3. **Review pending orders**
   - Click each pending order
   - Verify items in stock
   - Change status to "Confirmed"
4. **Prepare confirmed orders**
   - Pack items
   - Print/write delivery labels

### Throughout the Day:

1. **New orders arrive** → Appear at top of table
2. **Review order** → Click to see details
3. **Confirm order** → Change status to "Confirmed"
4. **Prepare order** → Pack items
5. **Complete delivery** → Change status to "Delivered"

### Evening Review (6:00 PM):

1. **Check today's revenue** in AI summary
2. **Review any pending orders** - Follow up if needed
3. **Note top products** - Plan restocking
4. **Check tomorrow's preparation needs**

## 📱 Multi-Channel Order Capture

### WhatsApp Orders:

When customer messages you on WhatsApp:
1. Note down: Customer name, phone, address, items
2. Enter into system manually (for now)
3. In future: Automatic WhatsApp integration

### Web Orders:

- Customer places order on your website
- Automatically appears in system
- Notification sent to you

### Phone Orders:

1. Customer calls
2. Take down order details
3. Enter into system
4. Confirm with customer

### Walk-in Orders:

1. Customer comes to shop
2. Enter order in system
3. Set delivery fee to £0.00
4. Mark as "Walk-in" channel
5. Complete transaction
6. Change status to "Delivered" immediately

## 🔔 Tips for Success

### Best Practices:

1. **Check dashboard every 2-3 hours** during business hours
2. **Confirm orders within 1 hour** of receiving them
3. **Update status promptly** when orders are delivered
4. **Review AI insights daily** to spot trends
5. **Keep stock levels updated** to avoid overselling

### Quick Actions:

- **Need to find a specific customer?** Use browser search (Cmd+F or Ctrl+F)
- **Want to see just pending orders?** Look for yellow "Pending" badges
- **Checking today's revenue?** Look at AI Daily Insight top card

### Time-Saving Tips:

1. **Keyboard shortcuts:**
   - Cmd+R / Ctrl+R: Refresh page
   - Cmd+F / Ctrl+F: Search on page

2. **Browser bookmarks:**
   - Bookmark dashboard URL
   - Bookmark Supabase dashboard (for advanced users)

3. **Multiple tabs:**
   - Keep dashboard open in one tab
   - Use another tab for WhatsApp Web

## ❓ Common Questions

### Q: How do I add a new product?
**A:** Currently requires database access. Contact support or wait for product management feature (Phase 2).

### Q: Can I delete an order?
**A:** Yes, but only if it's a mistake. Orders are tracked for accounting purposes.

### Q: What if I mark an order as "Delivered" by mistake?
**A:** You can change it back by clicking the status dropdown and selecting the correct status.

### Q: How far back can I see orders?
**A:** All orders are stored. The table shows recent orders first (sorted by time).

### Q: Can I print orders?
**A:** Use browser's print function (Cmd+P / Ctrl+P) when order is expanded to show details.

### Q: How do I export orders for accounting?
**A:** Coming in Phase 2. For now, you can view in Supabase dashboard and export to CSV.

## 🆘 Troubleshooting

### Problem: Page won't load

**Solutions:**
1. Check internet connection
2. Refresh page (Cmd+R or Ctrl+R)
3. Clear browser cache
4. Try different browser (Chrome recommended)

### Problem: Orders not updating

**Solutions:**
1. Refresh page
2. Check if Supabase service is active
3. Verify internet connection

### Problem: Can't see order details

**Solutions:**
1. Make sure you're clicking on the order row
2. Try collapsing other open orders first
3. Refresh page

### Problem: Numbers look wrong

**Solutions:**
1. Check the date filter (if available)
2. Verify you're looking at "today's" orders
3. Refresh page to reload data

## 📞 Getting Help

### For Technical Issues:

1. **First:** Try refreshing the page
2. **Second:** Check this troubleshooting section
3. **Third:** Contact: [Your support email/phone]

### For Training:

- This guide covers all basic operations
- Video tutorials available at: [Future link]
- Request hands-on training session

## 🎯 Next Features (Coming Soon)

Phase 2 features planned:
- ✨ Automatic WhatsApp integration
- 📊 Advanced analytics and reports
- 📅 Delivery scheduling
- 👤 Customer login portal
- 📱 Mobile app
- 🔔 SMS/Email notifications
- 💳 Online payment portal
- 📦 Inventory management
- 📈 Sales forecasting

## 🎉 Success!

You're now ready to manage orders efficiently with Àpínlẹ̀rọ!

**Remember:**
- Check AI insights daily
- Confirm pending orders promptly
- Keep order statuses up-to-date
- Monitor stock levels

For any questions, contact [support contact].

---

**Isha's Treat & Groceries** | Powered by Àpínlẹ̀rọ
