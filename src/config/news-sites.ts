/**
 * Configuration for Ethiopian news sites and international sites covering Ethiopia
 * Phase 1.2: Target News Sites Identification
 */

export type NewsSiteConfig = {
  name: string;
  baseUrl: string;
  category: 'ethiopian' | 'international' | 'humanitarian';
  robotsTxtUrl: string;
  respectsRobotsTxt: boolean; // Will be verified
  selectors: {
    articleLinks: string;
    title: string;
    content: string;
    date?: string;
    author?: string;
  };
  maxArticles: number;
  language: 'en' | 'am' | 'mixed';
  priority: 'high' | 'medium' | 'low';
  testUrl?: string; // For initial testing
  notes?: string;
};

/**
 * Ethiopian News Sites
 */
export const ETHIOPIAN_NEWS_SITES: NewsSiteConfig[] = [
  {
    name: 'Ethiopian News Agency (ENA)',
    baseUrl: 'https://www.ena.et',
    category: 'ethiopian',
    robotsTxtUrl: 'https://www.ena.et/robots.txt',
    respectsRobotsTxt: true, // To be verified
    selectors: {
      articleLinks: 'a[href*="/news/"]',
      title: 'h1, .article-title',
      content: '.article-content, .news-content, p',
      date: '.date, .published-date, time'
    },
    maxArticles: 10,
    language: 'en',
    priority: 'high',
    testUrl: 'https://www.ena.et/en/',
    notes: 'Official government news agency'
  },
  {
    name: 'Addis Standard',
    baseUrl: 'https://addisstandard.com',
    category: 'ethiopian',
    robotsTxtUrl: 'https://addisstandard.com/robots.txt',
    respectsRobotsTxt: true,
    selectors: {
      articleLinks: 'a[href*="/news/"], a[href*="/analysis/"]',
      title: 'h1.entry-title, .article-title',
      content: '.entry-content, .article-content',
      date: '.entry-date, .published'
    },
    maxArticles: 8,
    language: 'en',
    priority: 'high',
    testUrl: 'https://addisstandard.com/',
    notes: 'Independent English-language news'
  },
  {
    name: 'Ethiopian Monitor',
    baseUrl: 'https://ethiopianmonitor.com',
    category: 'ethiopian',
    robotsTxtUrl: 'https://ethiopianmonitor.com/robots.txt',
    respectsRobotsTxt: true,
    selectors: {
      articleLinks: 'a[href*="/article/"], a[href*="/news/"]',
      title: 'h1, .post-title',
      content: '.post-content, .article-body',
      date: '.post-date, .date'
    },
    maxArticles: 8,
    language: 'en',
    priority: 'medium',
    testUrl: 'https://ethiopianmonitor.com/',
    notes: 'Independent news source'
  },
  {
    name: 'Fana Broadcasting Corporate',
    baseUrl: 'https://www.fanabc.com',
    category: 'ethiopian',
    robotsTxtUrl: 'https://www.fanabc.com/robots.txt',
    respectsRobotsTxt: true,
    selectors: {
      articleLinks: 'a[href*="/english/"]',
      title: 'h1, .article-title',
      content: '.article-content, .post-content',
      date: '.date, .published'
    },
    maxArticles: 6,
    language: 'en',
    priority: 'medium',
    testUrl: 'https://www.fanabc.com/english/',
    notes: 'State-affiliated broadcaster'
  }
];

/**
 * International News Sites covering Ethiopia
 */
export const INTERNATIONAL_NEWS_SITES: NewsSiteConfig[] = [
  {
    name: 'BBC Africa',
    baseUrl: 'https://www.bbc.com',
    category: 'international',
    robotsTxtUrl: 'https://www.bbc.com/robots.txt',
    respectsRobotsTxt: true,
    selectors: {
      articleLinks: 'a[href*="/news/world-africa-"], a[href*="/africa"]',
      title: 'h1[data-testid="headline"], h1.story-body__h1',
      content: '[data-component="text-block"], .story-body__inner p',
      date: 'time, .date'
    },
    maxArticles: 8,
    language: 'en',
    priority: 'high',
    testUrl: 'https://www.bbc.com/news/world/africa',
    notes: 'BBC News Africa section - highly reliable international coverage'
  },
  {
    name: 'Al Jazeera Africa',
    baseUrl: 'https://www.aljazeera.com',
    category: 'international',
    robotsTxtUrl: 'https://www.aljazeera.com/robots.txt',
    respectsRobotsTxt: true,
    selectors: {
      articleLinks: 'a[href*="/africa/"], a[href*="/news/"][href*="africa"]',
      title: 'h1, .article-header__title',
      content: '.wysiwyg, .article-p, .content p',
      date: '.date-simple, .screen-reader-text'
    },
    maxArticles: 8,
    language: 'en',
    priority: 'high',
    testUrl: 'https://www.aljazeera.com/africa/',
    notes: 'Al Jazeera Africa coverage - Middle Eastern perspective on African affairs'
  },
  {
    name: 'Reuters Africa',
    baseUrl: 'https://www.reuters.com',
    category: 'international',
    robotsTxtUrl: 'https://www.reuters.com/robots.txt',
    respectsRobotsTxt: true,
    selectors: {
      articleLinks: 'a[href*="/africa/"], a[href*="/world/africa/"]',
      title: 'h1[data-testid="Headline"], .ArticleHeader_headline',
      content: '[data-testid="paragraph"], .StandardArticleBody_body p',
      date: 'time, .ArticleHeader_date'
    },
    maxArticles: 6,
    language: 'en',
    priority: 'high',
    testUrl: 'https://www.reuters.com/world/africa/',
    notes: 'Reuters Africa bureau - financial and political focus with humanitarian coverage'
  }
];

/**
 * Humanitarian/Emergency News Sites
 */
export const HUMANITARIAN_NEWS_SITES: NewsSiteConfig[] = [
  {
    name: 'UN Office for Coordination of Humanitarian Affairs',
    baseUrl: 'https://www.unocha.org',
    category: 'humanitarian',
    robotsTxtUrl: 'https://www.unocha.org/robots.txt',
    respectsRobotsTxt: true,
    selectors: {
      articleLinks: 'a[href*="/story/"], a[href*="/news/"]',
      title: 'h1, .page-title',
      content: '.field-type-text-with-summary, .content',
      date: '.date-display-single, .date'
    },
    maxArticles: 3,
    language: 'en',
    priority: 'high',
    testUrl: 'https://www.unocha.org/ethiopia',
    notes: 'UN humanitarian coordination - Ethiopia specific'
  },
  {
    name: 'AlertNet (Thomson Reuters Foundation)',
    baseUrl: 'https://news.trust.org',
    category: 'humanitarian',
    robotsTxtUrl: 'https://news.trust.org/robots.txt',
    respectsRobotsTxt: true,
    selectors: {
      articleLinks: 'a[href*="/item/"]',
      title: 'h1, .headline',
      content: '.body-text, .article-body',
      date: '.dateline, .date'
    },
    maxArticles: 3,
    language: 'en',
    priority: 'medium',
    testUrl: 'https://news.trust.org/spotlight/horn-of-africa-crisis',
    notes: 'Humanitarian news network'
  }
];

/**
 * All news sites combined
 */
export const ALL_NEWS_SITES: NewsSiteConfig[] = [
  ...ETHIOPIAN_NEWS_SITES,
  ...INTERNATIONAL_NEWS_SITES,
  ...HUMANITARIAN_NEWS_SITES
];

/**
 * Get high priority sites only
 */
export const HIGH_PRIORITY_SITES = ALL_NEWS_SITES.filter(site => site.priority === 'high');

/**
 * Get sites by category
 */
export function getSitesByCategory(category: 'ethiopian' | 'international' | 'humanitarian'): NewsSiteConfig[] {
  return ALL_NEWS_SITES.filter(site => site.category === category);
}

/**
 * Get site configuration by name
 */
export function getSiteByName(name: string): NewsSiteConfig | undefined {
  return ALL_NEWS_SITES.find(site => site.name === name);
}
