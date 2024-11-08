import fs from 'fs';
import path from 'path';

/**
 * Базовый интерфейс для JSON данных с HTML
 */
interface BaseJsonData {
  [key: string]: unknown;
}

/**
 * Опции для получения JSON данных
 */
interface GetJsonOptions {
  defaultValue?: unknown;
}

/**
 * Получает данные из JSON файла по имени
 */
export const getDataJson = <T extends BaseJsonData>(
  fileName: string,
  options: GetJsonOptions = {}
): T => {
  const { defaultValue = null } = options;

  try {
    const filePath = path.join(process.cwd(), 'src/shared/assets/data/', `${fileName}.json`);

    if (!fs.existsSync(filePath)) {
      if (defaultValue === null) {
        throw new Error(`Файл ${fileName}.json не найден`);
      }
      return defaultValue as T;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent) as T;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Ошибка при чтении файла ${fileName}.json: ${error.message}`);
    }
    throw error;
  }
};
