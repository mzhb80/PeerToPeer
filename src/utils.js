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

function getNearestNodeButNode(nodeNumber) {
  return CONFIG.friend_nodes
    .filter((n) => n.node_name !== nodeNumber)
    .reduce((previous, current) => {
      return Math.abs(current - CONFIG.node_number) <
        Math.abs(previous - CONFIG.node_number)
        ? current
        : previous;
    });
}

module.exports = { mapFilesToNodeNumbers, getNearestNodeButNode };
