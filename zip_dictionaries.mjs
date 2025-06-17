/**
 * transfer rime dictionaries to our format
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import url from "node:url";

const YAML_DICTIONARY_PATH = "./src/assets/dictionary";
const KEYBOARD_COMPONENT_PATH = "./src/components/SimpleKeyboard/";

const base = import.meta.url;
const resolve = (path) => url.fileURLToPath(new URL(path, base));
const simpleJoin = (base, filename) => base + filename;

function rerange(pinyin) {
  let composited = "";
  const result = {};
  for (const key in pinyin) {
    Object.keys(pinyin[key])
      // auto convert string to number, and sort
      .sort((a, b) => b - a)
      .forEach((k) => {
        if (!composited) {
          composited = pinyin[key][k].join(" ");
        } else {
          composited += " " + pinyin[key][k].join(" ");
        }
      });
    result[key] = composited;
    composited = "";
  }

  return result;
}

async function main() {
  const dictionaries = resolve(YAML_DICTIONARY_PATH);

  const files = await fs.promises.readdir(dictionaries, {
    withFileTypes: true,
  });

  /** 单字的字典
   * @type {Record<string, any>} */
  const simplePinyin = {};

  /** 词组 */
  const compositedPinyin = {};

  for (let file of files) {
    if (file.isDirectory()) continue;
    if (!file.name.endsWith(".yaml")) continue;

    const rl = readline.createInterface({
      input: fs.createReadStream(
        path.join(file.path || file.parentPath, file.name)
      ),
    });

    let isStartBlockEnd = false;

    await new Promise((resolve) => {
      rl.on("line", (line) => {
        // header body boundary
        if (line === "...") {
          isStartBlockEnd = true;
          return;
        }
        // header
        if (!isStartBlockEnd) return;
        // comment
        if (line.startsWith("#")) return;

        const [composited, en, freq] = line.split("	");

        // handle pinyin
        let pinyin = en;
        if (!pinyin.includes(" ")) {
          simplePinyin[pinyin] ??= {};
          simplePinyin[pinyin][freq] ??= [];
          simplePinyin[pinyin][freq].push(composited);
        } else {
          pinyin = en.replaceAll(/\s/gi, "'");

          compositedPinyin[pinyin] ??= "";
          compositedPinyin[pinyin] += composited + " ";
        }
      });
      rl.on("close", resolve);
    });

    // const output = path.join(file.path || file.parentPath, file.name + '.json');

    // await fs.promises.writeFile(output, JSON.stringify(json, null, 2));
  }

  await fs.promises.writeFile(
    resolve(simpleJoin(KEYBOARD_COMPONENT_PATH, "pinyin.simple.json")),
    JSON.stringify(rerange(simplePinyin), null)
  );

  for (let key in compositedPinyin) {
    compositedPinyin[key] = compositedPinyin[key].trim();
  }

  await fs.promises.writeFile(
    resolve(simpleJoin(KEYBOARD_COMPONENT_PATH, "pinyin.words.json")),
    JSON.stringify(compositedPinyin, null)
  );
}

await main();
