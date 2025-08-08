#!/usr/bin/env node

import { 
  OptimizedCrawlerService, 
  OptimizedTestCrawler, 
  OptimizedBbcEthiopiaCrawler, 
  OptimizedAlJazeeraEthiopiaCrawler, 
  OptimizedUnOchaCrawler,
  CrawlerResult 
} from '../src/services/optimized-crawler-service';

interface TestResult {
  crawlerName: string;
  passed: boolean;
  duration: number;
  articlesFound: number;
  errors: string[];
  details: string;
}

class CrawlerTestSuite {
  private results: TestResult[] = [];

  /**
   * Test individual crawler
   */
  private async testCrawler(
    crawlerClass: any, 
    crawlerName: string,
    expectedMinArticles: number = 1
  ): Promise<TestResult> {
    const startTime = Date.now();
    const testResult: TestResult = {
      crawlerName,
      passed: false,
      duration: 0,
      articlesFound: 0,
      errors: [],
      details: ''
    };

    try {
      console.log(`\n🧪 Testing ${crawlerName}...`);
      
      const crawler = new crawlerClass();
      const result: CrawlerResult = await crawler.crawl();
      
      testResult.duration = Date.now() - startTime;
      testResult.articlesFound = result.articles.length;
      
      // Validate results
      const validations = [
        {
          condition: result.articles.length >= expectedMinArticles,
          message: `Expected at least ${expectedMinArticles} articles, got ${result.articles.length}`
        },
        {
          condition: result.performance.totalTime > 0,
          message: 'Performance metrics should be recorded'
        },
        {
          condition: result.crawledAt !== '',
          message: 'Crawl timestamp should be recorded'
        },
        {
          condition: result.source === crawlerName || result.source.includes(crawlerName.split(' ')[0]),
          message: `Source should match crawler name. Expected: ${crawlerName}, Got: ${result.source}`
        }
      ];

      // Check article quality
      if (result.articles.length > 0) {
        const firstArticle = result.articles[0];
        validations.push(
          {
            condition: !!firstArticle.snippet && firstArticle.snippet.length > 20,
            message: 'Articles should have meaningful titles'
          },
          {
            condition: !!firstArticle.snippet && firstArticle.snippet.length > 20,
            message: 'Articles should have meaningful snippets'
          },
          {
            condition: !!(firstArticle.url && firstArticle.url.startsWith('http')),
            message: 'Articles should have valid URLs'
          },
          {
            condition: !!(firstArticle.id && firstArticle.id.length > 5),
            message: 'Articles should have unique IDs'
          }
        );
      }

      // Process validation results
      const failedValidations = validations.filter(v => !v.condition);
      if (failedValidations.length === 0) {
        testResult.passed = true;
        testResult.details = `✅ All validations passed. Found ${result.articles.length} articles in ${testResult.duration}ms`;
        console.log(`✅ ${crawlerName}: PASSED (${result.articles.length} articles, ${testResult.duration}ms)`);
      } else {
        testResult.errors = failedValidations.map(v => v.message);
        testResult.details = `❌ ${failedValidations.length} validation(s) failed`;
        console.log(`❌ ${crawlerName}: FAILED - ${failedValidations.map(v => v.message).join(', ')}`);
      }

      // Add any crawler-specific errors
      if (result.errors && result.errors.length > 0) {
        testResult.errors.push(...result.errors);
      }

    } catch (error) {
      testResult.duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      testResult.errors.push(errorMessage);
      testResult.details = `💥 Test execution failed: ${errorMessage}`;
      console.log(`💥 ${crawlerName}: EXECUTION FAILED - ${errorMessage}`);
    }

    return testResult;
  }

  /**
   * Test the complete crawler service
   */
  private async testCrawlerService(): Promise<TestResult> {
    const startTime = Date.now();
    const testResult: TestResult = {
      crawlerName: 'Optimized Crawler Service',
      passed: false,
      duration: 0,
      articlesFound: 0,
      errors: [],
      details: ''
    };

    try {
      console.log(`\n🧪 Testing Complete Crawler Service...`);
      
      const service = new OptimizedCrawlerService();
      const articles = await service.getAllArticles();
      
      testResult.duration = Date.now() - startTime;
      testResult.articlesFound = articles.length;
      
      // Service-level validations
      const validations = [
        {
          condition: articles.length >= 2, // At least test crawler should work
          message: `Service should return at least 2 articles, got ${articles.length}`
        },
        {
          condition: new Set(articles.map(a => a.id)).size === articles.length,
          message: 'All articles should have unique IDs'
        },
        {
          condition: articles.every(a => a.title && a.snippet && a.url),
          message: 'All articles should have required fields'
        }
      ];

      const failedValidations = validations.filter(v => !v.condition);
      if (failedValidations.length === 0) {
        testResult.passed = true;
        testResult.details = `✅ Service test passed. Found ${articles.length} unique articles in ${testResult.duration}ms`;
        console.log(`✅ Crawler Service: PASSED (${articles.length} articles, ${testResult.duration}ms)`);
      } else {
        testResult.errors = failedValidations.map(v => v.message);
        testResult.details = `❌ ${failedValidations.length} service validation(s) failed`;
        console.log(`❌ Crawler Service: FAILED - ${failedValidations.map(v => v.message).join(', ')}`);
      }

    } catch (error) {
      testResult.duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      testResult.errors.push(errorMessage);
      testResult.details = `💥 Service test failed: ${errorMessage}`;
      console.log(`💥 Crawler Service: EXECUTION FAILED - ${errorMessage}`);
    }

    return testResult;
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Optimized Crawler Test Suite...\n');
    const overallStartTime = Date.now();

    // Test individual crawlers
    this.results.push(await this.testCrawler(OptimizedTestCrawler, 'Test Crawler', 2));
    this.results.push(await this.testCrawler(OptimizedBbcEthiopiaCrawler, 'BBC Ethiopia News', 1));
    this.results.push(await this.testCrawler(OptimizedAlJazeeraEthiopiaCrawler, 'Al Jazeera Africa', 1));
    this.results.push(await this.testCrawler(OptimizedUnOchaCrawler, 'UN OCHA Ethiopia', 1));
    
    // Test complete service
    this.results.push(await this.testCrawlerService());

    // Generate summary report
    this.generateReport(Date.now() - overallStartTime);
  }

  /**
   * Generate test report
   */
  private generateReport(totalDuration: number): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 OPTIMIZED CRAWLER TEST SUITE REPORT');
    console.log('='.repeat(60));

    const passedTests = this.results.filter(r => r.passed).length;
    const totalTests = this.results.length;
    const totalArticles = this.results.reduce((sum, r) => sum + r.articlesFound, 0);
    const totalErrors = this.results.reduce((sum, r) => sum + r.errors.length, 0);

    console.log(`📈 Overall Results: ${passedTests}/${totalTests} tests passed`);
    console.log(`⏱️  Total execution time: ${totalDuration}ms`);
    console.log(`📄 Total articles found: ${totalArticles}`);
    console.log(`⚠️  Total errors: ${totalErrors}`);
    console.log('');

    // Individual test results
    this.results.forEach((result, index) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${index + 1}. ${result.crawlerName}: ${status}`);
      console.log(`   Duration: ${result.duration}ms | Articles: ${result.articlesFound} | Errors: ${result.errors.length}`);
      console.log(`   ${result.details}`);
      
      if (result.errors.length > 0) {
        result.errors.forEach(error => {
          console.log(`     ⚠️  ${error}`);
        });
      }
      console.log('');
    });

    // Performance insights
    console.log('🔍 Performance Insights:');
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length;
    const fastestTest = this.results.reduce((fastest, current) => 
      current.duration < fastest.duration ? current : fastest
    );
    const slowestTest = this.results.reduce((slowest, current) => 
      current.duration > slowest.duration ? current : slowest
    );

    console.log(`   Average test duration: ${Math.round(avgDuration)}ms`);
    console.log(`   Fastest: ${fastestTest.crawlerName} (${fastestTest.duration}ms)`);
    console.log(`   Slowest: ${slowestTest.crawlerName} (${slowestTest.duration}ms)`);

    // Success rate
    const successRate = (passedTests / totalTests) * 100;
    console.log(`\n🎯 Success Rate: ${Math.round(successRate)}%`);
    
    if (successRate === 100) {
      console.log('🎉 All tests passed! The optimized crawler service is working perfectly.');
    } else if (successRate >= 80) {
      console.log('⚡ Most tests passed. Minor issues may need attention.');
    } else if (successRate >= 60) {
      console.log('⚠️  Some tests failed. Review the errors above.');
    } else {
      console.log('🚨 Multiple tests failed. Significant issues need to be addressed.');
    }

    console.log('\n' + '='.repeat(60));
  }
}

// Run the test suite
if (require.main === module) {
  const testSuite = new CrawlerTestSuite();
  testSuite.runAllTests().catch(console.error);
}

export { CrawlerTestSuite };
