import puppeteer from 'puppeteer';
import type { NewsArticle } from '@/lib/types';
import { BaseCrawler } from '@/services/crawler-service';

/**
 * Crawler for BBC Africa news
 */
export class BbcAfricaCrawler extends BaseCrawler {
  constructor() {
    super({
      name: 'BBC Africa',
      baseUrl: 'https://www.bbc.com/news/world/africa',
      selectors: {
        articleLinks: 'a[href*="/news/world-africa-"]',
        title: 'h1[data-testid="headline"], h1.story-body__h1',
        content: '[data-component="text-block"], .story-body__inner p',
        date: 'time, .date'
      },
      maxArticles: 5,
      respectsRobotsTxt: true
    });
  }

  protected async performCrawl(): Promise<NewsArticle[]> {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    const articles: NewsArticle[] = [];

    try {
      await page.goto(this.config.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      const links = await page.$$eval(this.config.selectors.articleLinks, anchors => anchors.map(anchor => anchor.href).slice(0, this.config.maxArticles));

      for (const link of links) {
        try {
          await page.goto(link, { waitUntil: 'networkidle2', timeout: 30000 });

          const title = await page.$eval(this.config.selectors.title, element => element.textContent?.trim() || '');
          const contentElems = await page.$$(this.config.selectors.content);
          const snippet = await contentElems.reduce(async (acc, elem) => acc + (await elem.evaluate(e => e.textContent)).trim() + ' ', '');
          const id = this.generateArticleId(title, this.config.name);

          if (title && snippet) {
            articles.push({
              id,
              title,
              source: this.config.name,
              snippet: this.cleanText(snippet),
              url: link
            });
          }
        } catch (error) {
          console.error(`Failed to fetch article from ${link}:`, error);
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
