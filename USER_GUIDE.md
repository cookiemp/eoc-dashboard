# ERCS Intel Dashboard - User Guide

**Quick Reference for Emergency Operations Center Staff**

---

## 🎯 What is the ERCS Intel Dashboard?

The ERCS Intel Dashboard is your real-time situational awareness tool that:
- Monitors humanitarian news from Ethiopian sources
- Displays emergency incidents on an interactive map
- Syncs field reports from KoBoToolbox automatically
- Provides AI-powered daily briefings

---

## 📱 Accessing the Dashboard

**Public Dashboard**: [Your deployment URL]
- No login required
- Refreshes automatically every 30 minutes
- Works on desktop, tablet, and mobile

**Admin Dashboard**: [Your deployment URL]/admin
- Login with your admin credentials
- Manage and approve field incidents
- View crawler health status

---

## 🗺️ Using the Interactive Map

### Understanding Incident Markers

- **📰 White circle** = Incident from news sources
- **📋 White star** = Field report from KoBoToolbox

### Viewing Incident Details

1. **Hover** over any marker to see the incident title
2. **Click** on a marker to open the full incident dossier
3. The dossier shows:
   - Incident title and description
   - AI-generated executive summary
   - Location information

### Closing the Incident Window

- Click the **Close** button at the bottom
- Click **outside** the window
- Press **ESC** on your keyboard

---

## 📊 Reading the AI-Powered Daily Briefing

The AI summary appears at the bottom of the dashboard and includes:

### Summary Structure

**Field Incidents** (appear first - marked with **[More]** links)
- Direct reports from the field (most reliable information)
- Click **[More]** to jump to the incident on the map

**News Articles** (appear after field incidents - marked with **[Source]** links)
- Humanitarian news from Ethiopian sources
- Click **[Source]** to read the full article

### Health Alerts

- Look for the **⚕️** emoji before any bullet point
- These indicate public health emergencies (disease outbreaks, medical supplies, etc.)
- A banner appears when health alerts are detected

---

## 📋 Understanding Field Incidents

### What Are Field Incidents?

Field incidents are reports submitted through **IFRC KoBoToolbox** by ERCS branches about ongoing emergencies.

### Field Incident Categories

| Icon Color | Category | Examples |
|------------|----------|----------|
| 🔴 Red | Health | Cholera, measles, malaria outbreaks |
| 🟠 Orange | Food Security | Drought, crop failure |
| 🟣 Purple | Displacement | IDPs, evacuations |
| 🔵 Blue | WASH | Floods, water contamination |
| ⚫ Dark Gray | Security | Conflict zones |
| ⚪ Light Gray | Other | General emergencies |

### Severity Levels

- **Critical**: 10,000+ people affected
- **High**: 5,001-10,000 people affected
- **Medium**: 1,001-5,000 people affected
- **Low**: 0-1,000 people affected

---

## 📰 Understanding News Feeds

The dashboard shows two types of news:

### Humanitarian News (Left Column)
- Emergency-related articles
- Disasters and crises
- Humanitarian response updates
- **AI categorizes these automatically**

### General News (Right Column)
- Context-relevant news
- Political updates
- Economic developments
- Other Ethiopian news

---

## 🔄 How Data Updates

### Automatic Updates

| Feature | Update Frequency |
|---------|-----------------|
| Field Incidents (KoBo) | Every 30 minutes |
| News Articles | Every 30 minutes |
| AI Summary | Every 30 minutes |
| Incident Map | Real-time (on page refresh) |

### Manual Refresh

- Click the **refresh button** (🔄) in the top-right corner
- This fetches fresh data immediately

### Last Updated Timestamp

- Check the timestamp next to the refresh button
- Shows when data was last refreshed

---

## 👨‍💼 Admin Dashboard Features

*(For authorized personnel only)*

### Accessing Admin Features

1. Go to `/admin`
2. Enter your credentials
3. Navigate using the sidebar

### Pending Incidents Review

**Purpose**: Approve field incidents with low-confidence geocoding

1. Go to **Pending Review**
2. Review each incident:
   - Check if the location seems correct
   - Verify incident details
3. Click **Approve** or **Archive**
4. Approved incidents appear on the public map

### All Incidents Management

**Purpose**: View and manage all field incidents

- See all active field incidents
- View incident metadata (confidence, reported by, etc.)
- Archive outdated incidents

### PDF Upload

**Purpose**: Extract incidents from PDF field reports

1. Go to **Upload Field Report**
2. Drag and drop a PDF or click to select
3. AI extracts incident information
4. Review and approve before publishing

### Crawler Health

**Purpose**: Monitor news source availability

- Green = Source is working
- Red = Source is down
- Shows last successful crawl time

---

## 💡 Tips for Effective Use

### Daily Workflow Suggestions

1. **Morning**:
   - Check the AI summary for overnight incidents
   - Review any health alerts (⚕️)
   - Check field incidents first (most reliable)

2. **Throughout the Day**:
   - Monitor map for new incidents
   - Click [More] links to investigate field reports
   - Check news sources for context

3. **End of Day**:
   - Review pending field incidents (if admin)
   - Check for any critical severity incidents
   - Note trends in incident types

### Best Practices

✅ **DO**:
- Trust field incidents over news reports
- Click [More] to see full incident details
- Check timestamps for data freshness
- Use the map to understand geographic patterns

❌ **DON'T**:
- Don't rely solely on news articles for ground truth
- Don't ignore health alerts (⚕️)
- Don't forget to approve pending field incidents (admins)

---

## 🆘 Troubleshooting

### Issue: Map is not loading
**Solution**: Refresh the page (Ctrl+R or F5)

### Issue: Incidents not updating
**Solution**: 
1. Check the "Last Updated" timestamp
2. Click the refresh button
3. Wait for automatic 30-minute refresh

### Issue: Can't see field incidents
**Solution**: Field incidents need admin approval first. Check `/admin/pending` if you have access.

### Issue: Admin login not working
**Solution**: Contact your system administrator for credentials

### Issue: AI summary seems outdated
**Solution**: The summary refreshes every 30 minutes. Click refresh to force a new summary.

---

## 📞 Support

For technical issues or questions:
- Contact your system administrator
- Check the [GitHub repository](https://github.com/cookiemp/eoc-dashboard) for updates
- Review the [KoBo Integration Guide](./KOBO_INTEGRATION.md) for field report sync issues

---

## 🔐 Security Reminders

- **Don't share** admin credentials
- **Log out** when finished using the admin dashboard
- **Report** any suspicious activity to your administrator
- **Access only** on trusted devices and networks

---

**Version**: 1.0  
**Last Updated**: October 2025  
**Questions?** Contact your EOC Coordinator

---

*This dashboard is maintained by ERCS with support from IFRC*
