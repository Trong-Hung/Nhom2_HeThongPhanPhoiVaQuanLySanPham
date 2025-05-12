

class NewsController {
  
    index(req, res) {
        res.render("./new", { title: "new" });
    }
}

module.exports = new NewsController();