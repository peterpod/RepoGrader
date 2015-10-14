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
    timeout: 5000
    // headers: {
    //     "user-agent": "My-Cool-GitHub-App" // GitHub is happy with a unique user agent
    // }
});

github.authenticate({
    type: "basic",
    username: 'peterpod',
    password: 'darktree94'
});

var plotly = require('plotly')('peterpod','e876efj98k');
var fs = require('fs');

var repositories = []; // array to store all repo info
var reviews = {}; //object to store reviews for repo's

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
    console.log(repositories[i].commitWeeklyGraph + " " + repositories[i].commitDateGraph);
    if (repositories[i].getInfo!=null && repositories[i].commitActivity!=null && repositories[i].participation!=null && repositories[i].contributorList!=null && repositories[i].commitWeeklyGraph != null && repositories[i].commitDateGraph != null){
        return true;
    }
    else{
        return false;
    }
 }

 /* creates data array for plotly commit Week graph 
    #commits / day
 */
 function generateCommitData(repositories, i){
    var new_commit = [0,0,0,0,0,0,0];
    if(repositories[i].commitActivity == undefined){
        return;
    }
    for (var ind = 0; ind < repositories[i].commitActivity.length; ind++ ){
      for(j = 0; j < repositories[i].commitActivity[ind].days.length; j++){
        new_commit[j] += repositories[i].commitActivity[ind].days[j];
      }
    }

    var data = [{
      x: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      y: new_commit,
      type: "line"
    }];

    return data;
 }

/* creates data array for plotly commitDate graph 
   #commits / week(date)
*/
 function generateCommitDateData(repositories, i){
    x = []; // weeks in date format
    y = []; // commits for the entire week

    for (ind = 0; ind < repositories[i].commitActivity.length; ind++){
      for(key in repositories[i].commitActivity[ind]){
          if( key == "total"){
            y[ind] = repositories[i].commitActivity[ind].total
          }
      }
      var unix_timestamp = repositories[i].commitActivity[ind].week;
      var date = new Date(unix_timestamp*1000);
      date = (date.getMonth() +1 ) +'/'+ date.getDate();
      x[ind] = date;
    }


    var data =[{ 'x' : x, 'y': y, type:"bar"}];

    return data;
 }

 /* pass in the array of repos, index of repo, data for graph,
    graph options, type of graph(commitActivity, etc) */
 function generateGraph(repositories, i, data, type, callback){
    /* generate plotly graph */
    // ensure unique filenames by using type
    var graphOptions = {filename: type + '/' + repositories[i].repoID, fileopt: "overwrite"};
    plotly.plot(data, graphOptions, function (err, msg) {
        if(err) return callback(err);
        // return the url for the graph
        console.log(msg);
        return(callback(msg.url));
    });
 }

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
                    console.log("NEW REPO "+ repository +" getInfo");
                } else {
                    var i = index(repositories, repoID)
                    getInfo = {getInfo: data};
                    extend(repositories[i],getInfo);
                    console.log("ADDED getInfo info for REPO "+ repository)
                }
                if(dataComplete(repoID)){
                    res.render('home', { repos: repositories, 'reviews': reviews});
                }
                // dataComplete(repoID, function(complete){
                //     if (complete){
                //         res.render('home', { repos: repositories, 'reviews': reviews});
                //     }
                //     else{
                //         console.log('1incomplete');
                //         return;
                //     }
                // });
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
                    console.log("NEW REPO "+ repository +" commitActivity");

                    // # commits / day of the week
                    var weeklyData = generateCommitData(repositories, repositories.length-1);
                    generateGraph(repositories, repositories.length-1, weeklyData, 'commitWeeklyGraph', function(err, url) {
                        if(err) return console.log(err);
                        console.log(url);
                        // add plotly url to repositories array
                        repositories[repositories.length-1].commitWeeklyGraph = url;
                                        if(dataComplete(repoID)){
                    res.render('home', { repos: repositories, 'reviews': reviews});
                }
                    });

                    // # commits for entire week over time
                    var dateData = generateCommitDateData(repositories, repositories.length-1);
                    generateGraph(repositories, repositories.length-1, dateData, 'commitDateGraph', function(err, url) {
                        if(err) return console.log(err);
                        console.log(url);
                        // add plotly url to repositories array
                        repositories[repositories.length-1].commitDateGraph = url;
                if(dataComplete(repoID)){
                    res.render('home', { repos: repositories, 'reviews': reviews});
                }                    });
                } else {
                    var i = index(repositories, repoID);
                    commitActivity = {commitActivity: data};
                    extend(repositories[i],commitActivity);
                    console.log("ADDED commitActivity info for REPO "+ repository);

                    // # commits / day of the week
                    var weeklyData = generateCommitData(repositories, i)
                    generateGraph(repositories, i, weeklyData , 'commitWeeklyGraph', function(url) {
                        console.log(url);
                        // add plotly url to repositories array
                        repositories[i].commitWeeklyGraph = url;
                if(dataComplete(repoID)){
                    res.render('home', { repos: repositories, 'reviews': reviews});
                }
                    });

                    // # commits for entire week over time
                    var dateData = generateCommitDateData(repositories, i);
                    generateGraph(repositories, i, dateData, 'commitDateGraph', function(err, url) {
                        if(err) return console.log(err);
                        console.log(url);
                        repositories[i].commitDateGraph = url;
                if(dataComplete(repoID)){
                    res.render('home', { repos: repositories, 'reviews': reviews});
                }
                    });
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
                    var i = index(repositories, repoID);
                    participation = {participation: data};
                    extend(repositories[i],participation);
                    console.log("ADDED participation info for REPO " + repository)
                }
                if(dataComplete(repoID)){
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
                    console.log("NEW REPO "+ repository +" contributorList");
                } else {
                    var i = index(repositories, repoID);
                    contributorList = {contributorList: data};
                    extend(repositories[i],contributorList);
                    console.log("ADDED contributorList info for REPO " + repository)
                }
                if(dataComplete(repoID)){
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