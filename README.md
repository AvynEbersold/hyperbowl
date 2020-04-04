# Hyperbowl

> A literature creation and sharing app. Hyperbowl is intended to be a social media and content creation site for writers. Want to get the opinion of someone on your article? Hyperbowl is the place for that. Here's how Hyperbowl was created:

## Server

> The Hyperbowl server is all contained in an app.js file. The server is in Node.js built mainly using express, bodyParser, ejs, mongoose, passport, and session.

Unless the syntax determines otherwise, all declarations and Mongoose Schemas are defined at the top of the app.js file.
All other operations are done further down in the file.

## Pages & Styling

> All web pages are in .ejs files in the views directory.

Within the views directory, the partials directory contains the partial files. These are things like headers, footers, and sidebars.
There is also a metadata partial that should be included in every page for SEO and description purposes.
All of these pages are styled by one central CSS file. This file can be found by going through the file path public/css/styles.css. There is also a
dark theme CSS file within the public/css/styles.css directory. The dark-theme.css file is only for color changes once the dark theme is toggled.

## AJAX

> AJAX operations are triggered and sent to the server when a user interacts with certain page elements.

Most AJAX operations are in the buttons.js file. This can be found at public/js/buttons.js. This will catch events and send requests to the server. If there is
any further operation needed, it is carried out with jQuery.

## JavaScript

> The operations of the .js files are as follows:

buttons.js: catch events and trigger AJAX requests to the app.js file
editor.js: is used for the text and image editor that makes posts
postload.js: detects if the user has scrolled down to the bottom and loads more posts via AJAX if they have
userinterface.js: controls dark theme and sidebar collapsing.
welcomebanner.js: generates a random tip or hint and places it on a banner on the homepage
