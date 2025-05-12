const express = require("express");
const router = express.Router();

const searchController = require("../app/controllers/SearchController");

// newsController.index

router.get("/titell", searchController.show); // GET /news
router.get("/", searchController.index); // GET /news

module.exports = router;
