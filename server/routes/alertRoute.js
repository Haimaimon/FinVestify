const express = require('express');
const {getAlert,addAlert,deleteAlert} = require("../controllers/alertController");
const {auth} = require("../middleware/auth");
const router = express.Router();

router.get('/alert' , auth,getAlert);
router.post('/alert/addalert' , auth, addAlert);
router.delete('/alert/:id', auth, deleteAlert);

module.exports = router;