// Import Modules
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

function index(array, repo){
    for( i = 0; i< array.length; i++){
        if(array[i].name == repo){
            return i;
        }
    }
}

// helper function to determine if repo is already stored
function contains(array, repo){
    for( i = 0; i< array.length; i++){
        // is repo name in the array
        if(array[i].name == repo){
            return true;
        }
    }
    return false;
}

var repositories = []; // array to store all repo info
var reviews = {};

/* routing function to get a user's repo */
router.get('/', function(req, res) {
    console.log('QUERY'+ JSON.stringify(req.query));
    if(Object.keys(req.query).length > 0){
        var searchText = req.query.searchText;
        var username = searchText.split('/')[0];
        var repository = searchText.split('/')[1];

        // call github API to get repo info
        github.repos.get({
            user: username,
            repo: repository
        }, function(err, data) {
            // error with request
            if(err){
                res.render('home', { message: "Could not find repository"});
            }
            else{
                // if not stored add it to the array
                if(!contains(repositories, data.name)){
                    repositories.push(data);
                }
                res.render('home', { repos: repositories, 'reviews': reviews});
            }
        });
    }
    else{
        res.render('home', { repos: repositories, 'reviews': reviews});
    }
});

/* routing function to get a user's repo */
router.route('/:name').delete(function(req, res) {
    // get repo to be deleted
    var repo = req.params.name;

    if(contains(repositories, repo)){
        //remove repo once you've found it's index.
        repositories.splice(index(repositories, repo),1);
        res.render('home', { repos: repositories });
    }
});

/* routing function to get a user's repo */
router.route('/review/add/:user/:repo').get(function(req, res) {
    // get repo to be deleted
    var user = req.params.user;
    var repo = req.params.repo;

    res.render('addReview', { addReview: {'user': user, 'repo': repo} });
});

/* routing function to get a repo's reviews */
router.route('/review/:user/:repo').get(function(req, res) {
    // get repo to be deleted
    var user = req.params.user;
    var repo = req.params.repo;
    var address = user + '/' + repo;

    reviewsArray = reviews[address];

    res.render('review', { reviews: reviewsArray, 'user': user, 'repo': repo });
});

/* routing function to get a user's repo */
router.post('/review/', function(req, res) {
    // get repo to be deleted
    console.log('got into put call');
    var user = req.body.user;
    var repo = req.body.repo;
    var repoAddress = user + '/' + repo;
    var review = req.body.review;

    if(reviews[repoAddress] == undefined){
        // initialize array of reviews if one does not exist
        reviews[repoAddress] = [review];
    }
    else{
        // push to array of reviews
        reviews[repoAddress].push(review);
    }

    console.log(JSON.stringify(reviews));
    res.render('home', { repos: repositories, 'reviews': reviews});
});



module.exports = router;