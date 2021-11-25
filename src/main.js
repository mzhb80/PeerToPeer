const fs = require("fs");
const express = require("express");
const cors = require("cors");
const prompts = require("prompts");
const { parse } = require("yaml");
const router = require("./routes");
const { mapFilesToNodeNumbers } = require("./utils");
const axios = require("axios")



let CONFIG;
let filesMap;

const configPath = process.argv[2];
const configFileContent = fs.readFileSync(configPath, "utf8");
CONFIG = parse(configFileContent);

const nodesFilesPath = process.argv[3];
const nodesfilesContent = fs.readFileSync(nodesFilesPath, "utf8");
const nodesFiles = parse(nodesfilesContent).node_files;
filesMap = mapFilesToNodeNumbers(nodesFiles);

const app = express();
app.use(cors());
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

function initialMessageValidate(message) {
  if (
    message.request.split(" ").length != 2 ||
    !message.request.includes("r")
  ) {
    return false;
  } else return true;
}

function getNode(fileName) {
  return filesMap.get(fileName);
}

function onRequest(message) {
  // find the requested file by asking nodes

  let node = getNode(message);
  

  if (!node) {
    console.log("Not found this file");
  } else {
    console.log("Found this file in node " + node);
    //search for finding node
    let isInFriend = CONFIG.friend_nodes.find(fn => fn.node_name === node)
    console.log(isInFriend);
    if(isInFriend !== null && isInFriend !== undefined){
      console.log("Found this file in friend node " + isInFriend.node_port);
    }
    else{
      // not in friend node
      console.log("Not found this file in friend node");

    }
  }
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

const fancyPromptOptions = {
  type: "autocomplete",
  name: "request",
  message: "",
  choices: Array.from(filesMap).map(([key, value]) => ({ title: key })),
};

function listenForRequest() {
  // prompts(promptOptions).then((res) => onRequest(res));
  prompts(fancyPromptOptions).then((res) => onRequest(res.request));
}
