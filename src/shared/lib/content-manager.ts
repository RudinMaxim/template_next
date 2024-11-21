import fs from 'fs';
import path from 'path';

export type JsonPrimitive = string | number | boolean | null;
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export type TypedObject<T> = T & { [key: string]: JsonValue };

export interface ContentManagerOptions {
  defaultValue?: JsonValue;
  allowHtml?: boolean;
}

const DATA_PATH = 'src/shared/assets/data';

class JsonContentManager {
  private static instance: JsonContentManager;
  private cache: Map<string, JsonValue>;
  private dataPath: string;
  private watcher: fs.FSWatcher | null = null;

  private constructor() {
    this.cache = new Map();
    this.dataPath = path.join(process.cwd(), DATA_PATH);
    this.initializeCache();
    this.startWatcher();
  }

  public static getInstance(): JsonContentManager {
    if (!JsonContentManager.instance) {
      JsonContentManager.instance = new JsonContentManager();
    }
    return JsonContentManager.instance;
  }

  /**
   * Инициализирует кэш, считывая все JSON-файлы в каталоге данных.
   * Выбрасывает ошибку, если каталог данных не найден.
   */
  private initializeCache(): void {
    if (!fs.existsSync(this.dataPath)) {
      throw new Error('Каталог данных не найден');
    }

    const files = fs.readdirSync(this.dataPath);
    files.forEach((file) => {
      if (file.endsWith('.json')) {
        const fileName = file.replace('.json', '');
        const filePath = path.join(this.dataPath, file);
        this.loadFileIntoCache(fileName, filePath);
      }
    });
  }

  /**
   * Запускает наблюдатель за файлами в каталоге данных, чтобы обнаруживать
   * изменения JSON-файлов. Когда файл добавляется, изменяется или удаляется,
   * кэш соответствующим образом обновляется.
   */
  private startWatcher(): void {
    this.watcher = fs.watch(this.dataPath, (eventType, filename) => {
      if (filename && filename.endsWith('.json')) {
        const fileName = filename.replace('.json', '');
        const filePath = path.join(this.dataPath, filename);

        switch (eventType) {
          case 'change':
            this.loadFileIntoCache(fileName, filePath);
            console.log(`Файл "${filename}" был обновлен.`);
            break;
          case 'rename':
            this.cache.delete(fileName);
            console.log(`Файл "${filename}" был удален.`);
            break;
        }
      }
    });

    this.watcher.on('error', (err) => {
      console.error('Ошибка в наблюдателе за файлами:', err);
    });
  }

  /**
   * Загружает содержимое JSON-файла в кэш.
   * Обрабатывает ошибки, записывая их в журнал и предоставляя значение по умолчанию, если оно задано.
   * @param fileName Имя файла (без расширения .json)
   * @param filePath Полный путь к файлу
   */
  private loadFileIntoCache(fileName: string, filePath: string): void {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      this.cache.set(fileName, JSON.parse(content));
    } catch (error) {
      console.error(`Ошибка загрузки файла "${fileName}.json":`, error);
    }
  }

  /**
   * Извлекает содержимое JSON-файла из кэша.
   * Если файл не найден в кэше, возвращает значение по умолчанию (если оно задано).
   * Если файл найден, обрабатывает содержимое HTML (если разрешено).
   * @param fileName Имя файла (без расширения .json)
   * @param options Параметры для менеджера контента
   * @returns Содержимое JSON-файла в виде TypedObject
   */
  public get<T extends JsonObject>(fileName: string, options: ContentManagerOptions = {}): T {
    const { defaultValue = null, allowHtml = false } = options;

    const cachedData = this.cache.get(fileName);
    if (cachedData) {
      return allowHtml ? this.processHtml(cachedData as T) : (cachedData as T);
    }

    if (defaultValue !== null) {
      return defaultValue as T;
    }

    throw new Error(`Файл "${fileName}.json" не найден в кэше`);
  }

  /**
   * Обрабатывает содержимое HTML в данных JSON.
   * @param data Данные JSON для обработки
   * @returns Обработанные данные с сохранением содержимого HTML
   */
  private processHtml<T extends JsonValue>(data: T): T {
    if (typeof data === 'string' && data.includes('</')) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.processHtml(item)) as T;
    }

    if (typeof data === 'object' && data !== null) {
      const processed = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, this.processHtml(value)])
      );
      return processed as T;
    }

    return data;
  }

  /**
   * Уничтожает экземпляр JsonContentManager, останавливая наблюдатель за файлами и очищая кэш.
   */
  public destroy(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    this.cache.clear();
  }
}

export const contentManager = JsonContentManager.getInstance();
