import { readFile } from "node:fs/promises";
import { parse as parseYaml } from "yaml";

export async function loadYamlFile<T>(filePath: string): Promise<T> {
  const text = await readFile(filePath, "utf8");
  return parseYaml(text) as T;
}
