//Requires all the modedl database
var mongoose = require('mongoose')
	, models = require('../models')
	, Paths = mongoose.model('Paths')
	, Users = mongoose.model('Users')
	, Movies = mongoose.model('Movies')
	, Albums = mongoose.model('Albums')
	, Others = mongoose.model('Others')
	, cache = require('memory-cache')
	, async = require('async');


module.exports = {
	paths : {
		byUser : function (uid, cb) {
			 Users.findById(uid).populate('paths').exec(function (err, docs) {

			 	var paths = [], p = docs.paths;

			 	for(var i in p)
			 		if(p[i].path !== undefined && p[i].path !== 'paths')
				 		paths.push(p[i].path);
			

			    cb(err, {paths : paths, docs : docs.paths});
			});
		},
		find : function(id, cb) {
			Paths.findById(id).populate('movies albums others').lean().exec(function (err, docs) {

				cb(err, docs);
			});
		}
	}, 
  files : {
  		byUser : function (uid, lastUpdate, cb) {

  			Users.findById(uid).lean().populate('paths').exec(function (err, docs) {
  				Paths.populate(docs, 
			  		[
			          { path: 'paths.movies', model: Movies, match: { dateAdded: {"$gt":lastUpdate} }, lean : true },
			          { path: 'paths.albums', model: Albums, match: { dateAdded: {"$gt":lastUpdate} }, lean : true },
			          { path: 'paths.others', model: Others, match: { dateAdded: {"$gt":lastUpdate} }, lean : true }
			        ],
			        function(err, docs) {
			          cb(err, docs);
			        
			        }
  				)
  			});
  		},
      byId : function(id, cb) {
        var result = [], errs = [];

        Movies.findById(id).lean().exec(function(err, docs) {
          if(docs !== null) result.push(docs);
          if(err !== null) errs.push(err);
          Albums.findById(id).lean().exec(function(err, docs) {
           if(docs !== null)result.push(docs);
           if(err !== null) errs.push(err);
            Others.findById(id).lean().exec(function(err, docs) {
              if(docs !== null)result.push(docs);
              if(err !== null) errs.push(err);
              cb(err, result[0]);
            });
          });
        });

        // Users.findById(uid).lean().populate('paths').exec(function (err, docs) {
        //   Paths.populate(docs, 
        //     [
        //         { path: 'paths.movies', model: Movies, match: { _id: id}, lean : true },
        //         { path: 'paths.albums', model: Albums, match: { _id: id}, lean : true },
        //         { path: 'paths.others', model: Others, match: { _id: id}, lean : true }
        //       ],
        //       function(err, docs) {
        //         cb(err, docs);
              
        //       }
        //   )
        // });
      },
  		albums : {
  			delete : function(id, cb) {
  				Albums.findByIdAndRemove(id, function(err) {
  					cb(err);
  				});
  			},
  			save : function (obj, saveCallback) {
  				async.each(obj.albums, 
  					function(album, cb) {

  						album = new Albums(album);

  						album.save(function(err, album) {
  							Paths.findByIdAndUpdate(
		    					obj.id_path, 
		    					{ $addToSet : {'albums': album._id }, 'dateUpdated': Date.now() }, 
		    					function(err) { 
		    						return cb(err);
		    					}
		    				);
  						});

  					},
  					function (err) {
  						saveCallback(err, obj.albums);
  					}
  				);
	      }		
  		},
  		movies : {
  			delete : function(id, cb) {
  				Movies.findByIdAndRemove(id, function(err) {
  					cb(err);
  				});
  			},
  			save : function (obj, saveCallback) {
  				async.each(obj.movies, 
  					function(movie, cb) {

  						movie = new Movies(movie);

  						movie.save(function(err, movie) {
  							Paths.findByIdAndUpdate(
		    					obj.id_path, 
		    					{ $addToSet : {'movies': movie._id }, 'dateUpdated': Date.now() }, 
		    					function(err) { 
		    						return cb(err);
		    					}
		    				);
  						});

  					},
  					function (err) {
  						saveCallback(err, obj.movies);
  					}
  				);
  			}
  		},
  		others : {
  			delete : function(id, cb) {
  				Others.findByIdAndRemove(id, function(err) {
  					cb(err);
  				});
  			},
  			save : function(obj, saveCallback) {
  				async.each(obj.others, 
  					function(other, cb) {

  						other = new Others(other);

  						other.save(function(err, other) {
  							Paths.findByIdAndUpdate(
		    					obj.id_path, 
		    					{ $addToSet : {'others': other._id }, 'dateUpdated': Date.now() }, 
		    					function(err) { 
		    						return cb(err);
		    					}
		    				);
  						});

  					},
  					function (err) {
  						saveCallback(err, obj.others);
  					}
  				);
  			}
  		}
 	},
  users : {
    getAll : function(cb) {
      Users.find().lean().populate('paths').exec(function(err, docs) {
        cb(err, docs);
      });
    }
  }
};
