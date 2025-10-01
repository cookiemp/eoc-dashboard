# ERCS Dashboard - Admin Panel User Guide

**For:** ERCS Emergency Operations Center Staff  
**Version:** 1.0  
**Last Updated:** October 1, 2025

---

## Table of Contents
1. [Accessing the Admin Panel](#accessing-the-admin-panel)
2. [Uploading PDF Field Reports](#uploading-pdf-field-reports)
3. [Reviewing Extracted Incidents](#reviewing-extracted-incidents)
4. [Managing Incidents](#managing-incidents)
5. [Understanding the Dashboard](#understanding-the-dashboard)
6. [Troubleshooting](#troubleshooting)

---

## 1. Accessing the Admin Panel

### Login
1. Navigate to `/admin/login` on the dashboard
2. Enter the admin password (provided by system administrator)
3. Click "Login"

### Navigation
Once logged in, you can access:
- **Dashboard** - Statistics and quick actions
- **Upload** - Upload new PDF reports
- **Pending** - Review incidents awaiting approval
- **Logout** - End your session

---

## 2. Uploading PDF Field Reports

### Step-by-Step Upload Process

1. **Go to Upload Page**
   - Click "Upload PDF Report" from the admin dashboard
   - Or navigate to `/admin/upload`

2. **Select PDF Files**
   - **Drag & Drop:** Drag PDF files into the upload area
   - **Browse:** Click "Browse Files" to select from your computer
   - **Multiple Files:** You can upload multiple PDFs at once

3. **File Requirements**
   - File type: PDF only
   - Maximum size: 5MB per file
   - Content: Must contain readable text (not image-only PDFs)

4. **Choose Approval Mode**
   - **Auto-approve OFF** (recommended): Incidents go to review queue
   - **Auto-approve ON**: Incidents publish directly to dashboard

5. **Extract Incidents**
   - Click "Extract Incidents with AI"
   - Wait for AI to process (may take 30-60 seconds per PDF)
   - Review the extracted incidents

6. **Publish**
   - Review extracted information for accuracy
   - Click "Publish to Dashboard" or "Send to Review Queue"
   - Confirmation message will appear

### What the AI Extracts

The AI automatically identifies and extracts:
- **Incident Title**: Brief description
- **Location**: Region, zone, town
- **Coordinates**: Latitude and longitude for map display
- **Category**: Health, food security, displacement, WASH, security, or other
- **Severity**: Low, medium, high, or critical
- **Affected People**: Number of people impacted (if mentioned)
- **Description**: 2-3 sentence summary
- **Confidence Score**: How certain the AI is about the extraction

### Best Practices

✅ **DO:**
- Upload reports with clear, structured text
- Include location names (region, zone, woreda)
- Use auto-approve only for trusted, pre-verified reports
- Review AI-extracted data before publishing

❌ **DON'T:**
- Upload image-only scanned PDFs without OCR
- Upload files larger than 5MB
- Auto-approve without reviewing if accuracy is critical
- Upload non-humanitarian reports

---

## 3. Reviewing Extracted Incidents

### Accessing Pending Incidents
1. Go to `/admin/pending`
2. View list of incidents awaiting approval

### Review Process

For each incident, you'll see:
- **Title and Description**: What the AI extracted
- **Location Details**: Name and coordinates
- **Category and Severity**: Type and urgency level
- **Affected Population**: Number of people impacted
- **Confidence Score**: AI's certainty (0-100%)
- **Reported Date**: When the incident was reported

### Review Actions

**✅ Approve**
- Publishes incident to main dashboard
- Appears on the incident map immediately
- Available to all dashboard users

**❌ Reject/Delete**
- Removes incident permanently
- Use for duplicate or incorrect extractions
- Cannot be undone

### What to Check

1. **Location Accuracy**: Is the location correct?
2. **Incident Details**: Is the description accurate?
3. **Severity Level**: Does it match the report?
4. **Duplicates**: Is this already on the dashboard?
5. **Confidence Score**: Low scores (<70%) need extra review

---

## 4. Managing Incidents

### View All Incidents
- Access through admin dashboard
- See all field report incidents (pending + approved)
- Filter and search options available

### Actions Available
- **View Details**: See full incident information
- **Archive**: Hide from dashboard but keep in database
- **Delete**: Permanently remove from system

---

## 5. Understanding the Dashboard

### Statistics Cards

**Total Field Incidents**
- All active field report incidents
- Includes both pending and approved

**Pending Review**
- Number of incidents awaiting approval
- High priority - review regularly

**Recent Uploads**
- PDF files uploaded in the last 7 days
- Tracks upload activity

### Main Dashboard Integration

Approved incidents appear on the main dashboard:
- **Map Markers**: Diamond-shaped pins for field reports
- **Color Coding**: 
  - Red = Health emergencies
  - Green = Food security
  - Blue = Displacement
  - Cyan = WASH
  - Amber = Security
  - Gray = Other
- **Severity Indicators**: Visual differentiation by urgency

---

## 6. Troubleshooting

### Upload Issues

**"No text could be extracted from the PDF"**
- PDF is image-based without text layer
- Solution: Use OCR software to convert images to text first

**"File too large"**
- PDF exceeds 5MB limit
- Solution: Compress PDF or split into multiple files

**"Invalid file type"**
- File is not a PDF
- Solution: Convert document to PDF format first

### Extraction Issues

**AI didn't find any incidents**
- Report may not contain incident information
- Text may be unclear or unstructured
- Solution: Check PDF content and try rephrasing

**Wrong location coordinates**
- AI couldn't map location name to coordinates
- Solution: Review and manually verify location before approval

**Low confidence scores**
- AI is uncertain about extraction
- Solution: Manually review and correct before publishing

### Login Issues

**"Unauthorized" error**
- Incorrect password
- Session expired
- Solution: Re-enter password or contact system administrator

### Display Issues

**Approved incidents not showing on map**
- Browser cache may be stale
- Solution: Refresh the main dashboard (Ctrl+F5)

---

## Support

For technical support or questions:
- Contact your system administrator
- Refer to CODEBASE_OVERVIEW.md for technical details
- Check application logs for error messages

---

## Quick Reference

| Task | Path | Time |
|------|------|------|
| Login | `/admin/login` | < 1 min |
| Upload PDF | `/admin/upload` | 1-2 min per PDF |
| Review incidents | `/admin/pending` | 2-5 min per incident |
| View statistics | `/admin` | Instant |
| Logout | Click "Logout" button | Instant |

---

**Remember:** The AI is a tool to assist, not replace, human judgment. Always review extracted data before publishing to the dashboard.