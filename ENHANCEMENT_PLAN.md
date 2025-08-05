# Project Enhancement Plan

## 1. Archived News Page

**Objective:** Create a new page on your dashboard to display archived relevant news articles.

### Steps:
1. **New Next.js Page:**
   - Create a new page `pages/archive.tsx`.

2. **Archived News API:**
   - Add an API route to fetch archived news articles from Firebase with appropriate pagination.
   - API Path: `api/archived-news`

3. **Frontend Integration:**
   - Design a simple UI to list archived articles with date filters.
   - Include a search bar for keyword filtering.

4. **Pagination & Filtering:**
   - Implement pagination to browse large datasets.
   - Enable filtering options for specific dates or keywords.

5. **Data Source:**
   - Use the existing `crawled_articles` collection in Firebase.
   - Query for articles older than a month or by different tags.

## 2. Crawler Health Monitor

**Objective:** Implement a system to monitor the health and performance of your crawlers.

### Steps:
1. **Dashboard Section:**
   - Add a new section on the main dashboard called "Crawler Health".

2. **Health Check API:**
   - Create an API route to fetch crawler health data from Firebase.
   - Use existing metadata like last run timestamps, number of failures, etc.
   - API Path: `api/crawler-health`

3. **Health Metrics:**
   - Display key metrics such as:
     - Last successful run time
     - Average articles crawled per run
     - Error rate
     - Status indicators for each source (BBC, Al Jazeera, UN OCHA)

4. **Alerts Setup:**
   - Integrate with email or Slack to send alerts when crawlers fail multiple times consecutively.

5. **Backend Enhancements:**
   - Add logging in the crawler scripts to capture run duration and specific failures.
   - Store logs and health metrics in a new `crawler_health` collection in Firebase for historical data analysis.

## 3. Additional Suggestions

**a. Localization:**
   - Translate the dashboard to Amharic and other Ethiopian languages.

**b. Mobile Optimization:**
   - Ensure responsive design for better mobile access.

**c. User Personalization:**
   - Allow users to favorite or bookmark articles.

**d. Accessibility Features:**
   - Implement ARIA roles and keyboard navigation.

## Context Summary:
Your dashboard is a Next.js app deployed on Vercel, leveraging Firebase for backend data storage. Recent enhancements include automated news crawling using GitHub Actions. Focused on providing comprehensive Ethiopia news coverage, it integrates various humanitarian data sources. Future improvements aim to enhance the user experience and add robustness to the news crawling system.
