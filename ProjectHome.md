| <font color='#ff0000' size='4'><strong>Important:</strong> The GData JavaScript Client Library is officially deprecated as of April 20, 2012. It will continue to work, and does not have a shutoff date. However we strongly encourage you to move to the new <a href='https://code.google.com/p/google-api-javascript-client/'>Google APIs Client Library for JavaScript</a>.</font> |
|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|

| <font color='#ff0000' size='4'><b>Further note</b>: The AuthSubJS authentication system is no longer available, as of July 2, 2012. All examples that used that system have been removed from this project.</font> |
|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|

The Google Data JavaScript Client allows developers to make fully authenticated read, insert, update and delete operations on Google Data APIs.  The current version is 2.2, and it supports the following services:

  * Blogger
  * Calendar
  * Contacts
  * Finance

If you have any questions about using the client, please post them to the [Google Data JavaScript Client Discussion Group](http://groups.google.com/group/google-data-javascript-client).


## Quick Start ##

In order to begin using the JavaScript client, include the following script snippet in the head section of your html page:
```
<script type="text/javascript" src="http://www.google.com/jsapi"></script>
<script type="text/javascript">

  // Load the latest version of the Google Data JavaScript Client
  google.load('gdata', '2.x');

  function onGoogleDataLoad() {
    // Put your code here
  }

  // Call function once the client has loaded
  google.setOnLoadCallback(onGoogleDataLoad);

</script>
```
Place any code that uses the JavaScript client in the onGoogleDataLoad() function.  Continue reading to learn more and to see examples.


## Documentation ##

Here's an overview of [how to use the JavaScript Client](http://code.google.com/apis/gdata/client-js.html).  There are more details about each JavaScript class available in the [JavaScript Client Reference](http://code.google.com/apis/gdata/jsdoc/).  If you'd like to learn more about the Google Data APIs in general, visit the [Protocol Basics guide (v2.0)](http://code.google.com/apis/gdata/docs/2.0/reference.html).  Also, there are user guides for each of the services supported by the JavaScript client:

  * [JavaScript Developers Guide for Blogger](http://code.google.com/apis/blogger/docs/1.0/developers_guide_js.html)
  * [JavaScript Developers Guide for Calendar](http://code.google.com/apis/calendar/docs/1.0/developers_guide_js.html)
  * [JavaScript Developers Guide for Contacts](http://code.google.com/apis/contacts/docs/1.0/developers_guide_js.html)
  * [JavaScript Developers Guide for Finance](http://code.google.com/apis/finance/developers_guide_js.html)

Here are a few videos that also explain how to use the JavaScript Client:


| [![](http://img.youtube.com/vi/ZvFVs92Fydw/0.jpg)](http://www.youtube.com/watch?v=ZvFVs92Fydw) <br> <a href='http://www.youtube.com/watch?v=ZvFVs92Fydw'>Google Data JavaScript Client Library Introduction</a> </tbody></table>


<h2>Example ##

Each of the service-specific documentation guides above also contains an Interactive Developers Guide. The Interactive Developers Guide lets you write and execute JavaScript code against the Google Data APIs right from your browser.  In addition to that, here's a basic example that uses the JavaScript Client Library. The source code for this example can be found in this project's [samples directory](http://code.google.com/p/gdata-javascript-client/source/browse/#svn/trunk/samples).

  * [Basic unauthenticated query sample using Google Calendar](http://gdata-javascript-client.googlecode.com/svn/trunk/samples/calendar/simple_sample/simple_sample.html)