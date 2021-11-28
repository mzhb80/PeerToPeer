const fs = require("fs");
const express = require("express");
const cors = require("cors");
const prompts = require("prompts");
const { parse } = require("yaml");
const router = require("./routes");
const { mapFilesToNodeNumbers, getNearestNode } = require("./utils");
const axios = require("axios").default;
// import * as stream from 'stream'
const stream = require("stream");
const { promisify } = require("util");

let CONFIG = require("./config");
const path = require("path");
let filesMap;

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

function getFile(port, fileName, destPath) {
  const finished = promisify(stream.finished);
  const writer = fs.createWriteStream(
    destPath
  );
  axios({
    url: `http://localhost:${port}/${fileName}`,
    method: "get",
    responseType: "stream",
  })
    .then((res) => {
      res.data.pipe(writer);
      finished(writer);
    })
    .catch((err) => {
      console.log("\n\nerror : \n");
      console.warn(err);
    });
}

async function onRequest(message) {
  // find the requested file by asking nodes

  console.log(CONFIG);

  let node = getNode(message);

  if (!node) {
    console.log("Not found this file");
  } else {
    console.log("Found this file in node " + node);
    //search for finding node
    let isInFriend = CONFIG.friend_nodes.find((fn) => fn.node_name === node);

    if (CONFIG.node_number === node) {
      console.log("You have this file !");
    } else if (isInFriend !== null && isInFriend !== undefined) {
      console.log(
        "Found this file in friend node " + isInFriend.node_port + "\n"
      );

      getFile(isInFriend.node_port, message, path.join(__dirname, `../${CONFIG.new_files_dir}${message}`));
    } else {
      // not in friend node
      console.log("Not found this file in friend node");

      console.log(getNearestNode(CONFIG.friend_nodes, CONFIG.node_number));
      let nearestNode = getNearestNode(CONFIG.friend_nodes, CONFIG.node_number);
      let isExist = false;

      //dummy !
      let idx = 0;
      let port = nearestNode.node_port;

      //for test replace !isExist with idx < 5 and uncomment line 100
      while (!isExist) {
        console.log(port);
        let request = await axios
          .get(`http://localhost:${port}/node?nodeNumber=${node}`)
          .then((res) => {
            console.log(res.data);

            if(res.data.nodeNumber === node){
              isExist = true;
              port = res.data.port
            }
            else{
              port = res.data.port
            }
          });

      }

      if (isExist) {
        console.log("ready for getting file from port : ", port);
        getFile(port, message, path.join(__dirname, `../Node${CONFIG.node_number}/newFiles/${message}`));
      }
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
