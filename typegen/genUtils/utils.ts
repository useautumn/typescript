import { existsSync } from "fs";
import path from "path";

/**
 * Utility functions for type generation
 */

// biome-ignore lint/complexity/noStaticOnlyClass: sybau
export class TypeGeneratorUtils {
  /**
   * Convert snake_case to camelCase
   */
  static toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Convert camelCase to snake_case
   */
  static toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * Get relative path between two directories
   */
  static getRelativePath(from: string, to: string): string {
    return path.relative(path.dirname(from), to);
  }

  /**
   * Validate that source file exists
   */
  static validateSourceFile(filePath: string): boolean {
    return existsSync(filePath);
  }

  /**
   * Validate that all required paths exist
   */
  static validatePaths(paths: { name: string; path: string }[]): void {
    const missing = paths.filter(p => !existsSync(p.path));
    if (missing.length > 0) {
      const missingPaths = missing.map(p => `${p.name}: ${p.path}`).join('\n  ');
      throw new Error(`Missing required paths:\n  ${missingPaths}`);
    }
  }

  /**
   * Create a standardized log message
   */
  static createLogMessage(level: 'info' | 'success' | 'error' | 'warn', message: string): string {
    const icons = {
      info: '📝',
      success: '✅',
      error: '❌',
      warn: '⚠️'
    };
    return `${icons[level]} ${message}`;
  }
}