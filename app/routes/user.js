var _ = require('underscore')
	, db = require('../core/database')
	, userHelper = require('../core/helpers/users.js');

var user = {
	/*
	* GET Login
	*/
	login : function(req,res) {
		if (req.session.user) {
			res.redirect('/');
		} else {
			res.render('login', { title: 'Ezseed V2 - Connexion' });
		}
	},

	/*
	* GET Logout
	*/ 

	logout : function(req, res) {
	  // destroy the user's session to log them out
	  // will be re-created next request
	  req.session.destroy(function(){
	    res.redirect('/login');
	  });
	},

	//It should be added some function to reset a specific element
	reset : function(req, res) {
		db.user.reset(req.params.uid, function() {
			res.redirect('/');
		});
	},

	/*
	* POST Login
	* TODO !
	*/

	authenticate : function(req, res) {
		userHelper.authenticate(req.body.username, req.body.password, function(err, user){
			if (user) {
				// Regenerate session when logged
				req.session.regenerate(function(){
					req.session.user = user;
					res.redirect('/');
				});
			} else {
				req.session.error = 'Mauvaises informations de connexion  <i class="entypo-cross pullRight"></i>';
				res.redirect('login');
			}
		});
	},

	/*
	 * GET home page.
	 */

	index : function(req, res){
		//Let the socket do the job, we can render safely
	  	res.render('desktop', { title: 'Ezseed V2 - Bureau de ' + req.session.user.username });
	},

	torrent : function(req, res) {
		var link = global.config.torrentLink;
		if(link == 'embed')
			res.render('torrents', {title : 'Torrents'});
		else
			res.redirect('/'+req.session.user.client);
	},

	password : function(req, res) {
		
	}

};

module.exports = function(app) {
	app.get('/', userHelper.restrict, user.index);
	app.get('/login', user.login);
	app.get('/logout', user.logout);
	app.post('/login', user.authenticate);
	app.get('/torrents', userHelper.restrict, user.torrent);

	app.get('/user/password', userHelper.restrict, user.password);
	app.get('/user/reset/(:uid)', user.reset); //to be moved ?
}