let CONFIG = require("./config");

function mapFilesToNodeNumbers(nodesFiles) {
  const filesMap = new Map();
  nodesFiles.forEach((node) => {
    node.node_files.forEach((filename) => {
      filesMap.set(filename, node.node_name);
    });
  });
  return filesMap;
}

function getNearestNodeExcluing(nodeNumbers) {
  return CONFIG.friend_nodes
    .filter((n) => !nodeNumbers.includes(n.node_name))
    .reduce((previous, current) => {
      return Math.abs(current.node_name - CONFIG.node_number) <
        Math.abs(previous.node_name - CONFIG.node_number)
        ? current
        : previous;
    });
}

module.exports = {
  mapFilesToNodeNumbers,
  getNearestNodeExcluing,
};
