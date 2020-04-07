//jshint esversion:9

//APP.JS SERVER FILE
//COPYRIGHT HYPERBOWL 2020

//REQUIRE NEEDED NPM PACKAGES
require('dotenv').config();
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const https = require('https');
// const forceSsl = require('express-force-ssl');
const bodyParser = require('body-parser');
const async = require('async');
const assert = require('assert');
const request = require('request');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const _ = require('lodash');

// var privateKey = fs.readFileSync(__dirname + '/sslcert/private.key', 'utf8');
// var certificate = fs.readFileSync(__dirname + '/sslcert/certificate.crt', 'utf8');
// var ca = fs.readFileSync(__dirname + '/sslcert/ca_bundle.crt', 'utf8');
//
// var options = {
//   key: privateKey,
//   cert: certificate,
//   ca: ca
// };

//CONFIGURE NPM PACKAGES TO RUN FILES AS INTENDED

const express = require('express');
var app = express();

app.use(express.static('public'));
// app.use(forceSsl);
app.set('view engine', 'ejs');

app.use(
	bodyParser.urlencoded({
		parameterLimit: 100000,
		limit: '50mb',
		extended: true,
	})
);

//USE COOKIES WITH ENCRYPTION KEY
const secret = process.env.SESSION_SECRET;
app.use(
	session({
		secret: secret,
		resave: false,
		saveUninitialized: false,
	})
);
app.use(passport.initialize());
app.use(passport.session());

//CONNECT TO MONGODB DATABASE

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
const key = process.env.DB_SECRET;
mongoose.connect('mongodb+srv://admin-avyn:' + key + '@hyperbowldb-wjtx4.mongodb.net/hyperbowlDB');

//DEFINE SCHEMAS FOR ALL HYPERBOWL DATA

const draftSchema = new mongoose.Schema({
	title: String,
	image: String,
	content: String,
});

const postSchema = new mongoose.Schema({
	title: String,
	content: String,
	sections: [String],
	image: String,
	author: mongoose.Schema.Types.ObjectId,
	authorUsername: String,
	datePublished: String,
	numberOfLikes: Number,
	numberOfDislikes: Number,
	numberOfViews: Number,
	comments: [
		{
			author: mongoose.Schema.Types.ObjectId,
			content: String,
			datePosted: String,
		},
	],
});

const userSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
	},
	username: {
		type: String,
		required: true,
	},
	password: String,
	profileImage: String,
	profileText: String,
	dateJoined: String,
	preferences: {
		styles: {
			profileBackgroundImage: String,
			dashboardBackgroundImage: String,
		},
		email: {
			subscribed: Boolean,
		},
	},
	drafts: [mongoose.Schema.Types.ObjectId],
	posts: [mongoose.Schema.Types.ObjectId],
	likedPosts: [mongoose.Schema.Types.ObjectId],
	dislikedPosts: [mongoose.Schema.Types.ObjectId],
	viewedPosts: [mongoose.Schema.Types.ObjectId],
	inbox: [
		{
			author: String,
			title: String,
			content: String,
			datePosted: String,
		},
	],
	isAdmin: Boolean,
});

const feedbackSchema = new mongoose.Schema({
	issue: String,
	details: String,
	author: String,
});

//USE HASHING FROM PASSPORT ON THE USER SCHEMA BY USING THE PASSPORTLOCALMONGOOSE NPM PACKAGE

userSchema.plugin(passportLocalMongoose);

//DEFINE MONGOOSE SCHEMAS TO BE USED TO ADD AND EDIT DATA LATER

const User = mongoose.model('User', userSchema);
const Draft = mongoose.model('Draft', draftSchema);
const Post = mongoose.model('Post', postSchema);
const Feedback = mongoose.model('Feedback', feedbackSchema);

//CONNECT PASSPORT TO THE USER OBJECT

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

/* Redirect http to https */
// app.get('*', function(req, res, next) {
//   if (req.headers['x-forwarded-proto'] != 'https' && process.env.NODE_ENV === 'production') {
//     res.redirect('https://' + req.hostname + req.url);
//   } else {
//     next(); /* Continue to other routes if we're not redirecting */
//   }
// });
/////////////////////////////////////////////////////////////////

app
	.route('/')

	.get(function (req, res) {
		let name;
		if (req.user && req.isAuthenticated()) {
			name = req.user;
		} else {
			name = 'Guest';
		}
		let numOfRecentPostsShown = 12;
		Post.find({}, function (err, posts) {
			if (err) {
				console.log(err);
			} else {
				posts.sort(function (a, b) {
					return Math.pow(Math.random(), 2) * a.numberOfLikes - Math.pow(Math.random(), 2) * b.numberOfLikes;
				});
				let splitPosts = posts;
				if (splitPosts.length > numOfRecentPostsShown) {
					splitPosts = splitPosts.slice(splitPosts.length - numOfRecentPostsShown, splitPosts.length);
				}
				res.render('home', {
					authorized: req.isAuthenticated(),
					currentUser: name,
					posts: splitPosts,
					title: 'Hyperbowl | Home',
				});
			}
		});
	})

	.post(function (req, res) {
		if (req.body.getCause == 'SCROLL') {
			let numberOfRetrievedPosts = 8;
			Post.find({}, function (err, posts) {
				if (err) {
					console.log(err);
				} else {
					posts.sort(function (a, b) {
						return Math.pow(Math.random(), 2) * a.numberOfLikes - Math.pow(Math.random(), 2) * b.numberOfLikes;
					});
					let slicedPosts = posts.slice(0, posts.length - parseInt(req.body.numberOfPosts));
					slicedPosts = slicedPosts.splice(slicedPosts.length - numberOfRetrievedPosts, numberOfRetrievedPosts);
					res.send(slicedPosts);
				}
			});
		} else {
			let allowedNumberOfSuggestions = 8;
			let validPosts = [];
			let searchContent = _.lowerCase(req.body.searchContent);
			Post.find({}, function (err, posts) {
				if (!err) {
					let i;
					for (i = 0; i < posts.length; i++) {
						let rawPostTitle = posts[i].title;
						let postTitle = _.lowerCase(rawPostTitle);
						if (postTitle.indexOf(searchContent) > -1) {
							validPosts.push(posts[i]);
						}
						if (i == posts.length - 1) {
							let trimmedValidPosts = validPosts;
							if (trimmedValidPosts.length > allowedNumberOfSuggestions) {
								trimmedValidPosts = trimmedValidPosts.slice(trimmedValidPosts.length - allowedNumberOfSuggestions, trimmedValidPosts.length);
							}
							res.send(trimmedValidPosts);
						}
					}
				} else {
					console.log(err);
				}
			});
		}
	});

/////////////////////////////////////////////////////////////////

app
	.route('/posts/:postId')

	.get(function (req, res) {
		if (req.isAuthenticated()) {
			//FIND THE REQUESTED POST AND THE CORRESPONDING AUTHOR
			let initialNumComments = 21;
			Post.findById(req.params.postId, function (err, foundPost) {
				if (!err && foundPost) {
					let comments = foundPost.comments;
					let post = foundPost;

					User.findById(req.user._id, function (err, foundUser) {
						if (foundPost.numberOfViews) {
							let userViewedPost = false;
							for (let i = 0; i < foundUser.viewedPosts.length; i++) {
								if (foundUser.viewedPosts[i] == req.params.postId) {
									userViewedPost = true;
								}
							}
							if (!userViewedPost) {
								foundPost.numberOfViews++;
								if (!foundUser.viewedPosts) {
									foundUser.viewedPosts = [foundPost.id];
								} else {
									foundUser.viewedPosts.push(foundPost.id);
								}
								foundUser.save();
							}
						} else {
							if (!foundUser.viewedPosts) {
								foundUser.viewedPosts = [foundPost.id];
							} else {
								foundUser.viewedPosts.push(foundPost.id);
							}
							foundUser.save();
							foundPost.numberOfViews = 1;
						}
						foundPost.save();
					});

					let name = req.user;
					User.findById(foundPost.author, function (err, postAuthor) {
						if (!err) {
							// console.log(comments);
							//FILTERS THROUGH ALL COMMENT OBJECTS, DERIVING THE NEEDED DETAILS OF THE USER THAT POSTED THE COMMENT AND THEN RENDERING THE POSTS PAGE
							if (comments.length) {
								function render() {
									if (comments.length > initialNumComments) {
										comments = comments.slice(comments.length - initialNumComments, comments.length);
									}
									User.findById(req.user._id, function (err, foundUser) {
										if (!err) {
											let userLikedPost = false;
											let userDislikedPost = false;
											for (let i = 0; i < foundUser.likedPosts.length; i++) {
												if (foundUser.likedPosts[i].toString() == req.params.postId) {
													userLikedPost = true;
													for (let i = 0; i < foundUser.dislikedPosts.length; i++) {
														if (foundUser.dislikedPosts[i].toString() == req.params.postId) {
															userDislikedPost = true;
														}
													}
													res.render('post', {
														authorized: req.isAuthenticated(),
														currentUser: name,
														author: postAuthor,
														post: post,
														derivedComments: comments,
														likedByUser: userLikedPost,
														dislikedByUser: userDislikedPost,
														title: post.title + ' | Hyperbowl',
													});
												}
											}
											if (!userLikedPost) {
												for (let i = 0; i < foundUser.dislikedPosts.length; i++) {
													if (foundUser.dislikedPosts[i].toString() == req.params.postId) {
														userDislikedPost = true;
													}
												}
												res.render('post', {
													authorized: req.isAuthenticated(),
													currentUser: name,
													author: postAuthor,
													post: post,
													derivedComments: comments,
													likedByUser: false,
													dislikedByUser: userDislikedPost,
													title: post.title + ' | Hyperbowl',
												});
											}
										} else {
											console.log(err);
										}
									});
								}

								const waitFor = (ms) => new Promise((r) => setTimeout(r, ms));

								async function asyncForEach(array, callback) {
									for (let index = 0; index < array.length; index++) {
										await callback(array[index], index, array);
									}
								}

								let editedComments = [];
								const start = async () => {
									await asyncForEach(comments, async (comment, index) => {
										User.findById(comment.author, function (err, foundAuthor) {
											editedComments[index] = {
												_id: comment._id,
												content: comment.content,
												author: comment.author,
												datePosted: comment.datePosted,
												authorUsername: foundAuthor.username,
												authorProfileImage: foundAuthor.profileImage,
											};
										});
										await waitFor(100);
									});
									comments = editedComments;
									render();
								};
								start();
							} else {
								User.findById(req.user._id, function (err, foundUser) {
									if (!err) {
										let userLikedPost = false;
										let userDislikedPost = false;
										for (let i = 0; i < foundUser.likedPosts.length; i++) {
											if (foundUser.likedPosts[i] == req.params.postId) {
												userLikedPost = true;
												for (let i = 0; i < foundUser.dislikedPosts.length; i++) {
													if (foundUser.dislikedPosts[i] == req.params.postId) {
														userDislikedPost = true;
													}
												}
												res.render('post', {
													authorized: req.isAuthenticated(),
													currentUser: name,
													author: postAuthor,
													post: post,
													likedByUser: userLikedPost,
													dislikedByUser: userDislikedPost,
													title: post.title + ' | Hyperbowl',
												});
											}
										}
										if (!userLikedPost) {
											for (let i = 0; i < foundUser.dislikedPosts.length; i++) {
												if (foundUser.dislikedPosts[i] == req.params.postId) {
													userDislikedPost = true;
												}
											}
											res.render('post', {
												authorized: req.isAuthenticated(),
												currentUser: name,
												author: postAuthor,
												post: post,
												likedByUser: false,
												dislikedByUser: userDislikedPost,
												title: post.title + ' | Hyperbowl',
											});
										}
									} else {
										console.log(err);
									}
								});
							}
						} else {
							console.log(err);
						}
					});
				} else {
					res.redirect('/');
					console.log(err);
				}
			});
		} else {
			res.redirect('/register');
		}
	})

	.post(function (req, res) {
		if (req.body.commentRetrieval == 'TRUE') {
			let numberOfRetrievedComments = 8;
			Post.findById(req.params.postId, function (err, foundPost) {
				let post = foundPost;
				let comments = post.comments.slice(0, post.comments.length - parseInt(req.body.numberOfCurrentComments));
				comments = comments.splice(comments.length - numberOfRetrievedComments, numberOfRetrievedComments);

				function render() {
					if (req.isAuthenticated()) {
						res.send({
							comments: comments,
							allComments: parseInt(req.body.numberOfCurrentComments) + numberOfRetrievedComments >= foundPost.comments.length,
							userIsAuthenticated: true,
							userId: req.user._id,
						});
					} else {
						res.send({
							comments: comments,
							allComments: parseInt(req.body.numberOfCurrentComments) + numberOfRetrievedComments >= foundPost.comments.length,
							userIsAuthenticated: false,
						});
					}
				}

				const waitFor = (ms) => new Promise((r) => setTimeout(r, ms));

				async function asyncForEach(array, callback) {
					for (let index = 0; index < array.length; index++) {
						await callback(array[index], index, array);
					}
				}

				let editedComments = [];
				const start = async () => {
					await asyncForEach(comments, async (comment, index) => {
						User.findById(comment.author, function (err, foundAuthor) {
							editedComments[index] = {
								_id: comment._id,
								content: comment.content,
								author: comment.author,
								datePosted: comment.datePosted,
								authorUsername: foundAuthor.username,
								authorProfileImage: foundAuthor.profileImage,
							};
						});
						await waitFor(100);
						console.log(index + ': ' + comment.content);
					});
					comments = editedComments;
					render();
				};
				start();
			});
		} else {
			async function likePost() {
				const waitFor = (ms) => new Promise((r) => setTimeout(r, ms));
				Post.findById(req.params.postId, function (err, foundPost) {
					if (!err) {
						User.findById(req.user._id, function (err, foundUser) {
							let userLikedPost = postIsLikedDisliked(foundUser.likedPosts);
							if (!userLikedPost) {
								if (postIsLikedDisliked(foundUser.dislikedPosts)) {
									foundPost.numberOfDislikes--;
									foundUser.dislikedPosts.splice(foundUser.dislikedPosts.indexOf(req.params.postId), 1);
								}
								if (foundPost.numberOfLikes) {
									foundPost.numberOfLikes++;
								} else {
									foundPost.numberOfLikes = 1;
								}
								if (!foundUser.likedPosts) {
									foundUser.likedPosts = [foundPost.id];
								} else {
									foundUser.likedPosts.push(foundPost.id);
								}
								foundUser.save();
							} else {
								foundPost.numberOfLikes--;
								foundUser.likedPosts.splice(foundUser.likedPosts.indexOf(req.params.postId), 1);
								foundUser.save();
							}
							async function savePost() {
								foundPost.save();
								await waitFor(100);
								if (req.body.likeType === 'LIKE') {
									res.send({
										numberOfLikes: foundPost.numberOfLikes,
										numberOfDislikes: foundPost.numberOfDislikes,
										userLikedPost: postIsLikedDisliked(foundUser.likedPosts),
										userDislikedPost: postIsLikedDisliked(foundUser.dislikedPosts),
									});
								}
							}
							savePost();
						});
					} else {
						console.log(err);
					}
				});
			}

			async function dislikePost() {
				const waitFor = (ms) => new Promise((r) => setTimeout(r, ms));
				Post.findById(req.params.postId, function (err, foundPost) {
					if (!err) {
						User.findById(req.user._id, function (err, foundUser) {
							let userDislikedPost = postIsLikedDisliked(foundUser.dislikedPosts);
							if (!userDislikedPost) {
								if (postIsLikedDisliked(foundUser.likedPosts)) {
									foundPost.numberOfLikes--;
									foundUser.likedPosts.splice(foundUser.likedPosts.indexOf(req.params.postId), 1);
								}
								if (foundPost.numberOfDislikes) {
									foundPost.numberOfDislikes++;
								} else {
									foundPost.numberOfDislikes = 1;
								}
								if (!foundUser.dislikedPosts) {
									foundUser.dislikedPosts = [foundPost.id];
								} else {
									foundUser.dislikedPosts.push(foundPost.id);
								}
								foundUser.save();
							} else {
								foundPost.numberOfDislikes--;
								foundUser.dislikedPosts.splice(foundUser.dislikedPosts.indexOf(req.params.postId), 1);
								foundUser.save();
							}
							async function savePost() {
								foundPost.save();
								await waitFor(100);
								if (req.body.likeType === 'DISLIKE') {
									res.send({
										numberOfLikes: foundPost.numberOfLikes,
										numberOfDislikes: foundPost.numberOfDislikes,
										userLikedPost: postIsLikedDisliked(foundUser.likedPosts),
										userDislikedPost: postIsLikedDisliked(foundUser.dislikedPosts),
									});
								}
							}
							savePost();
						});
					} else {
						console.log(err);
					}
				});
			}

			function postIsLikedDisliked(arr) {
				let likedDisliked = false;
				for (let i = 0; i < arr.length; i++) {
					if (arr[i] == req.params.postId) {
						likedDisliked = true;
						return true;
					}
				}
				if (!likedDisliked) {
					return false;
				}
			}
			if (req.isAuthenticated()) {
				if (req.body.commentDeletion == 'TRUE') {
					Post.findById(req.params.postId, function (err, foundPost) {
						if (!err) {
							for (let i = 0; i < foundPost.comments.length; i++) {
								// console.log(foundPost.comments[i].author.toString() == req.user._id.toString());
								// console.log(foundPost.comments[i]._id.toString() == req.body.commentId);
								if (foundPost.comments[i].author.toString() == req.user._id.toString() && foundPost.comments[i]._id.toString() == req.body.commentId) {
									console.log("Everything worked. You're good to go.");
									res.send({
										deletedCommentId: foundPost.comments[i]._id,
									});
									foundPost.comments.splice(i, 1);
									foundPost.save();
								}
							}
						} else {
							console.log(err);
						}
					});
				} else if (req.body.likeType === 'LIKE') {
					likePost();
				} else if (req.body.likeType === 'DISLIKE') {
					dislikePost();
				} else {
					Post.findById(req.params.postId, function (err, post) {
						if (!err && post) {
							//ADD COMMENT TO THE POST OBJECT
							if (!post.comments.length || post.comments[post.comments.length - 1].author.toString() != req.user._id) {
								const currentDate = new Date();
								if (req.user) {
									post.comments.push({
										author: req.user._id,
										content: req.body.commentContent,
										datePosted: currentDate.getMonth() + 1 + '/' + currentDate.getDate() + '/' + currentDate.getFullYear(),
									});
									post.save(function (err) {
										console.log(err);
									});
								}
								res.redirect('/posts/' + req.params.postId);
							} else {
								res.redirect('/posts/' + req.params.postId);
							}
						} else {
							console.log(err);
						}
					});
				}
			}
		}
	})

	.delete(function (req, res) {
		if (req.isAuthenticated()) {
			Post.findById(req.params.postId, function (err, foundPost) {
				if (!err) {
					if (req.user._id.toString() == foundPost.author.toString() || req.user.isAdmin == true) {
						foundPost.remove();
						foundPost.save();
						User.findById(foundPost.author, function (err, foundUser) {
							if (!err) {
								let userPosts = foundUser.posts;
								for (let i = 0; i < userPosts.length; i++) {
									if (userPosts[i] == req.params.postId) {
										foundUser.posts.splice(i, 1);
										foundUser.save();
									}
								}
								res.send(foundPost);
							} else {
								console.log(err);
							}
						});
					} else {
						res.redirect('/posts/' + req.params.postId);
					}
				} else {
					console.log(err);
				}
			});
		} else {
			res.redirect('/login');
		}
	});

/////////////////////////////////////////////////////////////////

app.route('/posts/:postId/edit').get(function (req, res) {
	if (req.isAuthenticated()) {
		Post.findById(req.params.postId, function (err, foundPost) {
			if (!err && foundPost) {
				let drafts = [];
				let userDrafts = req.user.drafts;
				if (userDrafts.length) {
					userDrafts.forEach(function (draft) {
						Draft.findById(draft, function (err, foundDraft) {
							if (!err) {
								let draftObject = foundDraft;
								drafts.push(draftObject);
							} else {
								console.log(err);
							}
							if (drafts.length == userDrafts.length) {
								res.render('editpost', {
									authorized: true,
									currentUser: req.user,
									post: foundPost,
									drafts: drafts,
									title: foundPost.title + ' | Hyperbowl',
								});
							}
						});
					});
				} else {
					res.render('editpost', {
						authorized: true,
						currentUser: req.user,
						post: foundPost,
						drafts: [],
						title: foundPost.title + ' | Hyperbowl',
					});
				}
			} else {
				res.redirect('/');
				console.log(err);
			}
		});
	} else {
		res.redirect('/register');
	}
});

/////////////////////////////////////////////////////////////////

app.route('/posts/:postId/adddraft/:draftId').post(function (req, res) {
	if (req.isAuthenticated()) {
		Post.findById(req.params.postId, function (err, foundPost) {
			if (req.user._id.toString() == foundPost.author) {
				Draft.findById(req.params.draftId, function (err, foundDraft) {
					foundPost.sections.push(foundDraft.content);
					foundPost.save();
					res.redirect('/posts/' + req.params.postId + '/edit');
				});
			} else {
				res.redirect('/login');
			}
		});
	} else {
		res.redirect('/register');
	}
});

/////////////////////////////////////////////////////////////////

app
	.route('/drafts/:draftId')

	.get(function (req, res) {
		//FIND THE REQUESTED POST AND THE CORRESPONDING AUTHOR
		if (req.isAuthenticated()) {
			Draft.findById(req.params.draftId, function (err, draft) {
				if (!err) {
					let name;
					if (req.user) {
						name = req.user;
					} else {
						name = 'Guest';
					}
					res.render('editdraft', {
						authorized: true,
						currentUser: name,
						draft: draft,
						title: draft.title + ' | Hyperbowl',
					});
				} else {
					console.log(err);
				}
			});
		} else {
			res.redirect('/login');
		}
	})

	.delete(function (req, res) {
		if (req.isAuthenticated()) {
			Draft.findById(req.params.draftId, function (err, foundDraft) {
				if (!err) {
					foundDraft.remove();
					foundDraft.save();
					User.findById(req.user._id, function (err, foundUser) {
						if (!err) {
							let userDrafts = foundUser.drafts;
							for (let i = 0; i < userDrafts.length; i++) {
								if (userDrafts[i] == req.params.draftId) {
									foundUser.drafts.splice(i, 1);
									foundUser.save();
								}
							}
							res.send(foundDraft);
						} else {
							console.log(err);
						}
					});
				} else {
					console.log(err);
				}
			});
		} else {
			res.redirect('/login');
		}
	});

/////////////////////////////////////////////////////////////////

app
	.route('/users/:userId')

	.get(function (req, res) {
		if (req.isAuthenticated()) {
			User.findById(req.params.userId, function (err, foundUser) {
				if (!err) {
					let name = req.user;
					let posts = [];
					let userPosts = foundUser.posts;
					if (userPosts.length) {
						userPosts.forEach(function (post) {
							Post.findById(post, function (err, foundPost) {
								if (!err) {
									let postObject = foundPost;
									posts.push(postObject);
								} else {
									console.log(err);
								}
								if (posts.length == userPosts.length) {
									res.render('profile', {
										authorized: req.isAuthenticated(),
										currentUser: name,
										user: foundUser,
										posts: posts,
										author: foundUser.username,
										title: foundUser.username + ' | Hyperbowl',
									});
								}
							});
						});
					} else {
						res.render('profile', {
							authorized: req.isAuthenticated(),
							currentUser: name,
							user: foundUser,
							posts: [],
							title: foundUser.username + ' | Hyperbowl',
						});
					}
				} else {
					console.log(err);
				}
			});
		} else {
			res.redirect('/register');
		}
	})

	.post(function (req, res) {
		if (req.isAuthenticated() && req.user._id == req.params.userId) {
			User.findById(req.params.userId, function (err, foundUser) {
				foundUser.profileText = req.body.profileText;
				foundUser.save();
				res.redirect('/users/' + req.params.userId);
			});
		} else {
			res.redirect('/users/' + req.params.userId);
		}
	});

/////////////////////////////////////////////////////////////////

app.route('/userposts').get(function (req, res) {
	if (req.isAuthenticated()) {
		name = req.user;
		let posts = [];
		User.findById(req.user._id, function (err, foundUser) {
			if (!err) {
				let userPosts = foundUser.posts;
				if (userPosts.length) {
					userPosts.forEach(function (post) {
						Post.findById(post, function (err, foundPost) {
							if (!err) {
								let postObject = foundPost;
								posts.push(postObject);
							} else {
								console.log(err);
							}
							if (posts.length == userPosts.length) {
								res.render('userposts', {
									authorized: req.isAuthenticated(),
									currentUser: name,
									posts: posts,
									author: foundUser.username,
									title: foundUser.username + "'s Posts | Hyperbowl",
								});
							}
						});
					});
				} else {
					res.render('userposts', {
						authorized: req.isAuthenticated(),
						currentUser: name,
						posts: [],
						author: foundUser.username,
						title: foundUser.username + "'s Posts | Hyperbowl",
					});
				}
			} else {
				console.log(err);
			}
		});
	} else {
		res.redirect('/register');
	}
});

/////////////////////////////////////////////////////////////////

app
	.route('/userdrafts')

	.get(function (req, res) {
		if (req.isAuthenticated()) {
			var drafts = [];
			var userDrafts = req.user.drafts;
			if (userDrafts.length) {
				userDrafts.forEach(function (draft) {
					Draft.findById(draft, function (err, foundDraft) {
						if (!err) {
							let draftObject = foundDraft;
							drafts.push(draftObject);
						} else {
							console.log(err);
						}
						if (drafts.length == userDrafts.length) {
							res.render('userdrafts', {
								authorized: true,
								currentUser: req.user,
								drafts: drafts,
								title: 'My Drafts | Hyperbowl',
							});
						}
					});
				});
			} else {
				res.render('userdrafts', {
					authorized: true,
					currentUser: req.user,
					drafts: [],
					title: 'My Drafts | Hyperbowl',
				});
			}
		} else {
			res.redirect('/register');
		}
	})

	.post(function (req, res) {
		if (req.isAuthenticated()) {
			// FINDS USER ASSOSIATED WITH DRAFT. THEN, USES LOGIC TO DETERMINE IF DRAFT IS ORIGINAL. IF IT IS,
			// ASSIGN NEW DRAFT OBJECT TO DRAFTS COLLECTION AND ADD THE ID TO THE ARRAY THAT THE USER HAS. IF NOT,
			// REPLACE THE VALUES OF THE CURRENT DRAFT WITH THE ONES JUST WRITTEN
			User.findById(req.user._id, function (err, foundUser) {
				if (!err) {
					if (req.body.originalPost == 'true') {
						let newDraft;
						if (req.body.sectionNumber) {
							newDraft = new Draft({
								title: req.body.postTitle + ' | Section ' + req.body.sectionNumber,
								image: req.body.postImage,
								content: req.body.postContent,
							});
						} else {
							newDraft = new Draft({
								title: req.body.postTitle,
								image: req.body.postImage,
								content: req.body.postContent,
							});
						}
						newDraft.save();
						foundUser.drafts.push(newDraft.id);
						foundUser.save();
						res.send({ status: 200 });
					} else {
						Draft.findById(req.body.draftId, function (err, draft) {
							if (!err) {
								draft.title = req.body.postTitle;
								draft.image = req.body.postImage;
								draft.content = req.body.postContent;
								draft.save();
								foundUser.save();
							} else {
								console.log(err);
							}
						});
						res.status(200).send();
					}
				} else {
					console.log(err);
				}
			});
		}
	});

/////////////////////////////////////////////////////////////////

app
	.route('/create')

	.get(function (req, res) {
		if (req.isAuthenticated()) {
			res.render('create', {
				authorized: true,
				currentUser: req.user,
				title: 'Create New | Hyperbowl',
			});
		} else {
			res.redirect('/register');
		}
	})

	.post(function (req, res) {
		let currentDate = new Date();
		User.findById(req.user._id, function (err, foundUser) {
			if (!err) {
				const newPost = new Post({
					title: req.body.postTitle,
					image: req.body.postImage,
					author: req.user._id,
					authorUsername: req.user.username,
					datePublished: currentDate.getMonth() + 1 + '/' + currentDate.getDate() + '/' + currentDate.getFullYear(),
					numberOfLikes: 0,
					numberOfViews: 0,
				});
				newPost.sections[0] = req.body.postContent;
				newPost.save();
				foundUser.posts.push(newPost.id);
				foundUser.save();
				res.redirect('/');
			} else {
				console.log(err);
			}
		});
	});

/////////////////////////////////////////////////////////////////

app.route('/updatepost/:postId').post(function (req, res) {
	if (req.isAuthenticated()) {
		Post.findById(req.params.postId, function (err, foundPost) {
			if (req.user._id.toString() == foundPost.author) {
				foundPost.title = req.body.postTitle;
				foundPost.image = req.body.postImage;
				if (req.body.postContent) {
					foundPost.sections.push(req.body.postContent);
				}
				foundPost.save();
				res.redirect('/posts/' + req.params.postId + '/edit');
			} else {
				res.redirect('/login');
			}
		});
	} else {
		res.redirect('/register');
	}
});

/////////////////////////////////////////////////////////////////

app
	.route('/messages')

	.get(function (req, res) {
		if (req.isAuthenticated()) {
			let messages = req.user.inbox;
			if (messages.length) {
				function render() {
					let messageRecipient = '';
					if (req.query.messageRecipient) {
						messageRecipient = req.query.messageRecipient;
					}
					let messageTitle = '';
					if (req.query.messageTitle) {
						messageTitle = req.query.messageTitle;
					}
					let messageBody = '';
					if (req.query.messageBody) {
						messageBody = req.query.messageBody;
					}
					res.render('messages', {
						authorized: true,
						currentUser: req.user,
						messageRecipient: messageRecipient,
						messageTitle: messageTitle,
						messageBody: messageBody,
						title: 'Messages | Hyperbowl',
						messages: derivedMessages,
					});
				}

				const waitFor = (ms) => new Promise((r) => setTimeout(r, ms));

				async function asyncForEach(array, callback) {
					for (let index = 0; index < array.length; index++) {
						await callback(array[index], index, array);
					}
				}

				const start = async () => {
					let derivedMessage;
					await asyncForEach(messages, async (message, index) => {
						User.findById(message.author, function (err, foundUser) {
							derivedMessage = message;
							derivedMessage.authorUsername = foundUser.username;
							derivedMessage.authorProfileImage = foundUser.profileImage;
							derivedMessages.push(derivedMessage);
						});
						await waitFor(100);
					});
					render();
				};
				let derivedMessages = [];
				start();
			} else {
				let messageRecipient = '';
				if (req.query.messageRecipient) {
					messageRecipient = req.query.messageRecipient;
				}
				let messageTitle = '';
				if (req.query.messageTitle) {
					messageTitle = req.query.messageTitle;
				}
				let messageBody = '';
				if (req.query.messageBody) {
					messageBody = req.query.messageBody;
				}
				res.render('messages', {
					authorized: true,
					currentUser: req.user,
					messageRecipient: messageRecipient,
					messageTitle: messageTitle,
					messageBody: messageBody,
					title: 'Messages | Hyperbowl',
					messages: req.user.inbox,
				});
			}
		} else {
			res.redirect('/register');
		}
	})

	.post(function (req, res) {
		if (req.body.messageDeletion == 'TRUE') {
			if (req.isAuthenticated()) {
				User.findById(req.user._id, function (err, foundUser) {
					if (!err) {
						for (let i = 0; i < foundUser.inbox.length; i++) {
							console.log(foundUser.inbox[i]._id.toString());
							console.log(req.body.messageId);
							if (foundUser.inbox[i]._id.toString() == req.body.messageId && foundUser.username == req.user.username) {
								res.send(foundUser.inbox[i]._id);
								foundUser.inbox.splice(i, 1);
								foundUser.save();
							}
						}
					} else {
						console.log(err);
					}
				});
			} else {
				res.redirect('/login');
			}
		} else if (req.body.messageDeletion == 'FALSE') {
			if (req.isAuthenticated()) {
				User.findOne(
					{
						username: req.body.messageRecipient,
					},
					function (err, foundUser) {
						if (!err && foundUser) {
							//ADD COMMENT TO THE POST OBJECT
							const currentDate = new Date();
							foundUser.inbox.push({
								author: req.user._id,
								title: req.body.messageTitle,
								content: req.body.messageContent,
								datePosted: currentDate.getMonth() + 1 + '/' + currentDate.getDate() + '/' + currentDate.getFullYear(),
							});
							foundUser.save(function (err) {
								console.log(err);
							});
							res.send({
								currentUserUsername: req.user.username,
							});
						} else {
							res.send({
								error: 'The username you entered was invalid.',
							});
							console.log(err);
						}
					}
				);
			} else {
				res.redirect('/login');
			}
		}
	});

/////////////////////////////////////////////////////////////////
const mailchimpKey = process.env.MAILCHIMP_KEY;
app
	.route('/newsletter')

	.get(function (req, res) {
		if (req.isAuthenticated()) {
			res.render('newsletter', {
				title: 'Hyperbowl | Newsletter',
				currentUser: req.user,
				authorized: req.isAuthenticated(),
			});
		} else {
			res.redirect('/register');
		}
	})

	.post(function (req, res) {
		if (req.isAuthenticated()) {
			User.findById(req.user._id, function (err, foundUser) {
				const firstName = req.body.fName;
				const lastName = req.body.lName;
				const email = foundUser.email;

				let data;
				if (foundUser.preferences.email.subscribed === false) {
					data = {
						members: [
							{
								email_address: email,
								status: 'subscribed',
								merge_fields: {
									FNAME: firstName,
									LNAME: lastName,
								},
							},
						],
						update_existing: true,
					};
				} else {
					data = {
						members: [
							{
								email_address: email,
								status: 'subscribed',
								merge_fields: {
									FNAME: firstName,
									LNAME: lastName,
								},
							},
						],
					};
				}

				var jsonData = JSON.stringify(data);

				const url = 'https://us4.api.mailchimp.com/3.0/lists/ddac505e7d';
				const options = {
					method: 'POST',
					auth: mailchimpKey,
				};
				const request = https.request(url, options, function (response) {
					response.on('data', function (data) {
						let parsedJSON = JSON.parse(data);
						if (!parsedJSON.errors[0]) {
							foundUser.preferences.email.subscribed = true;
							foundUser.save();
						}
						res.redirect('/newsletter');
					});
				});

				request.write(jsonData);
				request.end();
			});
		} else {
			res.redirect('/login');
		}
	});

/////////////////////////////////////////////////////////////////

app.post('/unsubscribe', function (req, res) {
	if (req.isAuthenticated()) {
		User.findById(req.user._id, function (err, foundUser) {
			const email = foundUser.email;

			const data = {
				members: [
					{
						email_address: email,
						status: 'unsubscribed',
					},
				],
				update_existing: true,
			};

			var jsonData = JSON.stringify(data);

			const url = 'https://us4.api.mailchimp.com/3.0/lists/ddac505e7d';
			const options = {
				method: 'POST',
				auth: mailchimpKey,
			};
			const request = https.request(url, options, function (response) {
				response.on('data', function (data) {
					let parsedJSON = JSON.parse(data);
					if (!parsedJSON.errors[0]) {
						foundUser.preferences.email.subscribed = false;
						foundUser.save();
					}
					res.redirect('/newsletter');
				});
			});

			request.write(jsonData);
			request.end();
		});
	} else {
		res.redirect('/login');
	}
});

/////////////////////////////////////////////////////////////////

app
	.route('/feedback')

	.get(function (req, res) {
		if (req.isAuthenticated()) {
			let username = req.user;
			res.render('feedback', {
				authorized: req.isAuthenticated(),
				currentUser: username,
				title: 'Give Feedback | Hyperbowl',
			});
		} else {
			res.redirect('/register');
		}
	})

	.post(function (req, res) {
		if (req.isAuthenticated()) {
			const newFeedback = new Feedback({
				issue: req.body.issue,
				details: req.body.details,
				author: req.user.username,
			});
			newFeedback.save(function (err) {
				if (err) {
					console.log(err);
				} else {
					res.redirect('/');
				}
			});
		} else {
			//REDIRECTING TO LOGIN IS INTENTIONAL. IF THE USER IS ON THE PAGE BUT ISN'T LOGGED IN, IT'S BECAUSE THEIR SESSION LIKELY TIMED OUT. THEY ALREADY WILL HAVE AN ACCOUNT.
			res.redirect('/login');
		}
	});

/////////////////////////////////////////////////////////////////

app
	.route('/login')

	.get(function (req, res) {
		if (req.isAuthenticated()) {
			res.redirect('/');
		} else {
			let username = '';
			if (req.query.username) {
				username = req.query.username;
			}
			let error = '';
			if (req.query.error) {
				error = req.query.error;
			}
			res.render('login', {
				authorized: req.isAuthenticated(),
				title: 'Login to Hyperbowl',
				username: username,
				error: error,
			});
		}
	})

	.post(function (req, res) {
		const user = new User({
			username: req.body.username,
			password: req.body.password,
		});

		passport.authenticate('local', {
			successRedirect: '/',
			failureRedirect: '/login?username=' + req.body.username + '&error=Invalid+username+or+password.',
		})(req, res, function () {
			res.redirect('/');
		});
	});

/////////////////////////////////////////////////////////////////

app
	.route('/register')

	.get(function (req, res) {
		if (req.isAuthenticated()) {
			res.redirect('/');
		} else {
			let username = '';
			if (req.query.username) {
				username = req.query.username;
			}
			let email = '';
			if (req.query.email) {
				email = req.query.email;
			}
			let error = '';
			if (req.query.error) {
				error = req.query.error;
			}
			res.render('register', {
				authorized: req.isAuthenticated(),
				title: 'Register to Hyperbowl',
				username: username,
				email: email,
				error: error,
			});
		}
	})

	.post(function (req, res) {
		let currentDate = new Date();
		const username = req.body.username;
		//CHECK FOR SPACES IN USERNAMES AND GIVE ERROR IF ONE EXISTS
		if (username.indexOf('  ') > -1) {
			res.redirect('/register?username=' + req.body.username + '&email=' + req.body.email + '&error=Usernames+cannot+contain+more+than+one+consecutive+space.');
		} else {
			if (username.trim() != username) {
				res.redirect('/register?username=' + req.body.username + '&email=' + req.body.email + '&error=Usernames+cannot+have+spaces+at+the+beginning+or+end.');
			} else {
				User.register(
					{
						username: username,
						email: req.body.email,
						profileImage: req.body.profileImage,
						dateJoined: currentDate.getMonth() + 1 + '/' + currentDate.getDate() + '/' + currentDate.getFullYear(),
						isAdmin: false,
					},
					req.body.password,
					function (err, user) {
						if (err) {
							console.log(err);
							res.redirect('/register');
						} else {
							passport.authenticate('local', {
								successRedirect: '/',
								failureRedirect: '/register?username=' + req.body.username + '&email=' + req.body.email + '&error=Invalid+form+fields.',
							})(req, res, function () {
								res.redirect('/');
							});
						}
					}
				);
			}
		}
	});

/////////////////////////////////////////////////////////////////

app
	.route('/popular')

	.get(function (req, res) {
		if (req.isAuthenticated()) {
			let numOfRecentPostsShown = 12;
			let renderedPosts = [];
			let name = req.user;
			Post.find({}, function (err, posts) {
				if (err) {
					console.log(err);
				} else {
					mappedPosts = posts.map(function (el, i) {
						let mappedPost = el;
						mappedPost.index = i;
						mappedPost.value = posts[i].numberOfLikes * (posts[i].numberOfLikes / posts[i].numberOfViews) + 1;
						return mappedPost;
					});
					mappedPosts.sort(function (a, b) {
						// return (a.value + (0.1 * (a.index + 1))) - (b.value + (0.1 * (b.index + 1)));
						if (!a.value) {
							a.value = 0;
							console.log('Number was invalid');
						}
						if (!b.value) {
							b.value = 0;
							console.log('Number was invalid');
						}
						return a.value * (1 + 0.05 * a.index) - b.value * (1 + 0.05 * b.index);
					});
					let splitPosts = mappedPosts;
					if (splitPosts.length > numOfRecentPostsShown) {
						splitPosts = splitPosts.slice(splitPosts.length - numOfRecentPostsShown, splitPosts.length);
					}
					res.render('popular', {
						authorized: req.isAuthenticated(),
						currentUser: name,
						posts: splitPosts,
						title: 'Popular Posts | Hyperbowl',
					});
				}
			});
		} else {
			res.redirect('/register');
		}
	})

	.post(function (req, res) {
		if (req.body.getCause == 'SCROLL') {
			let numberOfRetrievedPosts = 8;
			Post.find({}, function (err, posts) {
				if (err) {
					console.log(err);
				} else {
					mappedPosts = posts.map(function (el, i) {
						let mappedPost = el;
						mappedPost.index = i;
						mappedPost.value = posts[i].numberOfLikes * (posts[i].numberOfLikes / posts[i].numberOfViews) + 1;
						return mappedPost;
					});
					mappedPosts.sort(function (a, b) {
						// return (a.value + (0.1 * (a.index + 1))) - (b.value + (0.1 * (b.index + 1)));
						if (!a.value) {
							a.value = 0;
						}
						if (!b.value) {
							b.value = 0;
						}
						return a.value * (1 + 0.05 * a.index) - b.value * (1 + 0.05 * b.index);
					});
					let slicedPosts = mappedPosts.slice(0, mappedPosts.length - parseInt(req.body.numberOfPosts));
					slicedPosts = slicedPosts.splice(slicedPosts.length - numberOfRetrievedPosts, numberOfRetrievedPosts);
					res.send(slicedPosts);
				}
			});
		}
	});

/////////////////////////////////////////////////////////////////

app
	.route('/recent')

	.get(function (req, res) {
		if (req.isAuthenticated()) {
			let numOfRecentPostsShown = 12;
			let name = req.user;
			Post.find({}, function (err, posts) {
				if (err) {
					console.log(err);
				} else {
					let splitPosts = posts;
					if (splitPosts.length > numOfRecentPostsShown) {
						splitPosts = splitPosts.slice(splitPosts.length - numOfRecentPostsShown, splitPosts.length);
					}
					res.render('recent', {
						authorized: req.isAuthenticated(),
						currentUser: name,
						posts: splitPosts,
						title: 'Recent Posts | Hyperbowl',
					});
				}
			});
		} else {
			res.redirect('/register');
		}
	})

	.post(function (req, res) {
		if (req.body.getCause == 'SCROLL') {
			let numberOfRetrievedPosts = 8;
			Post.find({}, function (err, posts) {
				if (err) {
					console.log(err);
				} else {
					let slicedPosts = posts.slice(0, posts.length - parseInt(req.body.numberOfPosts));
					slicedPosts = slicedPosts.splice(slicedPosts.length - numberOfRetrievedPosts, numberOfRetrievedPosts);
					res.send(slicedPosts);
				}
			});
		}
	});

/////////////////////////////////////////////////////////////////

app.get('/about', function (req, res) {
	if (req.isAuthenticated()) {
		let name = req.user;
		res.render('about', {
			authorized: req.isAuthenticated(),
			currentUser: name,
			title: 'About | Hyperbowl',
		});
	} else {
		res.redirect('/register');
	}
});

/////////////////////////////////////////////////////////////////

app
	.route('/settings')

	.get(function (req, res) {
		if (req.isAuthenticated()) {
			res.render('usersettings', {
				authorized: true,
				currentUser: req.user,
				title: req.user.username + "'s Settings | Hyperbowl",
			});
		} else {
			//REDIRECTING TO LOGIN IS INTENTIONAL. IF THE USER IS ON THE PAGE BUT ISN'T LOGGED IN, IT'S BECAUSE THEIR SESSION LIKELY TIMED OUT. THEY ALREADY WILL HAVE AN ACCOUNT.
			res.redirect('/login');
		}
	})

	.post(function (req, res) {
		if (req.isAuthenticated()) {
			User.findById(req.user._id, function (err, foundUser) {
				if (err) {
					console.log(err);
				} else {
					foundUser.profileImage = req.body.userProfileImage;
					foundUser.email = req.body.userEmail;
					foundUser.preferences.styles.profileBackgroundImage = req.body.userBackgroundProfileImage;
					foundUser.preferences.styles.dashboardBackgroundImage = req.body.userBackgroundDashboardImage;
					foundUser.save();
					res.redirect('/settings');
				}
			});
		} else {
			res.redirect('login');
		}
	});

/////////////////////////////////////////////////////////////////

app.get('/logout', function (req, res) {
	if (req.isAuthenticated()) {
		req.logout();
	}
	res.redirect('/');
});

/////////////////////////////////////////////////////////////////

app.get(['/noteasteregg', '/NOTEASTEREGG'], function (req, res) {
	let name;
	if (req.user && req.isAuthenticated()) {
		name = req.user;
	} else {
		name = 'Guest';
	}
	res.render('easteregg', {
		authorized: req.isAuthenticated(),
		currentUser: name,
		title: 'Easter Egg | Hyperbowl',
	});
});

/////////////////////////////////////////////////////////////////

//GET 404 ERRORS

app.get('*', function (req, res, next) {
	let name;
	if (req.user && req.isAuthenticated()) {
		name = req.user;
	} else {
		name = 'Guest';
	}
	res.status(404).render('404', {
		authorized: req.isAuthenticated(),
		currentUser: name,
		title: 'Hyperbowl | 404',
	});
});

/////////////////////////////////////////////////////////////////

let port = process.env.PORT;
if (port == null || port == '') {
	port = 80;
}

// http.createServer(app).listen(port);
//
// https.createServer(options, app).listen(443);

app.listen(port, function () {
	console.log('Server started successfully.');
});
