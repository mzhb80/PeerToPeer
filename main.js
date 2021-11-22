const express = require("express");
const cors = require("cors");
const prompts = require("prompts");
const { parse } = require("yaml");
const fs = require("fs");

const configFile = fs.readFileSync("./testCase/Config.yml", "utf8");
const CONFIG = parse(configFile);

const nodeFilesFile = fs.readFileSync("./testCase/NodeFiles.yml", "utf8");
const NODES = parse(nodeFilesFile);

const app = express();
app.use(cors());

// to get file -> localhost:port/filename
app.use(express.static("./owned/"));
// app.use(express.static(CONFIG.owned_files_dir));

function getNearestNode() {
  let nearestNode = CONFIG.friend_nodes[0];
  CONFIG.friend_nodes.forEach((node) => {
    if (
      Math.abs(node.node_name - nearestNode.node_name) <
      Math.abs(CONFIG.node_name - nearestNode.node_name)
    ) {
      nearestNode = node;
    }
  });

  return nearestNode;
}

app.get("/", (req, res) => res.send("Ok"));

// example: /node?nodeNumber=3
app.get("/node", (req, res) => {
  // if this node has the requested node number return
  // otherwise return node number closest to its number
  const requestedNodeNumber = +req.query.nodeNumber;
  const requestedNode = CONFIG.friend_nodes.find(
    (node) => node.node_name === requestedNodeNumber
  );
  if (requestedNode)
    res.send({
      found: true,
      nodeNumber: requestedNode.node_name,
      port: requestedNode.node_port,
    });
  else {
    const nearestNode = getNearestNode();
    res.send({
      found: false,
      nodeNumber: nearestNode.node_name,
      port: nearestNode.node_port,
    });
  }
});

app.listen(CONFIG["node_port"], () => {
  console.log(
    "Node " +
      CONFIG["node_number"] +
      " started listening on port " +
      CONFIG["node_port"]
  );

  listenForRequest();
});

function initialMessageValidate(message) {
  if (
    message.request.split(" ").length != 2 ||
    !message.request.includes("request")
  ) {
    return false;
  } else return true;
}

function getNode(fileName) {
  for (let node in NODES.node_files) {
    const isExist = NODES.node_files[node].node_files.find(
      (file) => file === fileName
    );
    if (isExist === fileName) {
      return NODES.node_files[node].node_name;
    }
  }

  return null;
}

function onRequest(message) {
  // find the requested file by asking nodes

  if (!initialMessageValidate(message)) {
    console.log("Invalid message");
  } else {
    let node = getNode(message.request.split(" ")[1]);

    if (node === null) {
      console.log("Not found this file");
    } else {
      console.log("Found this file in node " + node);
      //search for finding node
    }
  }
  listenForRequest();
}

function listenForRequest() {
  prompts({
    type: "text",
    name: "request",
    message: "",
  }).then((res) => onRequest(res));
}
