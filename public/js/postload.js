//jshint esversion: 9

$(document).ready(function () {
	let bottomMargin = 500;
	if (window.location.pathname.toString() == '/' || window.location.pathname.toString() == '/recent' || window.location.pathname.toString() == '/popular') {
		let sendingRequest = false;
		setInterval(function () {
			if (window.pageYOffset + window.innerHeight > $(document).height() - $('.footer').height() - bottomMargin && sendingRequest == false) {
				sendingRequest = true;
				$.ajax({
					url: window.location.pathname.toString(),
					type: 'POST',
					dataType: 'json',
					data: {
						getCause: 'SCROLL',
						numberOfPosts: $('.post-thumbnail').length,
					},
					success: function (data) {
						for (let i = data.length - 1; i >= 0; i--) {
							let postHTML = "<div class='col-lg-3 col-md-6'>";
							postHTML += '<div class="card post-thumbnail" id="' + data[i].id + '">';
							postHTML += '<a href="/posts/' + data[i]._id + '" class="article-link-button">';
							postHTML += '<div class="card-img-container">';
							if (data[i].image) {
								postHTML += '<img src="' + data[i].image + `" class="card-img-top" alt="Cover photo" onError="this.src = 'https://picsum.photos/800/'">`;
							} else {
								postHTML += `<img src="https://picsum.photos/600/" class="card-img-top" alt="Cover photo" onError="this.src = 'https://picsum.photos/800/'">`;
							}
							postHTML += '</div></a>';

							postHTML += '<hr class="nomargin-line">';
							postHTML += '<div class="card-body">';
							postHTML += '<h5 class="card-title">' + data[i].title + '</h5>';
							postHTML += '';
							postHTML += '';
							postHTML += '';
							postHTML += '<p class="card-text">Posted By: <a href="/users/' + data[i].author + '">' + data[i].authorUsername + '</a>';
							postHTML += ' | ' + data[i].datePublished;
							postHTML +=
								' | <span class="bordered-txt"><i class="far fa-thumbs-up"></i> ' +
								data[i].numberOfLikes +
								'</span> <span class="bordered-txt"><i class="far fa-eye"></i> ' +
								data[i].numberOfViews +
								'</span></p>';
							let previewSpan = document.createElement('span');
							previewSpan.innerHTML = data[i].sections[0].trim();
							postHTML += '<span>' + previewSpan.textContent.substring(0, 120) + '</span>';
							postHTML += '<a href="/posts/' + data[i]._id + '" class="btn article-link-button margin-top">Visit Article</a>';
							$('.post-thumbnail-section').append(postHTML);
							if ($('.post-thumbnail').length % 16 == 0) {
								$('.post-thumbnail-section').append(`<div class="col-12">
                <div class="ad centered margin-bottom margin-top">
                  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
                  <!-- Dashboard Row Ad -->
                  <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-8234960759619801" data-ad-slot="2978351432" data-ad-format="auto" data-full-width-responsive="true"></ins>
                  <script>
                    (adsbygoogle = window.adsbygoogle || []).push({});
                  </script>
                </div>
              </div>`);
							}
						}
						sendingRequest = false;
					},
				});
			}
		}, 50);
	}
});
