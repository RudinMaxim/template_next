import { z } from 'zod';

// Константы
const DEFAULT_ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  TESTING: 'testing',
  PRODUCTION: 'production',
} as const;

const HOST_PATTERNS = {
  TEST: ['staging.', 'dev.', 'test.', 'qa.'],
  LOCAL: ['localhost', '127.0.0.1', '0.0.0.0', /^192\.168\./, /^10\./, /\.local$/, /\.test$/],
} as const;

// Тип для значений окружения
type EnvValue = string | number | boolean | null;

// Базовая схема для env
export type EnvSchema = z.ZodObject<Record<string, z.ZodType<EnvValue>>>;

export class EnvironmentManager<T extends EnvSchema> {
  private static instance: EnvironmentManager<any>;
  private envCache: Map<string, EnvValue> = new Map();
  private schema?: T;
  private validationErrors: string[] = [];

  private constructor(private config: Record<string, EnvValue> = {}) {
    this.initializeEnvironment();
  }

  /**
   * Получение инстанса класса с типизированной схемой
   */
  public static getInstance<S extends EnvSchema>(
    schema?: S,
    config?: Record<string, EnvValue>
  ): EnvironmentManager<S> {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager(config);
    }

    if (schema) {
      EnvironmentManager.instance.setSchema(schema);
    }

    return EnvironmentManager.instance;
  }

  /**
   * Установка схемы валидации
   */
  public setSchema(schema: T): void {
    this.schema = schema;
    this.validate();
  }

  /**
   * Инициализация окружения
   */
  private initializeEnvironment(): void {
    const environment = {
      ...process.env,
      ...this.config,
    };

    this.envCache.clear();

    Object.entries(environment).forEach(([key, value]) => {
      if (value !== undefined) {
        this.envCache.set(key, value);
      }
    });
  }

  /**
   * Получение типизированного значения переменной окружения
   */
  public get<K extends keyof z.infer<T>>(
    key: K,
    defaultValue?: z.infer<T>[K]
  ): z.infer<T>[K] | undefined {
    const value = this.envCache.get(key as string);

    if (value === undefined) {
      return defaultValue;
    }

    if (this.schema) {
      try {
        const schema = this.schema.shape[key as string];
        return schema.parse(value) as z.infer<T>[K];
      } catch (error) {
        console.error(`Error parsing env variable ${key.toLocaleString()}:`, error);
        return defaultValue;
      }
    }

    return value as z.infer<T>[K];
  }

  /**
   * Установка значения переменной окружения
   */
  public set<K extends keyof z.infer<T>>(key: K, value: z.infer<T>[K]): void {
    if (this.schema) {
      const schema = this.schema.shape[key as string];
      try {
        const parsedValue = schema.parse(value);
        this.envCache.set(key as string, parsedValue);
      } catch (error) {
        throw new Error(`Invalid value for ${String(key)}: ${error}`);
      }
    } else {
      this.envCache.set(key as string, value);
    }
  }

  /**
   * Валидация всех переменных окружения
   */
  public validate(): boolean {
    this.validationErrors = [];

    if (!this.schema) {
      return true;
    }

    const envObject = Object.fromEntries(this.envCache);

    try {
      this.schema.parse(envObject);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.validationErrors = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
      }
      return false;
    }
  }

  /**
   * Получение ошибок валидации
   */
  public getValidationErrors(): string[] {
    return [...this.validationErrors];
  }

  /**
   * Проверка окружения
   */
  public isProduction(): boolean {
    return this.get('NODE_ENV' as keyof z.infer<T>) === DEFAULT_ENVIRONMENTS.PRODUCTION;
  }

  public isTesting(): boolean {
    return this.get('NODE_ENV' as keyof z.infer<T>) === DEFAULT_ENVIRONMENTS.TESTING;
  }

  public isStaging(): boolean {
    return this.get('NODE_ENV' as keyof z.infer<T>) === DEFAULT_ENVIRONMENTS.STAGING;
  }

  public isDevelopment(): boolean {
    return this.get('NODE_ENV' as keyof z.infer<T>) === DEFAULT_ENVIRONMENTS.DEVELOPMENT;
  }

  /**
   * Проверка локального окружения
   */
  public isLocalhost(): boolean {
    if (typeof window === 'undefined') return false;

    const hostname = window.location.hostname;
    return HOST_PATTERNS.LOCAL.some((pattern) =>
      typeof pattern === 'string' ? hostname.includes(pattern) : pattern.test(hostname)
    );
  }

  /**
   * Логирование для отладки
   */
  public debugLog(service: string, type: string, ...args: unknown[]): void {
    if (this.isDevelopment()) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}][${service}] ${type}:`, ...args);
    }
  }

  /**
   * Загрузка конфигурации
   */
  public load(config: Partial<z.infer<T>>): void {
    Object.entries(config).forEach(([key, value]) => {
      this.set(key as keyof z.infer<T>, value);
    });
  }

  /**
   * Очистка кэша
   */
  public clear(): void {
    this.envCache.clear();
  }
}

export const envManager = EnvironmentManager.getInstance();
