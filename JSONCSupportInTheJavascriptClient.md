# Introduction #

YouTube recently announced a [new JSON format](http://apiblog.youtube.com/2010/02/new-format-for-json-results.html) for their API, and we've added a new interface to the Google Data JS Client to support this format.  This document has more details on how to use this new interface.

This interface is experimental, and may change at any time.  The idea is to put this design out there and get feedback from you, the developer.  Love it?  Hate it?  Got some feedback?  Let us know on the [JavaScript Client Group](http://groups.google.com/group/google-data-javascript-client)



# Example #

You can view a working example here:

http://gdata-javascript-client.googlecode.com/svn/trunk/samples/jsonc/youtube/index.html

Here's a snippet of code that demonstrates how to make JSON-C requests:

```
<html>
<head>
<script src="http://www.google.com/jsapi"></script>
<script>
  // Load the latest version of the Google Data JavaScript Client
  google.load('gdata', '2.x', { packages : ['experimental']});

  // Function to call once the library has loaded.
  google.setOnLoadCallback(loadVideos);

  function loadVideos() {
    var feedUrl = 'http://gdata.youtube.com/feeds/api/standardfeeds/top_rated';
    google.gdata.client.getRequest()
     .setUri(feedUri)
     .addParameter('v', 2)
     .addParameter('time', 'this_week')
     .execute(loadVideosCallback);
  }

  function loadVideosCallback(response) {
    if (response && response.error) {
      // handle error
    } else {
      // handle successful response
    }
  }

</script>
</head>
<body>
</body>
</html>
```



# Changes #

This biggest change from the existing JS client library is that requests are encapsulated in an object.  Parameters are added incrementally to this request object.  Once the request object has all the necessary parameters, it is executed.  We're hoping that this new interface will be simpler and more intuitive to work with than the old interface (and just to clarify, the old interface isn't going anywhere.  This new interface is for JSON-C APIs only).


# Loading the Library #

We've created a new package called "experimental" which will be a testing ground for new features to the client library.  You can load this "experimental" library with the following command:

```
google.load('gdata', '2.x', { packages : ['experimental']});
```



# Creating Requests #

You can create one of the 4 request types (GET, POST, PUT, DELETE) using one of the following functions:

```
google.gdata.client.getRequest()
google.gdata.client.insertRequest()
google.gdata.client.updateRequest()
google.gdata.client.deleteRequest()
```

Each of these methods returns an ApiRequest object.  The ApiRequest object lets you set arguments on the request before executing the request.



# Setting Request Arguments #

The ApiRequest class contains the following methods that let you set arguments for the request.

`setUri(string)` - Sets the uri of the feed or entry to retrieve.

`addParameter(key, value)` - Adds a query parameter to the request.  You can also add an etag to the request by calling this method with key='etag', and value equal to the etag value.

`addParameters(object)` - A convenience method for adding multiple query parameters to a request.  The object argument stores key/value pairs, each representing a different query parameter.

`setEntity(object)` - This is used to set the body on insert and update requests.  It can't be used on the current YouTube API since that API is read-only.  However, YouTube as well as other APIs will eventually support reading and writing JSON objects.



# Executing the Request #

Once the uri, parameters, and entity are set on the request, you can execute the request with the following method:

```
execute(callback)
```

The "callback" parameter is the method that gets called with the response once the request has executed.  If the request was successful, the response's JSON object will contain a "data" object with all the details from the response.



# Handling Errors #

If there was an error, the JSON object will contain an "error" object with information about what went wrong.  This error object will have a both a "code" and a "message" property can give you details.