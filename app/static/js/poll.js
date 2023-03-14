var	
	StartPolling;
$(function(){

StartPolling = function(url, func) {
	if (url.substr(-1) != '/') url += '/';
	function update(timestamp) {
		$.ajax({
			url: url + timestamp,
			success:  function(data) {
				if (data && data.hasOwnProperty('timestamp')) timestamp = data['timestamp'];
				func(data);
				update(timestamp);
			},
			error : function(){ 
				update(timestamp); 
			},
			timeout: 500000
		});
	}
	update(0);
	
}
});