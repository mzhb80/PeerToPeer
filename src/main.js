const fs = require("fs");
const stream = require("stream");
const { promisify } = require("util");

const express = require("express");
const cors = require("cors");
const prompts = require("prompts");
const { parse } = require("yaml");
const axios = require("axios").default;

const router = require("./routes");
const {
  mapFilesToNodeNumbers,
  getNearestNodeButNode,
} = require("./utils");
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

async function simpleFileFetch(filename) {
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

  const nearestNode = getNearestNodeButNode(null);
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
      return;
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
      return;
    }
  }

  console.log(
    `Port of nonfriend node ${targetNode.node_name} was found (${targetNode.node_port})`
  );
  await getFile(targetNode.node_port, filename);
}

async function onRequest(filename) {
  await prompts(requestType).then(async type => {
    // console.log(type);
    if(type.type === 0){
      await simpleFileFetch(filename);
    }else if(type.type === 1){
      // console.log('advanced');
      await advancedFileFetch(filename)
    }
  })
  
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
    onRequest(message.request.split(" ")[1]),
  );
}

//extra score
const requestType = {
  type: 'select',
  name: 'type',
  message: 'Choose a request type',
  choices: [
      'Simple' , 'Advanced'
  ]
}

async function advancedFileFetch(filename){
  //check here
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

  let excludeNodes = []
}
