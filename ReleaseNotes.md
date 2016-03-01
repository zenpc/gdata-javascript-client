# Version 2.2 #

  * Added method Service.userXGDataAuthorization() for environments that support cross-domain XmlHttpRequest, but don't support the Authorization header (this has been reported in some iPhones).
  * When encountering an error using gadgets and the OAuth proxy, the OAuth approval url is now included with the error (if it is present).
  * Analytics
    * Support for Analytics V2, including advanced segments, goal configuration information, and custom variables.
  * Finance
    * Updated to use GData V2.0.
  * Maps
    * Added getFeedBatchLink() method to FeatureFeed and MapFeed.
    * Added getVersionFeed() and getVersionEntry() methods to MapsService.
  * Sidewiki
    * Added getLanguageRestrict()/setLanguageRestrict() to get/set the language restrict ("lr") query parameter on SidewikiEntryFeed.  The language restrict parameter is a list of languages that restricts entries appearing in query result to only written in languages from the list.
    * Added getFullTextQuery()/setFullTextQuery() to get/set the full text ("q") query parameter on SidewikiEntryQuery and SidewikiUserQuery.


# Version 2.1 #

  * Added support for parameters to handle batch requests
  * Calendar
    * Added getIncomplete()/setIncomplete() methods on CalendarEntry.
    * Added getAllowIncomplete()/setAllowIncomplete() methods on CalendarEventQuery
  * Sidewiki
    * Added Usefulness parameter
    * Added getUsefulness()/setUsefulness() methods on SidewikiEntry
    * Added getIncludeLessUserful()/setIncludeLessUseful() methods on SidewikiEntryQuery


# Version 2.0 #

  * Launched Sidewiki client.
  * Added support for GData Version 2.
  * Added support for ETags during retrievals/updates/deletes.
  * Added support for passing parameters to AuthSubJS.
  * Updated AuthSubJS cookie age to 63072000.
  * Support for XML content in the KML content field of the Maps API.
  * New samples for AuthSubJS, conditional gets and conditional updates.
  * Removed deprecated elements.


# Version 1.10 #

  * Launched Maps client.


# Version 1.9 #

  * Launched Analytics client.


# Version 1.8 #

  * Updates to AuthSubJS
    * Support for "hd" parameter to indicate a particular hosted domain account to be accessed.
    * Support for multi-scope (i.e. "http://www.google.com/calendar/feeds http://www.google.com/m8/feeds/").
    * Support for multiple scopes per application.
    * Added google.accounts.AuthSubStatus enum (LOGGED\_OUT, LOGGING\_IN, LOGGED\_IN) and the google.accounts.user.getStatus() method to indicate the status of the user.
    * Added the google.accounts.user.getScopes() method to return the scopes for which the user is current authenticated.
  * ClientLogin
    * Added "accountType" parameter to google.gdata.client.GoogleService.setUserCredentials(), which supports GOOGLE, HOSTED or HOSTED\_OR\_GOOGLE
    * Calling setUserCredentials() multiple times with different credentials will reset the token
  * Google Base client - Fixed bug where multiple attributes were not being set properly.