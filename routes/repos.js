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

// helper function to get index of repo in repo array
function index(array, repo){
    for( i = 0; i< array.length; i++){
        if(array[i].repoID == repo){
            return i;
        }
    }
}

// helper function to determine if repo is already stored
function contains(array, repo){
    for( i = 0; i< array.length; i++){
        // is repo name in the array
        if(array[i].repoID == repo){
            return true;
        }
    }
    return false;
}

function extend(a, b){
    for(var key in b)
        if(b.hasOwnProperty(key))
            a[key] = b[key];
    return a;
 }

function dataComplete(repoID){
    var i = index(repositories, repoID);
    //presence of html_url checks for repo "get"
    if (repositories[i].html_url!=null && repositories[i].commitActivity!=null && repositories[i].participation!=null){
        return true;
    }
    return false;
 }

var repositories = []; // array to store all repo info
var reviews = {}; //object to store reviews for repo's

/* routing function to get a user's repo */
router.get('/', function(req, res) {
    // check to see if request was made with search bar
    if(Object.keys(req.query).length > 0){
        // safe to do .split on searchText
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
                if(!contains(repositories, data.full_name)){
                    r = {repoID: username+"/"+repository}
                    extend(r,data)
                    repositories.push(r);
                } else {
                    var i = index(repositories, username+"/"+repository)
                    extend(repositories[i],data);
                }
                //If all requests have been completed
                if (dataComplete(username+"/"+repository)){
                    res.render('home', { repos: repositories, 'reviews': reviews});
                }
            }
        });

        github.repos.getStatsCommitActivity({
            user: username,
            repo: repository
        }, function(err, data) {
            // error with request
            if(err){
                res.render('home', { message: "Could not find repository"});
            }
            else{
                // if not stored add it to the array
                if(!contains(repositories, username+"/"+repository)){
                    r = {repoID: username+"/"+repository}
                    commitActivity = {commitActivity: data}
                    extend(r,commitActivity)
                    repositories.push(r);
                } else {
                    var i = index(repositories, username+"/"+repository)
                    commitActivity = {commitActivity: data}
                    extend(repositories[i],commitActivity);
                }
                if (dataComplete(username+"/"+repository)){
                    res.render('home', { repos: repositories, 'reviews': reviews});
                }
            }
        });

        github.repos.getStatsParticipation({
            user: username,
            repo: repository
        }, function(err, data) {
            // error with request
            if(err){
                res.render('home', { message: "Could not find repository"});
            }
            else{
                // if not stored add it to the array
                if(!contains(repositories, username+"/"+repository)){
                    r = {repoID: username+"/"+repository}
                    participation = {participation: data}
                    extend(r,participation)
                    repositories.push(r);
                } else {
                    var i = index(repositories, username+"/"+repository)
                    participation = {participation: data}
                    extend(repositories[i],participation);
                }
                if (dataComplete(username+"/"+repository)){
                    res.render('home', { repos: repositories, 'reviews': reviews});
                }
            }
        });
    }
    // no query string was used so we will just load the home page
    else{
        res.render('home', { repos: repositories, 'reviews': reviews});
    }
});

/* routing function to delete a repo from the view */
router.route('/:name').delete(function(req, res) {
    // get repo to be deleted
    var repo = req.params.name;

    if(contains(repositories, repo)){
        //remove repo once you've found it's index.
        repositories.splice(index(repositories, repo),1);
        res.render('home', { repos: repositories, 'reviews': reviews});
    }
});

/* routing function to add review for a repo */
router.route('/review/add/:user/:repo').get(function(req, res) {
    var user = req.params.user;
    var repo = req.params.repo;

    // route to the addReview page
    res.render('addReview', { addReview: {'user': user, 'repo': repo} });
});

/* routing function to get a repo's reviews */
router.route('/review/:user/:repo').get(function(req, res) {
    var user = req.params.user;
    var repo = req.params.repo;
    var address = user + '/' + repo;

    // array of reviews for a particular repo
    reviewsArray = reviews[address].reviews;

    res.render('review', { reviews: reviewsArray, 'user': user, 'repo': repo });
});

/* routing function to add a review to a repo */
router.post('/review/', function(req, res) {
    var user = req.body.user;
    var repo = req.body.repo;
    var repoAddress = user + '/' + repo;
    var review = req.body.review;
    var username = req.body.username;
    var date = req.body.date;
    var subject = req.body.subject;
    var stars = req.body.star;

    if(reviews[repoAddress] == undefined){
        // initialize array of reviews if one does not exist
        reviews[repoAddress] = { reviews: [{"star": stars, "username": username, "subject":subject, "date":date, "review": review}]};
    }
    else{
        // push to array of reviews
        reviews[repoAddress].reviews.push({"star": stars, "username": username, "subject":subject, "date":date, "review": review});

    }

    res.redirect('../../repos');
});



module.exports = router;