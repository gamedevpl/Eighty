define('Eighty', ['dojo', 'dojo/_base/Deferred'], function(dojo, Deferred) {
	var loaded = new Deferred();
	
	// create iframe
	var Package = dojo.config.packages.filter(function(Package) { return Package.name == 'Eighty' })[0];
	var iframe = dojo.create('iframe', { src: Package.location+'/game.html' }, dojo.query('.header')[0], 'last');
	
	dojo.connect(iframe, 'load', loaded.resolve.bind(loaded));
	
	// style
	dojo.style(iframe, {
		position: 'absolute',
		top: '0px',
		left: '0px',
		right: '0px',
		bottom: '0px',
		border: 'none',
		width: '100%',
		height: '75px'		
	});
	
	// relay events
	dojo.query(document).on("keydown", function(e) {
		iframe.contentWindow.postMessage('keydown:'+e.which+':'+e.keyCode, iframe.src);
	});
	dojo.query(document).on("keyup", function(e) {
		iframe.contentWindow.postMessage('keyup:'+e.which+':'+e.keyCode, iframe.src);
	});
	
	return {
		init: function(nick) {
			loaded.then(function() {
				iframe.contentWindow.postMessage('nick:'+nick, iframe.src);
			});
		}	
	}	
});