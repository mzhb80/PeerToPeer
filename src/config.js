const fs = require('fs')
const { parse } = require("yaml");

const configPath = process.argv[2];
const configFileContent = fs.readFileSync(configPath, "utf8");
const CONFIG = parse(configFileContent);

module.exports = CONFIG;