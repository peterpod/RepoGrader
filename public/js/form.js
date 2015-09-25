$(function() {    // do once original document loaded and ready
    //call getJSON when myform is submitted
    $('#search').on('submit',function(event) {
    	console.log("search text "+ $("#searchText").val().split("/")[0]);
        var displayText = "";
        event.preventDefault();
        $.ajax({
		url: "search",
		type: "GET",
		data: {
			user: $("#searchText").val().split("/")[0],
		    repo: $("#searchText").val().split("/")[1]
		}
	});
		return false;	
	});
}); // onReady
