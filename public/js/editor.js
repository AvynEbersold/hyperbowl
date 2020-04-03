//jshint esversion: 9

// function prompt(question) {
// 	$('body').append(
// 		`
//   <div class="modal">
//     <div class="modal-content">
//       <span class="close">&times;</span>
//       <p class="modal-text dark-secondary-txt"><strong>` +
// 			question +
// 			`</strong></p>
// 		<input id="user-input" class="margin-bottom form-control" type="text">
//       <a class="confirmation-yes confirmation-btn btn primary-btn">Done</a>
//     </div>
//   </div>`
// 	);
// 	$('span').click(function() {
// 		$('.modal').fadeOut();
// 		return false;
// 	});
// 	$('.confirmation-yes').click(function() {
// 		$('.modal').fadeOut();
// 		return $('#user-input').val();
// 	});
// }

function link() {
	var url = prompt('Enter the URL');
	document.execCommand('createLink', false, url);
}

function copy() {
	document.execCommand('copy', false, '');
}

function changeColor() {
	var color = prompt('Enter your color in hex ex:#f1f233');
	document.execCommand('foreColor', false, color);
}

function getImage() {
	var file = document.querySelector('input[type=file]').files[0];

	var reader = new FileReader();

	let dataURI;

	reader.addEventListener(
		'load',
		function() {
			dataURI = reader.result;

			const img = document.createElement('img');
			img.src = dataURI;
			img.style = 'width: 100%;';
			document.querySelector('.editor').appendChild(img);
		},
		false
	);

	if (file) {
		console.log('s');
		reader.readAsDataURL(file);
	}
}

// function printMe() {
//   if (confirm("Check your Content before print")) {
//     const body = document.body;
//     let s = body.innerHTML;
//     body.textContent = editorContent.innerHTML;
//
//     document.execCommandShowHelp;
//     body.style.whiteSpace = "pre";
//     window.print();
//     location.reload();
//   }
// }
