    const Pothole = require("../models/Pothole");

    const potholeController = {
        //Create Pothole
        createPothole: async (req,res) => {
            try {
                const newPothole = await new Pothole({
                    street: req.body.street,
                    longitude: req.body.longitude,
                    latitude: req.body.latitude,
                    level: req.body.level
                })

                const pothole = await newPothole.save();
                res.status(200).json(pothole);
            }
            catch (err) {
                res.status(500).json(err)
            }
        },
        //Get all potholes
        getAllPotholes: async(req,res)=> {
            try {
                const pothole = await Pothole.find();
                res.status(200).json(pothole);
            }
            catch (err) {
                res.status(500).json(err);
            }
        },
        
        //Find pothole with street name
        getPotholesByStreet: async (req,res) => {
            try {
                const searchString = req.params.street;
                const searchWords = searchString.split(" ").map(word => new RegExp(word, "i"));

                const potholes = await Pothole.find({
                    street: {$in: searchWords}
                });
                if (potholes.length > 0) {
                    res.status(200).json(potholes);
                } else {
                    res.status(404).json({ message: "No potholes found matching these keywords" });
                }
            }
            catch (err) {
                res.status(500).json(err)
            }
        },
        
        //Update pothole by id
        updatePothole: async (req, res) => {
            try {
                const potholeId = req.params.id;
                const updatedData = req.body;
        
                console.log("Updating pothole with ID:", potholeId);
                console.log("Updated data:", updatedData);
        
                const updatedPothole = await Pothole.findByIdAndUpdate(
                    potholeId,
                    { $set: updatedData },
                    { new: true, runValidators: true }
                );
        
                if (updatedPothole) {
                    console.log("Pothole updated:", updatedPothole);
                    res.status(200).json(updatedPothole);
                } else {
                    console.log("Pothole not found");
                    res.status(404).json("Pothole not found");
                }
            } catch (err) {
                console.error("Error updating pothole:", err);
                res.status(500).json(err);
            }
        },
        
        //Delete Pothole
        deletePothole: async (req,res) => {
            try {
                const pothole = await Pothole.findByIdAndDelete(req.params.id);
                res.status(200).json("Deleted successfully")
            }
            catch (err) {
                res.status(500).json(err);
            }
        }
    }

    module.exports = potholeController;