'use server';

import type { NewsArticle } from '@/lib/types';
import puppeteer from 'puppeteer';

// Types for crawler configuration
export type CrawlerConfig = {
  name: string;
  baseUrl: string;
  selectors: {
    articleLinks: string;
    title: string;
    content: string;
    date?: string;
  };
  maxArticles?: number;
  respectsRobotsTxt: boolean;
};

// Result type for crawler operations
export type CrawlerResult = {
  source: string;
  articles: NewsArticle[];
  errors?: string[];
  crawledAt: string;
};

/**
 * Base crawler class that can be extended for specific news sites
 */
export class BaseCrawler {
  protected config: CrawlerConfig;
  
  constructor(config: CrawlerConfig) {
    this.config = config;
  }

  /**
   * Main crawling method - to be implemented by specific crawlers
   */
  async crawl(): Promise<CrawlerResult> {
    const errors: string[] = [];
    const articles: NewsArticle[] = [];

    try {
      // Check robots.txt compliance
      if (!this.config.respectsRobotsTxt) {
        throw new Error(`${this.config.name} does not allow crawling according to robots.txt`);
      }

      console.log(`Starting crawl for ${this.config.name}...`);
      
      // This is a basic implementation - specific crawlers will override
      const crawledArticles = await this.performCrawl();
      articles.push(...crawledArticles);

      console.log(`Successfully crawled ${articles.length} articles from ${this.config.name}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown crawling error';
      console.error(`Error crawling ${this.config.name}:`, errorMessage);
      errors.push(errorMessage);
    }

    return {
      source: this.config.name,
      articles,
      errors: errors.length > 0 ? errors : undefined,
      crawledAt: new Date().toISOString()
    };
  }

  /**
   * Perform the actual crawling - to be overridden by specific implementations
   */
  protected async performCrawl(): Promise<NewsArticle[]> {
    // Default implementation - will be overridden
    return [];
  }

  /**
   * Utility method to clean and format article text
   */
  protected cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim()
      .substring(0, 500); // Limit snippet length
  }

  /**
   * Generate a unique ID for an article
   */
  protected generateArticleId(title: string, source: string): string {
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const timestamp = Date.now();
    return `${source}-${cleanTitle.substring(0, 20)}-${timestamp}`;
  }
}

/**
 * Proof-of-concept crawler for testing
 */
export class TestCrawler extends BaseCrawler {
  constructor() {
    super({
      name: 'Test Crawler',
      baseUrl: 'https://example.com',
      selectors: {
        articleLinks: 'a',
        title: 'h1',
        content: 'p'
      },
      maxArticles: 5,
      respectsRobotsTxt: true
    });
  }

  protected async performCrawl(): Promise<NewsArticle[]> {
    // Mock data for testing the crawler framework
    const mockArticles: NewsArticle[] = [
      {
        id: this.generateArticleId('Test Article About Ethiopia Drought', 'test-crawler'),
        title: 'Test Article About Ethiopia Drought',
        source: 'Test News Source',
        snippet: 'This is a test article about drought conditions in Ethiopia for testing the crawler framework.',
        url: 'https://example.com/test-article-1'
      },
      {
        id: this.generateArticleId('Ethiopia Health Ministry Update', 'test-crawler'),
        title: 'Ethiopia Health Ministry Update',
        source: 'Test News Source',
        snippet: 'Test article about health ministry updates in Ethiopia for crawler testing purposes.',
        url: 'https://example.com/test-article-2'
      }
    ];

    // Simulate crawling delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return mockArticles;
  }
}

/**
 * BBC Africa crawler for real news
 */
export class BbcAfricaCrawler extends BaseCrawler {
  constructor() {
    super({
      name: 'BBC Africa',
      baseUrl: 'https://www.bbc.com/news/world/africa',
      selectors: {
        articleLinks: 'a[href*="/news/world-africa-"], a[href*="/news/"][href*="africa"]',
        title: 'h1[data-testid="headline"], h1.story-body__h1, h1',
        content: '[data-component="text-block"], .story-body__inner p, p',
        date: 'time, .date'
      },
      maxArticles: 3,
      respectsRobotsTxt: true
    });
  }

  protected async performCrawl(): Promise<NewsArticle[]> {
    const browser = await puppeteer.launch({ 
      headless: true, 
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    const articles: NewsArticle[] = [];

    try {
      // Set user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      console.log(`Fetching ${this.config.baseUrl}...`);
      await page.goto(this.config.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Get article links
      const links = await page.$$eval(
        this.config.selectors.articleLinks, 
        (anchors) => anchors.map(anchor => (anchor as HTMLAnchorElement).href)
      );
      
      console.log(`Found ${links.length} article links, processing ${Math.min(links.length, this.config.maxArticles || 3)}...`);
      
      // Process each article
      for (let i = 0; i < Math.min(links.length, this.config.maxArticles || 3); i++) {
        const link = links[i];
        try {
          await page.goto(link, { waitUntil: 'networkidle2', timeout: 30000 });
          
          // Get title
          const title = await page.$eval(
            this.config.selectors.title, 
            element => element.textContent?.trim() || ''
          ).catch(() => '');
          
          // Get content snippets
          const contentElements = await page.$$(this.config.selectors.content);
          let snippet = '';
          for (const elem of contentElements.slice(0, 3)) { // First 3 paragraphs
            const text = await elem.evaluate(e => e.textContent?.trim() || '');
            snippet += text + ' ';
          }
          
          if (title && snippet.trim()) {
            const id = this.generateArticleId(title, this.config.name);
            articles.push({
              id,
              title,
              source: this.config.name,
              snippet: this.cleanText(snippet),
              url: link
            });
            console.log(`✓ Extracted: ${title.substring(0, 50)}...`);
          }
        } catch (error) {
          console.error(`Failed to process article ${link}:`, error instanceof Error ? error.message : 'Unknown error');
        }
      }
    } catch (error) {
      console.error('Error during BBC Africa crawl:', error);
    } finally {
      await browser.close();
    }

    return articles;
  }
}

/**
 * Main crawler service that orchestrates all crawlers
 */
export class CrawlerService {
  private crawlers: BaseCrawler[] = [];

  constructor() {
    // Initialize with test crawler for now
    this.crawlers.push(new TestCrawler());
    // Add BBC Africa crawler
    this.crawlers.push(new BbcAfricaCrawler());
  }

  /**
   * Add a crawler to the service
   */
  addCrawler(crawler: BaseCrawler): void {
    this.crawlers.push(crawler);
  }

  /**
   * Run all crawlers and return combined results
   */
  async crawlAll(): Promise<CrawlerResult[]> {
    console.log(`Running ${this.crawlers.length} crawlers...`);
    
    const results = await Promise.allSettled(
      this.crawlers.map(crawler => crawler.crawl())
    );

    return results.map(result => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          source: 'Unknown',
          articles: [],
          errors: [result.reason?.message || 'Crawler failed'],
          crawledAt: new Date().toISOString()
        };
      }
    });
  }

  /**
   * Get all articles from successful crawls
   */
  async getAllArticles(): Promise<NewsArticle[]> {
    const results = await this.crawlAll();
    const allArticles: NewsArticle[] = [];

    for (const result of results) {
      if (result.articles.length > 0) {
        allArticles.push(...result.articles);
      }
    }

    // Remove duplicates based on title
    const uniqueArticles = allArticles.filter((article, index, self) =>
      index === self.findIndex(a => a.title.toLowerCase() === article.title.toLowerCase())
    );

    console.log(`Crawled ${uniqueArticles.length} unique articles from ${results.length} sources`);
    return uniqueArticles;
  }
}

// Export a singleton instance
export const crawlerService = new CrawlerService();
