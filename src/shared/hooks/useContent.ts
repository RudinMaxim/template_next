import { contentManager, ContentManagerOptions, TypedObject } from '../lib';

export function useContent<T>(fileName: string, options: ContentManagerOptions = {}) {
  return contentManager.get<TypedObject<T>>(fileName, options);
}
