var GitHubApi = require("github"); // require git API
var express = require('express'),
    router = express.Router(),
    bodyParser = require("body-parser");

var github = new GitHubApi({
    // required
    version: "3.0.0",
    // optional
    debug: true,
    protocol: "https",
    host: "api.github.com", // should be api.github.com for GitHub
    // pathPrefix: "none", //for some GHEs; none for GitHub
    timeout: 5000,
    headers: {
        "user-agent": "My-Cool-GitHub-App" // GitHub is happy with a unique user agent
    }
});

/* routing function to get a user's repo */
router.get('/', function(req, res) {
    var searchText = req.query.searchText;
    var username = searchText.split('/')[0];
    var repository = searchText.split('/')[1];

    // call github API to get repo info
    github.repos.get({
        user: username,
        repo: repository
    }, function(err, data) {
        if(err){
            req.flash('error', "Could not find repository!");
            res.redirect('/repos');
        }
        else{
            res.render('home', { repo: data});
        }
    });
});

module.exports = router;