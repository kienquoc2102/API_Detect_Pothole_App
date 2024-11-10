const middlewareController = require("../controllers/middlewareController");
const potholeController = require("../controllers/potholeController");

const router = require("express").Router();

router.get("/", middlewareController.verifyToken, potholeController.getAllPotholes);
router.post("/create", middlewareController.verifyToken, potholeController.createPothole);
router.get("/search/:street", middlewareController.verifyToken, potholeController.getPotholesByStreet);
router.put("/update/:id", middlewareController.verifyToken, potholeController.updatePothole)
router.delete("/delete/:id", middlewareController.verifyToken, potholeController.deletePothole)

module.exports = router;