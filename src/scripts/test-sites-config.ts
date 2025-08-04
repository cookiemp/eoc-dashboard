/**
 * Test script to verify news site configurations and robots.txt compliance
 * Phase 1.2: Target News Sites Verification
 * Run with: npx tsx src/scripts/test-sites-config.ts
 */

import { ALL_NEWS_SITES, HIGH_PRIORITY_SITES, getSitesByCategory } from '@/config/news-sites';

async function checkRobotsTxt(robotsTxtUrl: string): Promise<{ allowed: boolean; content?: string; error?: string }> {
  try {
    const response = await fetch(robotsTxtUrl);
    if (!response.ok) {
      return { allowed: false, error: `HTTP ${response.status}` };
    }
    
    const content = await response.text();
    
    // Basic check for disallow patterns
    const hasUserAgent = content.toLowerCase().includes('user-agent:');
    const hasDisallowAll = content.toLowerCase().includes('disallow: /');
    const hasCrawlDelay = content.toLowerCase().includes('crawl-delay:');
    
    return {
      allowed: hasUserAgent && !hasDisallowAll,
      content: content.substring(0, 500) + (content.length > 500 ? '...' : '')
    };
  } catch (error) {
    return { 
      allowed: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

async function testSiteAccessibility(testUrl: string): Promise<{ accessible: boolean; statusCode?: number; error?: string }> {
  try {
    const response = await fetch(testUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EOC-Dashboard/1.0; +https://eoc-dashboard.vercel.app)'
      }
    });
    
    return {
      accessible: response.ok,
      statusCode: response.status
    };
  } catch (error) {
    return {
      accessible: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function validateNewsConfiguration() {
  console.log('🔍 Phase 1.2 Test: News Sites Configuration Validation');
  console.log('=====================================================\n');

  console.log(`📊 Total configured sites: ${ALL_NEWS_SITES.length}`);
  console.log(`⭐ High priority sites: ${HIGH_PRIORITY_SITES.length}`);
  console.log(`🇪🇹 Ethiopian sites: ${getSitesByCategory('ethiopian').length}`);
  console.log(`🌍 International sites: ${getSitesByCategory('international').length}`);
  console.log(`🚨 Humanitarian sites: ${getSitesByCategory('humanitarian').length}\n`);

  console.log('🔍 Checking robots.txt compliance and site accessibility...\n');

  const results = [];

  for (const site of ALL_NEWS_SITES) {
    console.log(`Testing: ${site.name} (${site.priority} priority)`);
    
    // Test robots.txt
    const robotsResult = await checkRobotsTxt(site.robotsTxtUrl);
    
    // Test site accessibility
    const accessResult = site.testUrl ? await testSiteAccessibility(site.testUrl) : null;
    
    const siteResult = {
      name: site.name,
      category: site.category,
      priority: site.priority,
      robotsAllowed: robotsResult.allowed,
      robotsError: robotsResult.error,
      accessible: accessResult?.accessible ?? 'Not tested',
      accessError: accessResult?.error,
      statusCode: accessResult?.statusCode
    };

    results.push(siteResult);

    // Display result
    if (robotsResult.allowed && (accessResult?.accessible ?? true)) {
      console.log('  ✅ Ready for crawling');
    } else {
      console.log('  ❌ Issues detected:');
      if (!robotsResult.allowed) {
        console.log(`     - Robots.txt: ${robotsResult.error || 'Crawling may be restricted'}`);
      }
      if (accessResult && !accessResult.accessible) {
        console.log(`     - Accessibility: ${accessResult.error || `HTTP ${accessResult.statusCode}`}`);
      }
    }
    console.log('');
  }

  // Summary
  console.log('📋 Summary:');
  console.log('===========');
  
  const readySites = results.filter(r => r.robotsAllowed && r.accessible === true);
  const problematicSites = results.filter(r => !r.robotsAllowed || r.accessible === false);
  
  console.log(`✅ Sites ready for crawling: ${readySites.length}`);
  readySites.forEach(site => console.log(`   - ${site.name}`));
  
  if (problematicSites.length > 0) {
    console.log(`\n❌ Sites with issues: ${problematicSites.length}`);
    problematicSites.forEach(site => {
      console.log(`   - ${site.name}: ${site.robotsError || site.accessError || 'Access issues'}`);
    });
  }

  console.log(`\n🎯 Next Steps:`);
  console.log('- Phase 1.3: Develop real spiders for verified sites');
  console.log('- Focus on sites that passed both robots.txt and accessibility tests');
  
  return results;
}

// Run the validation
validateNewsConfiguration().catch(console.error);
