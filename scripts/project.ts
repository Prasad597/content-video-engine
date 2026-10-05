import {
  existsSync,
  statSync,
  readdirSync,
  mkdirSync,
  copyFileSync,
  realpathSync,
  rmSync,
} from "node:fs";
import { resolve, join, relative, isAbsolute, basename } from "node:path";
import { pathToFileURL } from "node:url";
import { bundle } from "@remotion/bundler";
import type { ShortDefinition, ChannelDefinition } from "../src/engine/types";
import {
  validateAssetPath,
  validateChannel,
  validateId,
  validateShortDefinition,
} from "../src/engine/validateShort";
export const root = resolve(__dirname, "..");
export const args = (allowed: string[]) => {
  const parsed: Record<string, string> = {};
  const input = process.argv.slice(2);
  const positional: string[] = [];

  for (let i = 0; i < input.length; i += 1) {
    const token = input[i];
    if (token.startsWith("--")) {
      const key = token.replace(/^--/, "");
      if (!allowed.includes(key) || i + 1 >= input.length || input[i + 1].startsWith("--") || parsed[key])
        throw new Error(`Invalid argument: ${token}`);
      parsed[key] = input[i + 1];
      i += 1;
      continue;
    }

    positional.push(token);
  }

  for (const [index, key] of allowed.entries()) {
    if (parsed[key]) continue;
    if (positional[index]) parsed[key] = positional[index];
  }

  return parsed;
};
export const listContent = () =>
  readdirSync(join(root, "content"), { withFileTypes: true })
    .filter(
      (e) =>
        e.isDirectory() &&
        existsSync(join(root, "content", e.name, "content.ts")),
    )
    .map((e) => e.name)
    .sort();
export const loadChannel = async (id: string): Promise<ChannelDefinition> => {
  validateId(id);
  const channel = (
    await import(pathToFileURL(join(root, "channels", id, "index.ts")).href)
  ).default;
  validateChannel(channel);
  if (channel.id !== id) throw new Error("Channel folder/id mismatch");
  return channel;
};
export const loadContentPackage = async (id: string) => {
  if (id !== "_template") validateId(id);
  const directory = realpathSync(join(root, "content", id));
  const short = (
    await import(pathToFileURL(join(directory, "content.ts")).href)
  ).default as ShortDefinition;
  validateShortDefinition(short);
  if (id !== "_template" && short.id !== id)
    throw new Error("Content folder/id mismatch");
  return { short, directory };
};
export const loadShort = async (id: string) =>
  (await loadContentPackage(id)).short;
export const prepareOutput = (content: { directory: string; short: ShortDefinition }) => {
  validateId(content.short.id);
  const directory = join(content.directory, "output");
  mkdirSync(directory, { recursive: true });
  return join(directory, `${content.short.id}.mp4`);
};
export const audioPaths = (short: ShortDefinition) => [
  short.narration,
  ...(short.audio?.music ? [short.audio.music.file] : []),
  ...(short.audio?.effects?.map((c) => c.file) ?? []),
];
export const resolveAudio = (name: string) => {
  validateAssetPath(name);
  const path = resolve(root, name);
  if (existsSync(path)) {
    const rel = relative(root, realpathSync(path));
    if (rel.startsWith("..") || isAbsolute(rel) || !statSync(path).isFile())
      throw new Error(`Audio must be a file inside the repository: ${name}`);
  }
  return path;
};
export const stageAssets = (shorts: ShortDefinition[], directory: string) => {
  mkdirSync(directory, { recursive: true });
  for (const name of new Set(shorts.flatMap(audioPaths))) {
    const source = resolveAudio(name);
    if (!existsSync(source)) continue;
    const target = join(directory, name);
    mkdirSync(resolve(target, ".."), { recursive: true });
    copyFileSync(source, target);
  }
  return directory;
};
export const bundleShorts = async (publicDir: string) =>
  bundle({ entryPoint: join(root, "src/index.ts"), publicDir });

// Only remove staging directories allocated by these commands, inside this repo.
export const cleanupStage = (directory: string) => {
  const path = resolve(directory);
  const parent = resolve(root, ".tmp");
  if (
    resolve(path, "..") !== parent ||
    !/^(render|studio|validate)-assets-/.test(basename(path))
  )
    throw new Error("Refusing to remove a non-staging directory");
  if (existsSync(path) && realpathSync(path) !== path)
    throw new Error("Refusing to remove redirected staging directory");
  rmSync(path, { recursive: true, force: true });
};
