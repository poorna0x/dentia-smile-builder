# 📊 Analytics System Setup Guide

## 🎯 **Overview**

The Analytics system provides comprehensive insights into your dental clinic's performance, including:
- **Income breakdown** by payment method (Cash/UPI/Card)
- **Doctor performance** with multi-doctor attribution
- **Appointment statistics** (completed, cancelled, rescheduled)
- **Treatment analytics** with revenue tracking

## 🚀 **Quick Setup**

### Step 1: Run Analytics Database Setup
1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the entire content from `supabase/setup-analytics-system.sql`
4. Click **Run**

### Step 2: Access Analytics
1. Login to your admin dashboard
2. Click the **"Analytics"** button in the navigation
3. Only **dentists** can access analytics (staff members cannot)

## 📊 **Features**

### **1. Time Period Selection**
- **Daily**: Today's data
- **Weekly**: Last 7 days
- **Monthly**: Current month
- **Yearly**: Current year
- **Custom**: Date range picker

### **2. Income Analytics**
**Smart Display Logic**:
- Shows only payment methods with transactions > ₹0
- Displays amount and percentage breakdown
- Color-coded for easy identification

**Example**:
```
💰 Today's Income: ₹15,000
├── 💵 Cash: ₹8,000 (53%)
├── 📱 UPI: ₹7,000 (47%)
└── 💳 Card: (Hidden - no transactions)
```

### **3. Doctor Performance**
**Multi-Doctor Attribution System**:
- **Started**: Doctor who initiated the treatment
- **Completed**: Doctor who finished the treatment
- **Assisted**: Doctor who helped during the procedure

**Configurable Split**:
- Set attribution percentage (e.g., 70/30, 50/50)
- Track both start and completion
- Revenue attribution based on percentage

### **4. Appointment Analytics**
**Key Metrics**:
- Total appointments
- Completed appointments
- Cancelled appointments
- Rescheduled appointments
- No-shows
- Completion rate
- Cancellation rate

### **5. Treatment Analytics**
**Comprehensive Tracking**:
- Total treatments performed
- Revenue by treatment type
- Average treatment value
- Treatment popularity

## 🔧 **Database Schema**

### **New Tables Created**:

#### **1. doctor_attributions**
```sql
- id: UUID (Primary Key)
- treatment_id: UUID (References dental_treatments)
- clinic_id: UUID (References clinics)
- doctor_id: UUID (References dentists)
- attribution_type: ENUM ('Started', 'Completed', 'Assisted')
- attribution_percentage: DECIMAL(5,2) (0-100%)
- started_at: TIMESTAMP
- completed_at: TIMESTAMP
- notes: TEXT
```

#### **2. analytics_cache**
```sql
- id: UUID (Primary Key)
- clinic_id: UUID (References clinics)
- cache_key: VARCHAR(255)
- cache_data: JSONB
- cache_date: DATE
- expires_at: TIMESTAMP
```

### **New Functions Created**:

#### **1. get_income_breakdown()**
- Returns income breakdown by payment method
- Automatically hides methods with ₹0 transactions
- Calculates percentages

#### **2. get_doctor_performance()**
- Returns doctor performance metrics
- Handles multi-doctor attribution
- Calculates revenue attribution

#### **3. get_appointment_analytics()**
- Returns appointment statistics
- Calculates completion/cancellation rates
- Provides status breakdown

#### **4. get_treatment_analytics()**
- Returns treatment performance data
- Shows revenue by treatment type
- Calculates averages

#### **5. cache_analytics_data()**
- Caches analytics data for performance
- 24-hour cache expiration
- Automatic refresh

## 📱 **User Interface**

### **Navigation**
- Analytics button in admin dashboard
- Purple-themed button for easy identification
- Only visible to dentists

### **Dashboard Layout**
1. **Header**: Back button, export, refresh
2. **Time Period Selector**: Dropdown + custom date picker
3. **Income Analytics**: Payment method breakdown
4. **Appointment Statistics**: Status breakdown
5. **Doctor Performance**: Individual doctor metrics
6. **Treatment Analytics**: Treatment type breakdown

### **Export Feature**
- CSV export with all analytics data
- Includes date range and generation timestamp
- Automatic file naming

## 🔒 **Security & Permissions**

### **Access Control**
- **Dentists**: Full access to all analytics
- **Staff**: No access (redirected to admin dashboard)
- **Patients**: No access

### **Data Privacy**
- All data filtered by clinic_id
- Row Level Security enabled
- Multi-tenant data isolation

## 📈 **Performance Optimization**

### **Caching Strategy**
- Daily cache refresh
- 24-hour cache expiration
- Real-time fetch when needed
- Reduces database load

### **Query Optimization**
- Indexed tables for fast queries
- Efficient date range filtering
- JSON aggregation for complex data

## 🛠️ **Customization**

### **Adding New Analytics**
1. Create new function in `setup-analytics-system.sql`
2. Add to `cache_analytics_data()` function
3. Update Analytics.tsx component
4. Add new UI section

### **Modifying Attribution Logic**
Edit the `get_doctor_performance()` function to change:
- Attribution calculation method
- Revenue split logic
- Performance metrics

### **Custom Time Periods**
Add new time periods in Analytics.tsx:
1. Add to TimePeriod type
2. Update dateRange calculation
3. Add to Select component

## 🔍 **Troubleshooting**

### **Common Issues**:

#### **1. "No data available"**
- Check if date range has data
- Verify clinic_id is correct
- Ensure treatments have payments

#### **2. "Permission denied"**
- Verify user is logged in as dentist
- Check session storage for userRole
- Clear cache and re-login

#### **3. "Function not found"**
- Run `setup-analytics-system.sql` again
- Check Supabase function permissions
- Verify function names match

#### **4. "Slow loading"**
- Check cache expiration
- Verify database indexes
- Monitor Supabase performance

### **Debug Mode**
Enable console logging in Analytics.tsx:
```typescript
console.log('Analytics data:', { incomeData, doctorData, appointmentData, treatmentData });
```

## 📋 **Maintenance**

### **Regular Tasks**:
1. **Monthly**: Review cache performance
2. **Quarterly**: Update attribution rules if needed
3. **Annually**: Archive old analytics data

### **Backup**:
- Analytics data backed up with main database
- Export important reports regularly
- Keep CSV exports for historical data

## 🎯 **Next Steps**

### **Phase 2 Features** (Future):
- **Charts and Graphs**: Visual data representation
- **Trend Analysis**: Historical comparisons
- **Predictive Analytics**: Revenue forecasting
- **Email Reports**: Automated analytics emails
- **Mobile Analytics**: Mobile-optimized dashboard

### **Integration Opportunities**:
- **Payment Gateway Analytics**: Direct payment method detection
- **Patient Analytics**: Patient lifetime value
- **Operational Analytics**: Clinic utilization metrics
- **Financial Analytics**: Profit/loss tracking

## ✅ **Setup Checklist**

- [ ] Run `setup-analytics-system.sql` in Supabase
- [ ] Verify functions are created successfully
- [ ] Test analytics access as dentist
- [ ] Verify staff cannot access analytics
- [ ] Test time period selection
- [ ] Verify income breakdown display
- [ ] Test export functionality
- [ ] Check mobile responsiveness
- [ ] Verify data accuracy
- [ ] Test cache performance

## 🆘 **Support**

If you encounter issues:
1. Check the troubleshooting section
2. Verify database setup
3. Check browser console for errors
4. Contact support with error details

---

**🎉 Analytics system is now ready to provide insights into your clinic's performance!**
