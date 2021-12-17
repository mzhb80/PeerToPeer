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

function getNearNodeWithoutExclude(nodeNumber , exclude ){
  //check here
  let sortedFriends = CONFIG.friend_nodes.sort((a , b) => a.node_name - b.node_name)
  let foundedNode;
  for(let node in sortedFriends){
    if(!exclude.includes(sortedFriends[node].node_name)){
      foundedNode = sortedFriends[node]
      break;
    }
  }

  return foundedNode
}

module.exports = {
  mapFilesToNodeNumbers,
  getNearestNodeButNode,
  getNearNodeWithoutExclude
};
