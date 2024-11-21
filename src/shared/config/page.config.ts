/**
 * @class PageConfig
 * @description Manages application routes and provides type-safe path generation
 */
export class PageConfig {
  private static instance: PageConfig;

  private constructor() {}

  /**
   * @returns {PageConfig} Singleton instance of PageConfig
   */
  static getInstance(): PageConfig {
    if (!PageConfig.instance) {
      PageConfig.instance = new PageConfig();
    }
    return PageConfig.instance;
  }

  /** @readonly Home page route */
  readonly HOME = '/';

  /** @readonly Authentication related routes */
  readonly AUTH = {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
  };

  /** @readonly API endpoints */
  readonly API = {
    AUTH: '/api/auth',
    USERS: '/api/users',
    PROJECTS: '/api/projects',
  };

  /** @readonly Project related routes */
  readonly PROJECT = {
    /** @readonly Projects list page route */
    ROOT: '/project',
    /**
     * @param {string} id - Project identifier
     * @returns {string} Project edit page route
     */
    EDIT: (id: string): string => `/project/${id}/edit`,
  };

  /**
   * Generates path with replaced parameters
   * @param {string} path - Base path with parameter placeholders
   * @param {Record<string, string>} [params] - Parameters to replace in path
   * @returns {string} Final path with replaced parameters
   * @example
   * getPath('/users/:id/posts/:postId', { id: '123', postId: '456' })
   * // Returns: '/users/123/posts/456'
   */
  getPath(path: string, params?: Record<string, string>): string {
    if (!params) return path;

    let resultPath = path;
    Object.entries(params).forEach(([key, value]) => {
      resultPath = resultPath.replace(`:${key}`, value);
    });

    return resultPath;
  }
}

export const pageConfig = PageConfig.getInstance();
