const express = require("express");
const { getNearestNodeButNode , getNearNodeWithoutExclude } = require("./utils");
const CONFIG = require("./config");

const router = express.Router();
const app = express()
const bodyParser = require('body-parser')

const jsonParser = bodyParser.json()
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
  const requester = +req.query.requester;
  const requestedNodeNumber = +req.query.nodeNumber;
  const node =
    CONFIG.friend_nodes.find(
      (node) => node.node_name === requestedNodeNumber
    ) || getNearestNodeButNode(requester);

  if (node) res.send(node);
  else res.status(404);
});

router.post('/node/v2' , jsonParser ,(req , res) => {
  const requester = +req.body.requester  ;
  const requestedNumber = +req.body.nodeNumber
  const excludeNodes = req.body.excludeNodes

  console.log(getNearNodeWithoutExclude(requester , excludeNodes));
  // console.log(req.body);
  // res.send('okeb')
})


module.exports = router;
