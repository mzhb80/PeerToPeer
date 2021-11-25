const express = require("express");
const { getNearestNode } = require("./utils");

const router = express.Router();

/*
  get:
    description: Get a Node by its Node Number
    responses:
      200:
        description: Returns Requested Node or the Nearest Node (In Case It Doesn't Have IT)
      404:
        description: This Node Does not Have any Friend Nodes 
*/
router.get("/node", (req, res) => {
  // if this node has the requested node number return
  // otherwise return node number closest to its number
  const requestedNodeNumber = +req.query.nodeNumber;
  const node =
    CONFIG.friend_nodes.find(
      (node) => node.node_name === requestedNodeNumber
    ) || getNearestNode(CONFIG.friend_nodes, CONFIG.node_number);

  if (node)
    res.send({
      nodeNumber: node.node_name,
      port: node.node_port,
    });
  else res.status(404);
});

module.exports = router;
