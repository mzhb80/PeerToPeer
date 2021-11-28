const fs = require("fs");
const express = require("express");
const cors = require("cors");
const prompts = require("prompts");
const { parse } = require("yaml");
const router = require("./routes");
const { mapFilesToNodeNumbers, getNearestNodeButNode } = require("./utils");
const axios = require("axios").default;
// import * as stream from 'stream'
const stream = require("stream");
const { promisify } = require("util");

let CONFIG = require("./config");
const path = require("path");
const { requestLogger } = require("./logger");
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

function getNode(fileName) {
  return filesMap.get(fileName);
}

function getFile(port, fileName, destPath) {
  const finished = promisify(stream.finished);
  const writer = fs.createWriteStream(destPath);
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

async function onRequest(filename) {
  console.log(filename);
  let node = getNode(filename);

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

      getFile(isInFriend.node_port, filename, CONFIG.new_files_dir + filename);
    } else {
      // not in friend node
      console.log("Not found this file in friend node");

      console.log(getNearestNodeButNode(null));
      let nearestNode = getNearestNodeButNode(null);
      let isExist = false;

      //dummy !
      let idx = 0;
      let port = nearestNode.node_port;

      //for test replace !isExist with idx < 5 and uncomment line 100
      while (!isExist) {
        console.log(port);
        let request = await axios
          .get(
            `http://localhost:${port}/node?requester=${CONFIG.node_number}&nodeNumber=${node}`
          )
          .then((res) => {
            console.log(res.data);

            if (res.data.nodeNumber === node) {
              isExist = true;
              port = res.data.port;
            } else {
              port = res.data.port;
            }
            // if (res.data.port) {
            //   port = res.data.port;
            // } else if (res.data.result === "I have this file") {
            //   isExist = true;
            //   // idx = 5;
            // }
          });

        // idx++;
      }

      if (isExist) {
        console.log("ready for getting file from port : ", port);
        getFile(port, filename, CONFIG.new_files_dir + filename);
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

function listenForRequest() {
  prompts(promptOptions).then((message) =>
    onRequest(message.request.split(" ")[1])
  );
}
