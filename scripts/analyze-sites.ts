#!/usr/bin/env node

import puppeteer, { Browser, Page } from 'puppeteer';

interface SiteAnalysis {
  site: string;
  url: string;
  accessible: boolean;
  selectors: {
    tested: string;
    found: boolean;
    count: number;
  }[];
  recommendations: string[];
  errors: string[];
}

class SiteAnalyzer {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async initBrowser(): Promise<void> {
    if (!this.browser) {
      // More robust browser settings to avoid detection
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=VizDisplayCompositor',
          '--disable-web-security',
          '--disable-features=site-per-process',
          '--disable-extensions',
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ],
        defaultViewport: { width: 1280, height: 720 }
      });
    }

    if (!this.page) {
      this.page = await this.browser.newPage();
      
      // Avoid bot detection
      await this.page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        (window as any).chrome = { runtime: {} };
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5]
        });
      });

      // Set more realistic headers
      await this.page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none'
      });
    }
  }

  async analyzeSite(site: string, url: string, selectors: string[]): Promise<SiteAnalysis> {
    const analysis: SiteAnalysis = {
      site,
      url,
      accessible: false,
      selectors: [],
      recommendations: [],
      errors: []
    };

    try {
      console.log(`\n🔍 Analyzing ${site} (${url})...`);
      
      await this.initBrowser();
      if (!this.page) throw new Error('Page not initialized');

      // Navigate with timeout
      const response = await this.page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      if (!response || response.status() >= 400) {
        throw new Error(`HTTP ${response?.status()} - Site may be blocking requests`);
      }

      analysis.accessible = true;
      console.log(`✅ Successfully loaded ${site}`);

      // Wait a bit for dynamic content
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Test each selector
      for (const selector of selectors) {
        try {
          const elements = await this.page.$$(selector);
          const count = elements.length;
          
          analysis.selectors.push({
            tested: selector,
            found: count > 0,
            count
          });

          console.log(`   Selector "${selector}": ${count > 0 ? '✅' : '❌'} (${count} elements)`);
          
          // Get some sample text for valid selectors
          if (count > 0 && count < 10) {
            for (let i = 0; i < Math.min(3, count); i++) {
              try {
                const text = await elements[i].evaluate(el => {
                  if (el.tagName === 'A') {
                    return `"${(el as HTMLAnchorElement).textContent?.trim().slice(0, 50)}" -> ${(el as HTMLAnchorElement).href.slice(0, 80)}`;
                  }
                  return `"${el.textContent?.trim().slice(0, 80)}"`;
                });
                console.log(`     [${i + 1}] ${text}`);
              } catch (e) {
                // Skip this element
              }
            }
          }
        } catch (error) {
          analysis.selectors.push({
            tested: selector,
            found: false,
            count: 0
          });
          console.log(`   Selector "${selector}": ❌ Error - ${error instanceof Error ? error.message : 'Unknown'}`);
        }
      }

      // Generate recommendations
      const workingSelectors = analysis.selectors.filter(s => s.found && s.count > 0);
      const failedSelectors = analysis.selectors.filter(s => !s.found);

      if (workingSelectors.length === 0) {
        analysis.recommendations.push('No selectors are working. Site structure may have changed completely.');
        analysis.recommendations.push('Consider using more generic selectors like "a", "h1", "p"');
        
        // Try generic fallbacks
        const genericTests = ['a[href]', 'h1', 'h2', 'h3', 'p', 'article', '.article', '[class*="title"]', '[class*="headline"]'];
        console.log(`\n   🔧 Testing generic selectors...`);
        
        for (const generic of genericTests) {
          try {
            const count = await this.page.$$eval(generic, els => els.length);
            if (count > 0) {
              analysis.recommendations.push(`Consider using generic selector: "${generic}" (${count} elements found)`);
              console.log(`   Generic "${generic}": ✅ (${count} elements)`);
            }
          } catch (e) {
            // Skip
          }
        }
      } else if (failedSelectors.length > 0) {
        analysis.recommendations.push(`${workingSelectors.length}/${selectors.length} selectors working. Consider updating failed selectors.`);
      } else {
        analysis.recommendations.push('All selectors working correctly!');
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      analysis.errors.push(errorMsg);
      console.log(`❌ Failed to analyze ${site}: ${errorMsg}`);
      
      if (errorMsg.includes('timeout') || errorMsg.includes('detached')) {
        analysis.recommendations.push('Site may be using bot detection. Consider different user agents or request patterns.');
      }
      if (errorMsg.includes('HTTP')) {
        analysis.recommendations.push('Site may be blocking requests. Check robots.txt and consider rate limiting.');
      }
    }

    return analysis;
  }

  async cleanup(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
  }

  async analyzeAllSites(): Promise<void> {
    console.log('🚀 Starting Site Analysis for Crawler Optimization...\n');

    const sites = [
      {
        name: 'BBC Africa',
        url: 'https://www.bbc.com/news/world/africa',
        selectors: [
          'a[href*="/news/world-africa-"]',
          'a[href*="/news/"][data-testid*="internal-link"]',
          'h1[data-testid="headline"]',
          'h1.story-body__h1',
          '[data-component="text-block"]',
          '.story-body__inner p'
        ]
      },
      {
        name: 'Al Jazeera Africa',
        url: 'https://www.aljazeera.com/africa',
        selectors: [
          'a[href*="/news/"]',
          'a[href*="/africa/"]',
          'h1',
          '.article-header__title',
          '[class*="ArticleHeader"]',
          '.wysiwyg',
          '.article-p',
          '[class*="ArticleBody"] p'
        ]
      },
      {
        name: 'UN OCHA Ethiopia',
        url: 'https://www.unocha.org/ethiopia',
        selectors: [
          'a[href*="/story/"]',
          'a[href*="/news/"]',
          'a[href*="/ethiopia"]',
          'h1',
          '.page-title',
          '.node-title',
          '.field-type-text-with-summary',
          '.content',
          '.field-item'
        ]
      }
    ];

    const results: SiteAnalysis[] = [];

    for (const site of sites) {
      const analysis = await this.analyzeSite(site.name, site.url, site.selectors);
      results.push(analysis);
      
      // Cleanup between sites to avoid issues
      await this.cleanup();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause
    }

    // Generate comprehensive report
    this.generateReport(results);
  }

  private generateReport(results: SiteAnalysis[]): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 SITE ANALYSIS REPORT');
    console.log('='.repeat(80));

    const accessibleSites = results.filter(r => r.accessible).length;
    const totalSites = results.length;

    console.log(`🌐 Site Accessibility: ${accessibleSites}/${totalSites} sites accessible`);
    console.log('');

    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.site} (${result.accessible ? '✅ ACCESSIBLE' : '❌ BLOCKED'})`);
      console.log(`   URL: ${result.url}`);
      
      if (result.errors.length > 0) {
        console.log('   Errors:');
        result.errors.forEach(error => console.log(`     • ${error}`));
      }

      if (result.selectors.length > 0) {
        const workingSelectors = result.selectors.filter(s => s.found).length;
        console.log(`   Selectors: ${workingSelectors}/${result.selectors.length} working`);
        
        result.selectors.forEach(selector => {
          const status = selector.found ? `✅ (${selector.count})` : '❌';
          console.log(`     ${status} ${selector.tested}`);
        });
      }

      if (result.recommendations.length > 0) {
        console.log('   Recommendations:');
        result.recommendations.forEach(rec => console.log(`     • ${rec}`));
      }

      console.log('');
    });

    console.log('🔧 OPTIMIZATION SUGGESTIONS:');
    console.log('');

    if (accessibleSites < totalSites) {
      console.log('• Some sites are blocking requests. Consider:');
      console.log('  - Implementing delays between requests');
      console.log('  - Using residential proxy services');
      console.log('  - Rotating user agents');
      console.log('  - Implementing session management');
      console.log('');
    }

    const selectorIssues = results.filter(r => r.selectors.some(s => !s.found)).length;
    if (selectorIssues > 0) {
      console.log('• Selector issues detected. Consider:');
      console.log('  - Updating selectors based on current site structure');
      console.log('  - Using more generic fallback selectors');
      console.log('  - Implementing dynamic selector discovery');
      console.log('  - Adding retry logic with different selectors');
      console.log('');
    }

    console.log('• General recommendations:');
    console.log('  - Implement progressive enhancement (try specific selectors first, fall back to generic)');
    console.log('  - Add content validation to ensure quality');
    console.log('  - Consider RSS feeds as alternative data sources');
    console.log('  - Implement caching to reduce request frequency');

    console.log('\n' + '='.repeat(80));
  }
}

// Run the analysis
if (require.main === module) {
  const analyzer = new SiteAnalyzer();
  analyzer.analyzeAllSites()
    .catch(console.error)
    .finally(() => analyzer.cleanup());
}

export { SiteAnalyzer };
