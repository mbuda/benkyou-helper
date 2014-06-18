/*jshint globalstrict: true, devel: true, browser: true */
'use strict';

var dropbox = require('dropbox');

var client = new dropbox.Client({
    key: '879girjuj51wsvi',
    secret: 'wz87axx1zxbpee5',
    token: 'HFsm8SpY_UgAAAAAAAABr7SEHN6Mehk0gOVtpOJTfqii2Pt_4tO8ZmQDCiS3w0T9',
});

var showError = function(error) {
  switch (error.status) {
  case dropbox.ApiError.INVALID_TOKEN:
    // If you're using dropbox.js, the only cause behind this error is that
    // the user token expired.
    // Get the user through the authentication flow again.
    console.log('Your token has been expired, sorry.');
    break;

  case dropbox.ApiError.NOT_FOUND:
    // The file or folder you tried to access is not in the user's Dropbox.
    // Handling this error is specific to your application.
    prompt('File or folder not found');
    break;

  case dropbox.ApiError.OVER_QUOTA:
    // The user is over their Dropbox quota.
    // Tell them their Dropbox is full. Refreshing the page won't help.
    prompt('You have run out of quota. Your Dropbox is full.');
    break;

  case dropbox.ApiError.RATE_LIMITED:
    // Too many API requests. Tell the user to try again later.
    // Long-term, optimize your code to use fewer API calls.
    prompt('Too many requests, try again later');
    break;

  case dropbox.ApiError.NETWORK_ERROR:
    // An error occurred at the XMLHttpRequest layer.
    // Most likely, the user's network connection is down.
    // API calls will not succeed until the user gets back online.
    prompt('Your connection is dead probably');
    break;

  case dropbox.ApiError.INVALID_PARAM: break;
  case dropbox.ApiError.OAUTH_ERROR: break;
  case dropbox.ApiError.INVALID_METHOD: break;
  default:
    // Caused by a bug in dropbox.js, in your application, or in Dropbox.
    // Tell the user an error occurred, ask them to refresh the page.
  }
};

module.exports = {
  client: client,
  showError: showError
};
