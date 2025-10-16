/**
 * Enhanced site structure analysis to understand actual HTML layouts
 * This will help us determine proper selectors for each news site
 * Run with: npx tsx src/scripts/analyze-site-structure.ts
 */

import puppeteer from 'puppeteer';
import { ALL_NEWS_SITES, type NewsSiteConfig } from '@/config/news-sites';

async function analyzeSiteStructure(site: NewsSiteConfig) {
  if (!site.testUrl) {
    console.log(`❌ No test URL for ${site.name}`);
    return null;
  }

  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set a realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log(`🔍 Analyzing: ${site.name}`);
    console.log(`   URL: ${site.testUrl}`);
    
    // Navigate to the page
    await page.goto(site.testUrl, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    // Wait a bit for dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Analyze the page structure
    const analysis = await page.evaluate(() => {
      const results = {
        title: document.title,
        articleLinks: [] as string[],
        headings: [] as string[],
        possibleSelectors: {
          articles: [] as string[],
          titles: [] as string[],
          links: [] as string[]
        }
      };
      
      // Find potential article links
      const links = Array.from(document.querySelectorAll('a[href]'));
      results.articleLinks = links
        .map(link => (link as HTMLAnchorElement).href)
        .filter(href => 
          href.includes('article') || 
          href.includes('news') || 
          href.includes('story') ||
          href.includes('/20') // year pattern
        )
        .slice(0, 10); // limit to first 10
      
      // Find headings that might be article titles
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'));
      results.headings = headings
        .map(h => h.textContent?.trim() || '')
        .filter(text => text.length > 20 && text.length < 200)
        .slice(0, 10);
      
      // Try to find article containers
      const possibleArticleContainers = [
        'article', '.article', '.post', '.news-item', '.story',
        '.entry', '.content-item', '[class*="article"]', '[class*="news"]',
        '.card', '.item', '.list-item'
      ];
      
      possibleArticleContainers.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0 && elements.length < 50) {
            results.possibleSelectors.articles.push(`${selector} (${elements.length} found)`);
          }
        } catch {
          // Ignore selector errors
        }
      });
      
      // Try to find title selectors
      const possibleTitleSelectors = [
        'h1', 'h2', 'h3', '.title', '.headline', '.article-title',
        '.post-title', '.entry-title', '[class*="title"]', '[class*="headline"]'
      ];
      
      possibleTitleSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0 && elements.length < 20) {
            const sampleText = elements[0]?.textContent?.trim().substring(0, 50) || '';
            results.possibleSelectors.titles.push(`${selector} (${elements.length} found) - "${sampleText}"`);
          }
        } catch {
          // Ignore selector errors
        }
      });
      
      // Try to find link selectors
      const possibleLinkSelectors = [
        'a[href*="article"]', 'a[href*="news"]', 'a[href*="story"]',
        '.article-link', '.news-link', '.read-more'
      ];
      
      possibleLinkSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            results.possibleSelectors.links.push(`${selector} (${elements.length} found)`);
          }
        } catch {
          // Ignore selector errors
        }
      });
      
      return results;
    });
    
    // Display results
    console.log(`✅ Successfully analyzed ${site.name}`);
    console.log(`   Page title: ${analysis.title}`);
    console.log(`   Found ${analysis.articleLinks.length} potential article links`);
    console.log(`   Found ${analysis.headings.length} potential headlines`);
    
    if (analysis.articleLinks.length > 0) {
      console.log('   Sample article links:');
      analysis.articleLinks.slice(0, 3).forEach(link => {
        console.log(`     - ${link}`);
      });
    }
    
    if (analysis.headings.length > 0) {
      console.log('   Sample headlines:');
      analysis.headings.slice(0, 3).forEach(heading => {
        console.log(`     - ${heading}`);
      });
    }
    
    console.log('   Suggested selectors:');
    if (analysis.possibleSelectors.articles.length > 0) {
      console.log('     Article containers:', analysis.possibleSelectors.articles.slice(0, 3).join(', '));
    }
    if (analysis.possibleSelectors.titles.length > 0) {
      console.log('     Title selectors:', analysis.possibleSelectors.titles.slice(0, 3).join(', '));
    }
    if (analysis.possibleSelectors.links.length > 0) {
      console.log('     Link selectors:', analysis.possibleSelectors.links.slice(0, 3).join(', '));
    }
    
    console.log('---\n');
    
    return analysis;
    
  } catch (error) {
    console.log(`❌ Failed to analyze ${site.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function analyzePrioritySites() {
  console.log('🕷️  Site Structure Analysis');
  console.log('============================\n');
  
  // Focus on high priority sites first
  const prioritySites = ALL_NEWS_SITES.filter(site => site.priority === 'high');
  
  console.log(`Analyzing ${prioritySites.length} high-priority sites...\n`);
  
  const results = [];
  
  for (const site of prioritySites) {
    const analysis = await analyzeSiteStructure(site);
    results.push({ site, analysis });
    
    // Add delay between requests to be respectful
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('📋 Analysis Summary:');
  console.log('===================');
  
  const successful = results.filter(r => r.analysis !== null);
  const failed = results.filter(r => r.analysis === null);
  
  console.log(`✅ Successfully analyzed: ${successful.length} sites`);
  successful.forEach(r => console.log(`   - ${r.site.name}`));
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed to analyze: ${failed.length} sites`);
    failed.forEach(r => console.log(`   - ${r.site.name}`));
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('- Update site configurations with discovered selectors');
  console.log('- Develop spiders for successfully analyzed sites');
  console.log('- Test actual content extraction');
  
  return results;
}

// Run the analysis
analyzePrioritySites().catch(console.error);
