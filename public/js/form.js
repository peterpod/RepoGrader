$(function() {    // do once original document loaded and ready
    //call getJSON when myform is submitted
    $('#remove').on('submit',function(event) {
    	event.preventDefault();
    	var aj = $.ajax({
		url: "/remove/"+ $("#reponame").val(),
		type: "DELETE",
		data: {
			repo: $("#reponame").val()
		}
	});
		return false;	
	});
});