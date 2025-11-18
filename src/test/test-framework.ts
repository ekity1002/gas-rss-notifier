/**
 * 簡易テストフレームワーク
 * GAS環境でテストを実行するための軽量フレームワーク
 */

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export interface TestSuite {
  name: string;
  results: TestResult[];
  passed: number;
  failed: number;
}

export class TestRunner {
  private currentSuite: string = '';
  private results: TestResult[] = [];

  /**
   * テストスイートを開始
   */
  public describe(name: string, fn: () => void): TestSuite {
    this.currentSuite = name;
    this.results = [];

    console.log(`\n=== ${name} ===`);

    try {
      fn();
    } catch (error) {
      console.error(`テストスイートの実行エラー: ${error}`);
    }

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;

    console.log(`\n結果: ${passed} passed, ${failed} failed`);

    return {
      name: this.currentSuite,
      results: this.results,
      passed,
      failed,
    };
  }

  /**
   * テストケースを実行
   */
  public it(name: string, fn: () => void): void {
    try {
      fn();
      this.results.push({ name, passed: true });
      console.log(`✓ ${name}`);
    } catch (error) {
      this.results.push({ name, passed: false, error: String(error) });
      console.error(`✗ ${name}: ${error}`);
    }
  }

  /**
   * アサーション: 等価性
   */
  public assertEqual<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
      const msg = message || `Expected ${expected}, but got ${actual}`;
      throw new Error(msg);
    }
  }

  /**
   * アサーション: 真偽値
   */
  public assertTrue(value: boolean, message?: string): void {
    if (!value) {
      const msg = message || `Expected true, but got ${value}`;
      throw new Error(msg);
    }
  }

  /**
   * アサーション: 偽値
   */
  public assertFalse(value: boolean, message?: string): void {
    if (value) {
      const msg = message || `Expected false, but got ${value}`;
      throw new Error(msg);
    }
  }

  /**
   * アサーション: 配列の長さ
   */
  public assertLength<T>(array: T[], expectedLength: number, message?: string): void {
    if (array.length !== expectedLength) {
      const msg = message || `Expected length ${expectedLength}, but got ${array.length}`;
      throw new Error(msg);
    }
  }

  /**
   * アサーション: 配列に含まれる
   */
  public assertIncludes<T>(array: T[], value: T, message?: string): void {
    if (!array.includes(value)) {
      const msg = message || `Expected array to include ${value}`;
      throw new Error(msg);
    }
  }

  /**
   * アサーション: 文字列に含まれる
   */
  public assertContains(str: string, substring: string, message?: string): void {
    if (!str.includes(substring)) {
      const msg = message || `Expected string to contain "${substring}"`;
      throw new Error(msg);
    }
  }
}
