function mapFilesToNodeNumbers(nodesFiles) {
  const filesMap = new Map();
  nodesFiles.forEach((node) => {
    node.node_files.forEach((filename) => {
      filesMap.set(filename, node.node_name);
    });
  });
  return filesMap;
}

function getNearestNode(friend_nodes, node_number) {
  return friend_nodes.reduce((previous, current) => {
    return Math.abs(current - node_number) < Math.abs(previous - node_number)
      ? current
      : previous;
  });
}

module.exports = { mapFilesToNodeNumbers, getNearestNode };
