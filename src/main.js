const fs = require("fs");
const stream = require("stream");
const { promisify } = require("util");

const express = require("express");
const cors = require("cors");
const prompts = require("prompts");
const { parse } = require("yaml");
const axios = require("axios").default;

const router = require("./routes");
const { mapFilesToNodeNumbers, getNearestNodeExcluing } = require("./utils");
const { requestLogger } = require("./logger");

let CONFIG = require("./config");
let filesMap;

const nodesFilesPath = process.argv[3];
const nodesfilesContent = fs.readFileSync(nodesFilesPath, "utf8");
const nodesFiles = parse(nodesfilesContent).node_files;
filesMap = mapFilesToNodeNumbers(nodesFiles);

const app = express();
app.use(cors());
app.use(requestLogger);
app.use(express.static(CONFIG.owned_files_dir));
app.use("/", router);

app.listen(CONFIG.node_port, () => {
  console.log(
    "Node " +
      CONFIG.node_number +
      " started listening on port " +
      CONFIG.node_port
  );

  listenForRequest();
});

async function getFile(port, filename) {
  const finished = promisify(stream.finished);
  const writer = fs.createWriteStream(CONFIG.new_files_dir + filename);
  try {
    const res = await axios({
      url: `http://localhost:${port}/${filename}`,
      method: "get",
      responseType: "stream",
    });
    res.data.pipe(writer);
    finished(writer);
    console.log(filename + " was downloaded to " + CONFIG.new_files_dir);
  } catch (err) {
    console.err("error in get file", err);
  }
}

async function simpleFindNode(targetNodeNumber) {
  const nearestNode = getNearestNodeExcluing([]);
  let targetNode = nearestNode;
  const visitedNodeNames = [];
  while (targetNodeNumber !== targetNode.node_name) {
    if (visitedNodeNames.includes(targetNode.node_name)) {
      console.error(
        `Loop detected: ` +
          visitedNodeNames.join(" -> ") +
          " -> " +
          targetNode.node_name
      );
      console.error("Terminating...");
      return null;
    }

    visitedNodeNames.push(targetNode.node_name);
    try {
      console.log(`Requesting to node ${targetNode.node_name}`);
      const res = await axios.get(
        `http://localhost:${targetNode.node_port}/node?requester=${CONFIG.node_number}&nodeNumber=${targetNodeNumber}`
      );
      targetNode = res.data;
    } catch (err) {
      console.error(
        `Node ${targetNode.node_name} does not have any friend node`
      );
      console.error("Terminating...");
      return null;
    }
  }

  return targetNode;
}

async function advancedFindNode(targetNodeNumber) {
  const visitedFriends = [];

  let targetNode;
  while (visitedFriends.length !== CONFIG.friend_nodes.length) {
    const nearest = getNearestNodeExcluing(visitedFriends);
    targetNode = nearest;
    const visitedNodeNames = [];

    while (targetNodeNumber !== targetNode.node_name) {
      visitedNodeNames.push(targetNode.node_name);
      try {
        console.log(`Requesting to node ${targetNode.node_name}`);
        const res = await axios.post(
          `http://localhost:${targetNode.node_port}/node/v2`,
          {
            requester: CONFIG.node_number,
            excludeNodes: visitedNodeNames,
            nodeNumber: targetNodeNumber,
          }
        );
        targetNode = res.data;
      } catch (err) {
        console.error(
          `Node ${targetNode.node_name} does not have any more nodes`
        );
        break;
      }
    }

    if (targetNodeNumber === targetNode.node_name) return targetNode;
    visitedFriends.push(nearest);
  }

  return null;
}

async function fetchFile(filename, advanced) {
  let targetNodeNumber = filesMap.get(filename);

  if (!targetNodeNumber) {
    console.error("No such a file was found in any node");
    return;
  }

  if (CONFIG.node_number === targetNodeNumber) {
    console.log("The file already exists");
    return;
  }

  console.log("Found the file in node " + targetNodeNumber);

  const possibleFriendNode = CONFIG.friend_nodes.find(
    (n) => n.node_name === targetNodeNumber
  );
  if (possibleFriendNode) {
    console.log(`Node ${targetNodeNumber} was a friend`);
    await getFile(possibleFriendNode.node_port, filename);
    return;
  }

  let node;
  if (advanced) node = await advancedFindNode(targetNodeNumber);
  else node = await simpleFindNode(targetNodeNumber);

  if (!node && !advanced) {
    console.log("Could not find node");
    const res = await prompts({
      type: "confirm",
      name: "advanced",
      message: "Would like to do an advanced search?",
    });

    if (res.advanced) fetchFile(filename, true);
    return;
  } else if (!node && advanced) {
    console.log("Advanced search failed");
    return;
  }

  console.log(
    `Port of nonfriend node ${node.node_name} was found (${node.node_port})`
  );
  await getFile(node.node_port, filename);
  return;
}

async function onRequest(filename) {
  await fetchFile(filename, false);
  listenForRequest();
}

const promptOptions = {
  type: "text",
  name: "request",
  message: "",
  validate: (message) => {
    const tokens = message.split(" ");
    return (
      tokens.length === 2 && (tokens[0] === "request" || tokens[0] === "r")
    );
  },
};

function listenForRequest() {
  prompts(promptOptions).then((message) =>
    onRequest(message.request.split(" ")[1])
  );
}
