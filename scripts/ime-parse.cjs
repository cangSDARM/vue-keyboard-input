const { spawnSync } = require("child_process");
const yaml = require("js-yaml");
const fs = require("node:fs");
const { join: joinPath, dirname, basename } = require("node:path");
const { parseArgs } = require("node:util");
const { platform } = require("node:os");
// const packageJson = require('../package.json');
const { createHash } = require("node:crypto");

const { values: args } = parseArgs({
  args: process.argv.slice(2),
  options: {
    path: {
      type: "string",
    },
    help: {
      type: "boolean",
    },
  },
});

const utils = {
  /** @param {import('node:fs').Dirent} dirent */
  direntPath: (dirent) => joinPath(dirent.parentPath, dirent.name),
  writeJson: (filename, json) => {
    const filepath = joinPath(args.path, filename);
    fs.mkdirSync(dirname(filepath), { recursive: true });
    return fs.promises.writeFile(filepath, JSON.stringify(json));
  },
  parseYaml: (schemaYaml) => {
    const content = yaml.load(
      fs.readFileSync(joinPath(schemaYaml), {
        encoding: "utf-8",
      })
    );
    return content;
  },
  getDictionary: (schemaId, yamlContent) => {
    const files = {};
    if (yamlContent.translator) {
      const { dictionary, prism } = yamlContent.translator;
      // By default, dictionary equals to schemaId, and prism equals to dictionary (not schemaId, see luna_pinyin_fluency)
      if (dictionary !== schemaId) {
        files.dict = dictionary;
      }
      if (prism !== dictionary) {
        files.prism = prism;
      }
    }

    return files;
  },
  md5sum: (path) => {
    const content = fs.readFileSync(path);
    return createHash("md5").update(content).digest("hex");
  },
};

const dependencyMap = {};
const schemaName = {};
const schemaTarget = {};
const schemaFiles = {};
const targetFiles = {};

async function main() {
  const schemes = fs
    .readdirSync(args.path, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .reduce((acc, dirent) => {
      const dir = utils.direntPath(dirent);
      const files = fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((sub) => sub.isFile());
      const yamls = files.filter((subDirent) =>
        subDirent.name.endsWith(".yaml")
      );

      targetFiles[dirent.name] = files.map((file) => ({
        name: file.name,
        md5: utils.md5sum(utils.direntPath(file)),
      }));

      return acc.concat(
        yamls.map((yaml) => ({
          dirent: yaml,
          dir,
          yaml: utils.parseYaml(utils.direntPath(yaml)),
        }))
      );
    }, []);

  for (const schema of schemes) {
    const id = schema.yaml.schema.schema_id;

    dependencyMap[id] = schema.yaml.schema.dependencies ?? [];
    schemaName[id] = schema.yaml.schema.name;
    schemaTarget[id] = basename(schema.dir);
    schemaFiles[id] = utils.getDictionary(id, schema.yaml);
  }

  await Promise.all([
    utils.writeJson("schema-name.json", schemaName),
    utils.writeJson("dependency-map.json", dependencyMap),
    utils.writeJson("schema-target.json", schemaTarget),
    utils.writeJson("schema-files.json", schemaFiles),
    utils.writeJson("target-files.json", targetFiles),
  ]);
}

if (process.env.npm_config_help || args.help) {
  console.log("生成 virtual-keyboard IME 需要的 json 文件");
  console.log("\tnpm run setup:ime");
  console.log("");
  console.log(`
目录下需要有:
  - ime-name
    - sub-ime-name.schema.yaml
    - *.reverse.bin
    - *.prism.bin
    - *.table.bin
yaml(主配置文件)内需要有:
  translator:
    dictionary
    prism
否则对应 bin 文件必须和 yaml 文件同名

> 相关文件可以通过"rime输入法/用户文件夹/build"内找到
`);
  console.log("");
  process.exit(0);
}

main().catch(console.error);
