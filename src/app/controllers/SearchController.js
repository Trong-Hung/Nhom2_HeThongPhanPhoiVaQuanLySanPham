class SearchController {
  // GET /news
  index(req, res) {
    res.render("./search", { title: "News" });
  }

  show(req, res) {
    res.send("News detail");
  }
}

module.exports = new SearchController();
