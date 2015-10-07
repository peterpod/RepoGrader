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

//merges json arrays. used to stitch JSON responses from each get request together
function extend(a, b){
    for(var key in b)
        if(b.hasOwnProperty(key))
            a[key] = b[key];
    return a;
 }

//checks to see if all requests have been completed by looking for specific fields
//called before rendering view 
function dataComplete(repoID){
    var i = index(repositories, repoID);
    for (var ind = 0; ind < repositories.length; ind++) {
        console.log(Object.keys(repositories[ind]));
    }
    //Check if each of the requests have been returned
    if (repositories[i].getInfo!=null && repositories[i].commitActivity!=null && repositories[i].participation!=null && repositories[i].contributorList!=null){
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
            var repoID = (username+"/"+repository).toLowerCase();
            // error with request
            if(err){
                res.render('home', { message: "Could not find repository"});
            }
            else{
                // if not stored add it to the array
                if(!contains(repositories, repoID)){
                    r = {repoID: repoID}
                    getInfo = {getInfo: data};
                    extend(r,getInfo);
                    repositories.push(r);
                    console.log("NEW REPO "+ repository +" getInfo")
                } else {
                    var i = index(repositories, repoID)
                    getInfo = {getInfo: data};
                    extend(repositories[i],getInfo);
                    console.log("ADDED getInfo info for REPO "+ repository)
                }
                if (dataComplete(repoID)){
                    res.render('home', { repos: repositories, 'reviews': reviews});
                }
            }
        });


        github.repos.getStatsCommitActivity({
            user: username,
            repo: repository
        }, function(err, data) {
            var repoID = (username+"/"+repository).toLowerCase();
            // error with request
            if(err){
                res.render('home', { message: "Could not find repository"});
            }
            else{
                // if not stored add it to the array
                if(!contains(repositories, repoID)){
                    r = {repoID: repoID}
                    commitActivity = {commitActivity: data};
                    extend(r,commitActivity);
                    repositories.push(r);
                    console.log("NEW REPO "+ repository +" commitActivity")
                } else {
                    var i = index(repositories, repoID)
                    commitActivity = {commitActivity: data};
                    extend(repositories[i],commitActivity);
                    console.log("ADDED commitActivity info for REPO "+ repository)
                }
                if (dataComplete(repoID)){
                    res.render('home', { repos: repositories, 'reviews': reviews});
                }
            }
        });

        github.repos.getStatsParticipation({
            user: username,
            repo: repository
        }, function(err, data) {
            var repoID = (username+"/"+repository).toLowerCase();
            // error with request
            if(err){
                res.render('home', { message: "Could not find repository"});
            }
            else{
                // if not stored add it to the array
                if(!contains(repositories, repoID)){
                    r = {repoID: repoID};
                    participation = {participation: data};
                    extend(r,participation);
                    repositories.push(r);
                    console.log("NEW REPO "+ repository +" participation")
                } else {
                    var i = index(repositories, repoID)
                    participation = {participation: data};
                    extend(repositories[i],participation);
                    console.log("ADDED participation info for REPO " + repository)
                }
                if (dataComplete(repoID)){
                    res.render('home', { repos: repositories, 'reviews': reviews});
                }
            }
        });

        //should use this request to get the number of commits since there is no direct way to get that
        //sum commit count for each contributor
        github.repos.getContributors({
            user: username,
            repo: repository
        }, function(err, data) {
            var repoID = (username+"/"+repository).toLowerCase();
            // error with request
            if(err){
                res.render('home', { message: "Could not find repository"});
            }
            else{
                // if not stored add it to the array
                if(!contains(repositories, repoID)){
                    r = {repoID: repoID};
                    contributorList = {contributorList: data};
                    extend(r,contributorList);
                    repositories.push(r);
                    console.log("NEW REPO "+ repository +" contributorList")
                } else {
                    var i = index(repositories, repoID)
                    contributorList = {contributorList: data};
                    extend(repositories[i],contributorList);
                    console.log("ADDED contributorList info for REPO " + repository)
                }
                if (dataComplete(repoID)){
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
router.route('/:user/:repo').delete(function(req, res) {
    // get repo to be deleted
    var user = req.params.user;
    var repo = req.params.repo;
    var repoID = (user+"/"+repo).toLowerCase();
    console.log('HI TRYING TO DELETE SOMETHING', repoID)
    if(contains(repositories, repoID)){
        console.log("found it ;)")
        //remove repo once you've found it's index.
        repositories.splice(index(repositories, repoID),1);
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
    var address = (user + '/' + repo).toLowerCase();

    // array of reviews for a particular repo
    reviewsArray = reviews[address].reviews;

    res.render('review', { reviews: reviewsArray, 'user': user, 'repo': repo });
});

/* routing function to add a review to a repo */
router.post('/review/', function(req, res) {
    var user = req.body.user;    var date = req.body.date;

    var repo = req.body.repo;
    var repoAddress = (user + '/' + repo).toLowerCase();
    var review = req.body.review;
    var username = req.body.username;
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

    console.log(JSON.stringify(reviews));

    res.redirect('../../repos');
});



module.exports = router;