const express = require("express");
const cors = require("cors");
const prompts = require("prompts");
const { parse } = require("yaml");
const fs = require("fs");

const configFile = fs.readFileSync("./config.yml", "utf8");
const CONFIG = parse(configFile);

const app = express();
app.use(cors());

app.get("/node", (req, res) => {
  // if this node has the requested node number return
  // otherwise return node number closest to its number
  res.send("Done");
});

app.get("/file", (req, res) => {
  // return the requested file
});

app.listen(CONFIG["node-port-number"], () => {
  console.log(
    "Node " +
      CONFIG["node-number"] +
      " started listening on port " +
      CONFIG["node-port-number"]
  )

  listenForRequest();
});


function onRequest(message) {
  // find the requested file by asking nodes
  listenForRequest();
}

function listenForRequest() {
  prompts({
    type: "text",
    name: "okeb",
    message: "",
  }).then((res) => onRequest(res));
}
