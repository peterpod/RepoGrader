var repositories = [];

var weights = {
    mostRecentCommitWeight: 1,
    forksWeight: 1, 
    watcherWeight: 1, 
    starsWeight: 1,
    openIssuesWeight: 1,
    resolutionTimeWeight: 1,
    documentationWeight: 1
}

var divisor = 3.5; 

var formula = {
    mostRecentCommit: function(mostRecentCommitDate){
        var thirtyDaysAgo = new Date(); 
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        var ninetyDaysAgo = new Date(); 
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        if(mostRecentCommitDate > thirtyDaysAgo) {
            return 2; 
        } else if (mostRecentCommitDate > ninetyDaysAgo) {
            return 1;
        } else {
            return 0;
        }
    },
    forks: function(numForks){
        if(numForks > 150) {
            return 2; 
        } else if (numForks > 35) { 
            return 1;
        } else {
            return 0;   
        }
    },
    watchers: function(numWatchers){
        if(numWatchers > 125) {
            return 2; 
        } else if (numWatchers > 35) { 
            return 1;
        } else {
            return 0;
        }
    },
    stars: function(numStars){
        if(numStars > 1000) {
            return 2; 
        } else if (numStars > 250) { 
            return 1;
        } else {
            return 0;
        }
    },
    openIssues: function(openIssuePercentage){
        if(openIssuePercentage < 0.1) {
            return 2; 
        } else if (openIssuePercentage < 0.2) { 
            return 1;
        } else {
            return 0;
        }
    },
    issueResolution: function(issues){
        var totalIssues = issues.length;
        var sum = 0; 
        for (var i=0; i<totalIssues; i++){
            sum+= new Date(issues[i].closed_at) - new Date(issues[i].created_at)
        }
        var averageTime = sum/totalIssues;

        if(averageTime < 86400000) { //less than a day
            return 2; 
        } else if (averageTime < 604800000) {  //less than a week
            return 1;
        } else {
            return 0;
        }        
    },
    documentation: function(documentationLength, gettingStartedExists){
        if(documentationLength > 150) {
            return 2; 
        } else if (documentationLength > 35) { 
            return 1;
        } else {
            return 0;
        }
    }
}


//pass in the number of points out of 15
function convertNumberToLetterGrade(num){
    console.log(num)
    var num = num/divisor;
    //    (0-1:F, 1-2:D, 2-3:C, 3-4:B, 4-5:A)
    console.log(num)
    if (num <= 1){
        return "F";
    } else if (num >= 1 && num < 2){
        return "D";
    } else if (num >= 2 && num < 3){
        return "C";
    } else if (num >= 3 && num < 4){
        return "B";
    } else if (num >= 4 && num < 5){
        return "A";
    } else if (num >= 5){
        return "A+"
    }
}

function calculateGrade(repo){ //numForks, numWatchers, numStars, openIssuePercentage, resolutionTime, documentationLength
    totalPointsEarned =  3 + weights.forksWeight*formula.forks(repo.getInfo.forks_count) + 
                             weights.watcherWeight*formula.watchers(repo.getInfo.watchers_count) +
                             weights.mostRecentCommitWeight*formula.mostRecentCommit(new Date(repo.getInfo.updated_at)) +
                             weights.starsWeight*formula.stars(repo.getInfo.stargazers_count) +
                             weights.openIssuesWeight*formula.openIssues(repo.getInfo.open_issues_count/repo.closedIssueInfo.total_count) +
                             weights.resolutionTimeWeight*formula.issueResolution(repo.closedIssueInfo.items);

    repoGradeID = '#'+repo.getInfo.owner.login+'_'+repo.getInfo.name+'_grade';
    $(repoGradeID).html("Grade: "+ convertNumberToLetterGrade(totalPointsEarned)+" "+(1-(1-((totalPointsEarned/divisor)/5))/2).toFixed(2)*100+"%");
}


$(document).ready(function() {

	//use this for local testing
	var socket = io.connect('http://localhost:50000');

	socket.on('sendRepos', function(data){
		repositories = data.repositories;
		for(var i = 0; i<repositories.length; i++){
			calculateGrade(repositories[i]);
		}
	});

    //if the user clicks regrade, regrade with new weights  
    $('#regradeButton').click(function(){
        var sumOfWeights = 0
        for (w in weights){
            weights[w] = $('#'+w).val();
            sumOfWeights += parseInt(weights[w]);
        }

        divisor = sumOfWeights/2;

        for(var i = 0; i<repositories.length; i++){
            calculateGrade(repositories[i]);
        }
    });

//http://stackoverflow.com/questions/4149276/javascript-camelcase-to-regular-form
    for (w in weights){
        $('#grading-modal-body').append('  <label>'+w.replace(/([A-Z])/g, ' $1').replace(/^./, function(str){ return str.toUpperCase(); })+'</label>' + ': <input id="'+w+'" class="form-control" value="'+  weights[w] +'"></input><br/>');

    }

});
