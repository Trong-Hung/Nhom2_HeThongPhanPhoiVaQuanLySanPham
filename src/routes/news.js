const express = require("express");
const router = express.Router();

const newsController =require ("../app/controllers/NewsController");

router.get("/", newsController.index); // GET /news

module.exports = router;
