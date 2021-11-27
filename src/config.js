const fs = require('fs')
const { parse } = require("yaml");

let CONFIG ;

const configPath = process.argv[2];
const configFileContent = fs.readFileSync(configPath, "utf8");
CONFIG = parse(configFileContent);

module.exports = CONFIG;