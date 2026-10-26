import { readModels } from '#lib/server/models';

export function load() {
  return { models: readModels() };
}
