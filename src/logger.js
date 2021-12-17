const requestIp = require("request-ip");

const requestLogger = function (req, res, next) {
  let logMessage = "Request for ";
  if (req.path === "/node")
    logMessage += "port of node " + req.query.nodeNumber;
  else logMessage += req.path.slice(1);
  console.log(logMessage);
  next();
};

module.exports = { requestLogger };
