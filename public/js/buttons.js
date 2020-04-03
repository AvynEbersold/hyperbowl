//jshint esversion: 9

function likePost(id) {
	$.ajax({
		url: '/posts/' + id,
		type: 'POST',
		dataType: 'json',
		data: {
			likeType: 'LIKE'
		},
		success: function(data) {
			document.querySelector('.post-like-number').textContent = data.numberOfLikes || 0;
			document.querySelector('.post-dislike-number').textContent = data.numberOfDislikes || 0;
			if (!data.userLikedPost) {
				document.querySelector('.post-like-btn').id = 'not-liked-disliked-post';
			} else {
				document.querySelector('.post-like-btn').id = 'liked-disliked-post';
			}
			if (!data.userDislikedPost) {
				document.querySelector('.post-dislike-btn').id = 'not-liked-disliked-post';
			} else {
				document.querySelector('.post-dislike-btn').id = 'liked-disliked-post';
			}
		}
	});
}

function dislikePost(id) {
	$.ajax({
		url: '/posts/' + id,
		type: 'POST',
		dataType: 'json',
		data: {
			likeType: 'DISLIKE'
		},
		success: function(data) {
			document.querySelector('.post-like-number').textContent = data.numberOfLikes || 0;
			document.querySelector('.post-dislike-number').textContent = data.numberOfDislikes || 0;
			if (!data.userLikedPost) {
				document.querySelector('.post-like-btn').id = 'not-liked-disliked-post';
			} else {
				document.querySelector('.post-like-btn').id = 'liked-disliked-post';
			}
			if (!data.userDislikedPost) {
				document.querySelector('.post-dislike-btn').id = 'not-liked-disliked-post';
			} else {
				document.querySelector('.post-dislike-btn').id = 'liked-disliked-post';
			}
		}
	});
}

function confirmation(callback, question) {
	let modalConfirmed = false;
	$('body').append(
		`
  <div class="modal">
    <div class="modal-content">
      <span class="close">&times;</span>
      <p class="modal-text dark-secondary-txt"><strong>` +
			question +
			`</strong></p>
      <a class="confirmation-yes confirmation-btn btn primary-btn">Yes</a>
      <a class="confirmation-no confirmation-btn btn secondary-btn">No</a>
    </div>
  </div>`
	);
	$('span').click(function() {
		if (modalConfirmed == false) {
			$('.modal').fadeOut();
			modalConfirmed = true;
			callback(false);
		}
	});
	$('.confirmation-no').click(function() {
		if (modalConfirmed == false) {
			$('.modal').fadeOut();
			modalConfirmed = true;
			callback(false);
		}
	});
	$('.confirmation-yes').click(function() {
		if (modalConfirmed == false) {
			$('.modal').fadeOut();
			modalConfirmed = true;
			callback(true);
		}
	});
}

function alert(content) {
	$('body').append(
		`
  <div class="modal">
    <div class="modal-content">
      <span class="close">&times;</span>
      <p class="modal-text dark-secondary-txt"><strong>` +
			content +
			`</strong></p>
    </div>
  </div>`
	);
	$('span').click(function() {
		$('.modal').fadeOut();
	});
}

function imgError() {
	this.src = 'https://picsum.photos/200/';
}

$(document).ready(function() {
	$('.delete-draft').on('click', function(e) {
		let id = $(this).attr('data-id');
		let userConsent = confirmation(deletion, 'Are you sure you want to delete this draft?');

		function deletion(userConsent) {
			if (userConsent == true) {
				$.ajax({
					type: 'DELETE',
					url: '/drafts/' + id,
					success: function(data) {
						$('#' + data._id).fadeOut();
					},
					dataType: 'JSON'
				});
			}
		}
	});

	$('.delete-post').on('click', function(e) {
		let id = $(this).attr('data-id');
		let userConsent = confirmation(deletion, 'Are you sure that you want to delete this post?<br><small>It will be permanently removed from our database.</small>');

		function deletion(userConsent) {
			if (userConsent == true) {
				$.ajax({
					type: 'DELETE',
					url: '/posts/' + id,
					success: function(data) {
						$('#' + data._id).fadeOut();
					},
					dataType: 'JSON'
				});
			}
		}
	});

	$('.create-post-btn').on('click', function(e) {
		let titleContent = $('#postTitle').val();
		titleContent = titleContent.replace(/\s/g, '');
		let bodyContent = $('#postContent').text();
		bodyContent = bodyContent.replace('  ', '');
		let minimumCharacters = 250;
		let maximumCharacters = 100000;
		let titleMinimumCharacters = 5;
		let titleMaximumCharacters = 80;
		if (titleContent.length >= titleMinimumCharacters) {
			if (titleContent.length <= titleMaximumCharacters) {
				if (bodyContent.length >= minimumCharacters) {
					if (bodyContent.length <= maximumCharacters) {
						let userConsent = confirmation(
							postCreation,
							'Are you sure that you want to publish this post?<br><small>From then on, it will be available to the public. Any post considered spam or abuse will be removed by admins.</small>'
						);
					} else {
						let postLengthAlert = alert(
							'Your post content must be less than ' +
								maximumCharacters +
								' characters (excluding consecutive spaces) long to be published.<br><small>Make sure your post is something you have written yourself.</small>'
						);
					}
				} else {
					let postLengthAlert = alert('Your post content must be at least ' + minimumCharacters + ' characters (excluding consecutive spaces) long to be published.');
				}
			} else {
				let titleLengthAlert = alert('Your post title must be less than ' + titleMaximumCharacters + ' characters long to be published.');
			}
		} else {
			let titleLengthAlert = alert('Your post title must be at least ' + titleMinimumCharacters + ' characters (excluding spaces) long to be published.');
		}

		function postCreation(userConsent) {
			if (userConsent == true) {
				document.createPostForm.postTitle.value = $('#postTitle').val();
				document.createPostForm.postContent.value = $('#postContent').html();
				document.createPostForm.postImage.value = $('#postImage').val();
				document.forms.createPostForm.submit();
			}
		}
	});

	$('.create-draft-btn').on('click', function(e) {
		$.ajax({
			type: 'POST',
			url: '/userdrafts',
			data: {
				postTitle: $('#postTitle').val(),
				postContent: $('#postContent').html(),
				postImage: $('#postImage').val(),
				draftId: $('#draftId').val(),
				originalPost: $('#originalPost').val(),
				sectionNumber: $('#sectionNumber').val()
			},
			dataType: 'JSON'
		}).done(function() {
			window.setTimeout(function() {
				window.location.href = '/userdrafts';
			}, 50);
		});
	});

	$('.append-section-btn').on('click', function(e) {
		document.createPostForm.postTitle.value = $('#postTitle').val();
		document.createPostForm.postContent.value = $('#postContent').html();
		document.createPostForm.postImage.value = $('#postImage').val();
		document.forms.createPostForm.submit();
	});

	$('.send-message-btn').on('click', function(e) {
		let recipient = $('#messageRecipient').val();
		$.ajax({
			type: 'POST',
			url: '/messages',
			data: {
				messageDeletion: 'FALSE',
				messageRecipient: $('#messageRecipient').val(),
				messageTitle: $('#messageTitle').val(),
				messageContent: $('#messageContent').val()
			},
			success: function(data) {
				if (data.error) {
					alert(data.error);
				} else {
					if (recipient == data.currentUserUsername) {
						location.reload(true);
					} else {
						$('input[type=text], textarea').val('');
						alert('Message was sent to ' + recipient);
					}
				}
			},
			dataType: 'JSON'
		});
	});

	$('.post-like-btn').on('click', function(e) {
		const id = $(this).attr('data-id');
		likePost(id);
	});

	$('.post-dislike-btn').on('click', function(e) {
		const id = $(this).attr('data-id');
		dislikePost(id);
	});

	$('.comment-delete-btn').on('click', function(e) {
		let id = $(this).attr('data-id');
		let commentId = $(this).attr('id');

		let userConsent = confirmation(deletion, 'Are you sure that you want to delete your comment?<br><small>It will be permanently removed from our database.</small>');

		function deletion(userConsent) {
			if (userConsent == true) {
				$.ajax({
					type: 'POST',
					url: window.location.pathname.toString(),
					data: {
						commentDeletion: 'TRUE',
						commentId: commentId
					},
					success: function(data) {
						$('#commentdiv-' + data.deletedCommentId).fadeOut();
					},
					dataType: 'JSON'
				});
			}
		}
	});

	$('.load-more-comments-btn').on('click', function(e) {
		$.ajax({
			type: 'POST',
			url: window.location.pathname.toString(),
			data: {
				commentRetrieval: 'TRUE',
				numberOfCurrentComments: $('.user-comments').children().length - 1
			},
			success: function(data) {
				for (let i = data.comments.length - 1; i >= 0; i--) {
					let commentHTML =
						'<div class="comment" id="commentdiv-' +
						data.comments[i]._id +
						'"><div class="comment-user-img-div"><img class="comment-user-img" src="' +
						data.comments[i].authorProfileImage +
						'" id="commentimg-' +
						data.comments[i]._id +
						'"alt="User-image"></div><div class="comment-text"><small><a href="/users/' +
						data.comments[i].author +
						'">' +
						data.comments[i].authorUsername +
						'</a>: <small>(' +
						data.comments[i].datePosted +
						')</small>';
					if (data.userIsAuthenticated) {
						if (data.userId.toString() == data.comments[i].author.toString()) {
							commentHTML += '<span class="comment-delete-btn" id="' + data.comments[i]._id + '">&times;</span>';
						}
					}
					commentHTML += '</small><br>' + data.comments[i].content + '</div>';
					$('.user-comments').append(commentHTML);
					document.getElementById('commentimg-' + data.comments[i]._id).addEventListener('error', imgError);
				}
				if (!data.allComments) {
					$('.load-more-comments-btn').appendTo('#user-comments');
				} else {
					$('.load-more-comments-btn').hide();
				}
			},
			dataType: 'JSON'
		});
	});

	$('.message-delete-btn').on('click', function(e) {
		let messageId = $(this).attr('id');
		$.ajax({
			type: 'POST',
			url: '/messages',
			data: {
				messageDeletion: 'TRUE',
				messageId: messageId
			},
			success: function(data) {
				$('#messagediv-' + data).fadeOut();
				let inboxMessageNum = $('.inbox-message-number')
					.first()
					.text();
				inboxMessageNum = parseInt(inboxMessageNum) - 1;
				$('.inbox-message-number').text(inboxMessageNum);
			},
			dataType: 'JSON'
		});
	});

	$('.post-search-bar').keydown(function() {
		setTimeout(function() {
			if ($('.post-search-bar').val() == '') {
				$('.post-search-bar-suggestions').html('');
			} else {
				$.ajax({
					url: '/',
					type: 'POST',
					dataType: 'json',
					data: {
						searchContent: $('.post-search-bar').val()
					},
					contentType: 'application/x-www-form-urlencoded',
					success: function(data) {
						$('.post-search-bar-suggestions').html('');
						data.forEach(function(post) {
							$('.post-search-bar-suggestions').append('<a class="dropdown-item dark-secondary-txt" href="/posts/' + post._id + '">' + post.title + '</a>');
						});
					}
				});
			}
		}, 10);
	});

	// $(".follow-user-button").on('click', function(e){
	//   //SEND MESSAGE TO SERVER TO FOLLOW THIS USER
	// });
});
