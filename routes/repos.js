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
    console.log("searchText" + searchText);
    console.log(JSON.stringify(req.query));

    github.repos.get({
	    user: username,
	    repo: repository
	}, function(err, data) {
	    res.render('home', { repo: JSON.stringify(data)});
	});
});


/*UserRepo = function(req, res) {
    var username = req.params.user;
    var repository = req.params.repo;
    console.log("username" + username + "repo" + repository);
    github.repos.get({
	    user: username,
	    repo: repository
	}, function(err, res) {
	    console.log(JSON.stringify(res));
	});
}
*/

module.exports = router;