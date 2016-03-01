# Authenticating with some help from JQuery #

Many APIs, including Google's APIs, expose public data via JavaScript; in Google APIs, this format is called [json-in-script](http://code.google.com/apis/gdata/json.html#Request).  However, things get a little tricky when you want to access authenticated data from JavaScript.  The Google Data JavaScript Client uses a process called AuthSubJS to make authenticated requests to Google APIs from JavaScript.

The AuthSubJS process is similar to the standard [AuthSub](http://code.google.com/apis/accounts/docs/AuthSub.html) process.  AuthSubJS offers a lot of power to developers.  However, since we are working with JavaScript, all communication between the user, the web application and Google must happen through browser redirects.  This can lead to a choppy user experience.  If the user isn't prepared for these redirects, they could start interacting with the application before its ready.  To prevent these types of usability issues, this application will use [JQuery](http://jquery.com/) to display a "loading" icon until the application is ready.

The sample asks the user to login, and then loads a list of the user's blogs from the Blogger API.  The code for the sample can be found here:

http://gdata-javascript-client.googlecode.com/svn/trunk/samples/core/authsubjs/index.html

There are three states in the AuthSubJS process.  These states are also defined in the google.accounts.AuthSubStatus enum:

  * LOGGED\_OUT - The user is not logged into the application.
  * LOGGING\_IN - The user is in the process of logging into the application (Perhaps the token exchange is happening in the background).
  * LOGGED\_IN - The user is logged into the application.


The key to a smoother AuthSubJS process is to handle each of those three states appropriately.  Armed with this understanding of AuthSubJS, lets take a look at some code.

We'll start with a simple skeleton HTML page:
```
<html>
<head>
    <title>Example: AuthSubJS with JQuery</title>
    <link rel="stylesheet" type="text/css" href="main.css" />

      // TODO: JavaScript code goes here.

  </head>
  <body>
    <h2>Example: AuthSubJS with JQuery</h2>
    <div id="container">

    <!-- TODO: HTML divs go here -->

      </div>
  </body>
</html>
```
We are first going to add three separate divs to the page; replace the "TODO: HTML divs go here" comment with the following:
```
<div id="divLoggingIn">
  <img src="loading.gif" height="32" width="32" />
</div>

<div id="divLoggedOut" style="display: none;">
  <a href="#" onclick="login(); return false;">login</a>
</div>

<div id="divLoggedIn" style="display: none;">
  <a href="#" onclick="logout(); return false;">logout</a><br /><br />
  <!-- TODO: Load data from Blogger. -->
</div>
```
These three divs match the three states of AuthSubJS described above.  When the page first loads, we want to display a "loading" icon until we've determined what to show to the user.  Therefore, only the divLoggingIn div is visible; the other two divs are marked with "display: none".  The other two divs will be toggled visible as the user transitions between states.

We are going to use JQuery to manage the transitions between divs.  JQuery's Effects library offers smooth transitions between two divs.  The JQuery JavaScript file can be downloaded from their site, but to make things easier, we're going to use the version of JQuery hosted at the [Google AJAX Libraries API](http://code.google.com/apis/ajaxlibs/documentation/#jquery).  This infrastructure can be used to load both JQuery and the Google Data APIs.  Thes libraries are loaded by adding the following code to the section labeled "TODO: JavaScript code goes here.":
```
<script type="text/javascript" src="http://www.google.com/jsapi"></script>
<script type="text/javascript">

  // Load the Google Data JS Client for Blogger.
  google.load('gdata', '1.x', {packages: ['blogger']});

  // Load JQuery
  google.load('jquery', '1.3.2');

  // TODO: Rest of JavaScript code goes here.

</script>
```
The first line loads the Google JavaScript loader file, while the two google.load{} methods load the appropriate JavaScript libraries.  Notice the "packages: ['blogger']" parameter when loading the Google Data JavaScript client.  This tells the loader to only load the Blogger library; this reduces the JavaScript size by ignore services we don't need (such as Calendar or Contacts).  You can learn the details about loading the Google Data JavaScript Client [here](http://code.google.com/apis/gdata/client-js.html#Acquire_Library).

Now that our libraries are loaded, lets add a simple helper function to help transition between divs:
```
function transitionDiv(fromdiv, todiv, opt_callback) {
  $('#' + fromdiv).fadeOut('fast', function() {
    $('#' + todiv).fadeIn('fast', function() {
      if (opt_callback) {
        opt_callback();
      }
    });
  });
}
```
This function uses JQuery's fadeOut and fadeIn functions to fade out one div, fade in another, and then optionally execute a method.

With this infrastructure in place, we can now add the logic to determine which div to show to the user:
```
google.setOnLoadCallback(function() {
  var status = google.accounts.user.getStatus();
  if (status == google.accounts.AuthSubStatus.LOGGING_IN) {
    // User is in the process of logging in, do nothing.
    return;
  } else if (status == google.accounts.AuthSubStatus.LOGGED_OUT) {
    // User is logged out, display the "login" link.
    transitionDiv('divLoggingIn', 'divLoggedOut');
  } else {
    // User is logged in, load the user's data.
    transitionDiv('divLoggingIn', 'divLoggedIn', loadData);
  }
});
```
The function passed to google.setOnLoadCallback() is called once all the libraries have loaded.  Its sort of like a body onload() method for JavaScript.

The logic inside this method is fairly simple: look at the user's AuthSubJS status, and display the appropriate div.  The google.accounts.user.getStatus() method figures out all the details of where the user is in the AuthSubJS process.  If the user is in the process of logging in, the app does nothing, since the divLoggingIn div is already displayed.  If the user is logged out, the app transitions to the divLoggedOut div.  Otherwise the user is logged in and the app transitions to the divLoggedIn div (and load the user's data).

When the application first loads, the user will be logged out.  Clicking the "login" link will initiate the login process.  The login link in the divLoggedOut div is tied to the login() JavaScript function:
```
function login() {
  var scope = 'http://www.blogger.com/feeds';
  transitionDiv('divLoggedOut', 'divLoggingIn', function() {
    google.accounts.user.login(scope);
  });
}
```
This function transitions from the divLoggedOut div back to the divLoggingIn div, and then runs the login() method.  The google.accounts.user.login(scope) method will redirect the user to Google, where they can continue the authentication and authorization process.  Once that process is complete, the user will be redirected back to the application.

While we're at it, lets also set up a corresponding method to allow the user to log out of the application:
```
function logout() {
  transitionDiv('divLoggedIn', 'divLoggingIn', function() {
    google.accounts.user.logout(function() {
      window.location.reload();
    );
  });
}
```
Similar to the login() method, the logout() method fades in the "loading" div, logs the user out of the application, and then reloads the page.  This logout() method is wired to the logout link inside the divLoggedIn div.

The general infrastructure for logging into the application is now in place.  If you've been following along, you should be able to click the "login" link and log into the application.  During the token exchange process, you should only see the "loading" gif.  This lets the user know that something is happening while they wait.

You can take the lessons from above a step further to actually load data from the Blogger API.  We won't rehash that here since it is already covered in other tutorials.  But if you take a look at the loadData() method from the sample, you'll see that it displays its own "loading" gif while loading the data, and then transitions to displaying the data once the data has finished loading.