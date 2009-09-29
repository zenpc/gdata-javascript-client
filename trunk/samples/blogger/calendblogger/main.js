/* Copyright (c) 2007 Google Inc. 
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0 
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License. 
 */

/**
 * @fileoverview Demonstrates AuthSub, date range queries, and cross domain
 * writes using the Calendar and Blogger JavaScript client libraries.  
 * 
 * NOTES: This demo uses the jQuery library to handle a lot of the JavaScript 
 * UI effects. The $(...) is a common jQuery object expression and the jQuery 
 * library must be included before using it.  For more information on jQuery, 
 * please refer to the jQuery homepage - http://jquery.com/
 *
 */

// global namespace for the demo
var calendblogger = {};

// The Calendar Data API feed URL that allows event query for the demo
calendblogger.CALENDAR_FEED_URL = 
    'http://www.google.com/calendar/feeds/default/private/full';

// The Blogger API feed URL that allows blog entry submission for the demo
calendblogger.BLOGGER_FEED_URL = 'http://www.blogger.com/feeds';

// The Blogger API feed URL that allows retrieval of blogs belonging to a user
calendblogger.BLOGGER_GETBLOGS_FEED = 
    'http://www.blogger.com/feeds/default/blogs';

calendblogger.bloggerService = null;
calendblogger.calendarService = null;

// CSS IDs
calendblogger.MAIN_DIV = '#main';
calendblogger.DISPLAY_DIV = '#display';
calendblogger.BLOG_IFRAME = '#bloggerIframe';
calendblogger.BLOGGER_LOGIN_BUTTON = '#bloggerLogin';
calendblogger.BLOGGER_RUN_BUTTON = '#bloggerRun';
calendblogger.CALENDAR_LOGIN_BUTTON = '#calendarLogin';
calendblogger.CALENDAR_RUN_BUTTON = '#calendarRun';
calendblogger.BLOG_SELECTOR = '#blogChooser';
calendblogger.START_DATE_CHOOSER = '#startDate';
calendblogger.START_MONTH_CHOOSER = '#startMonth';
calendblogger.START_YEAR_CHOOSER = '#startYear';
calendblogger.END_DATE_CHOOSER = '#endDate';
calendblogger.END_MONTH_CHOOSER = '#endMonth';
calendblogger.END_YEAR_CHOOSER = '#endYear';

// Button labels
calendblogger.BLOGGER_LOGIN_LABEL = 'Blogger Login';
calendblogger.BLOGGER_LOGOUT_LABEL = 'Blogger Logout';
calendblogger.CALENDAR_LOGIN_LABEL = 'Calendar Login';
calendblogger.CALENDAR_LOGOUT_LABEL = 'Calendar Logout';

// Load the Google data JavaScript client library
google.load("gdata", "2.x", {packages: ['blogger', 'calendar']});
google.setOnLoadCallback(init);


/**
 * Global initalization, for GData services, UI and UI event handlers
 */   
function init() {  

  // do not do anything if it is a token redirect
  if (!isTokenRedirect()) {    
    initBlogger();
    initCalendar();   
    $(calendblogger.MAIN_DIV).css({display: 'block'});
  }
}

/**
 * Detect whether the current session is a token redirect
 * @return {Boolean} True/false to whether this is a redirect session
 */  
function isTokenRedirect() {

  var status = false;

  var url = location.href;

  var matchArr = url.match(/#2/);
  
  if (matchArr != null) {
    status = true;
  }

  return status;
}

/**
 * Initialize blogger service and it's UI features
 */
function initBlogger() {
  
  calendblogger.bloggerService = 
      new google.gdata.blogger.BloggerService('GoogleInc-calendBlogger-1');

  // Set up event handling for blogger login/logout buttons
  $(calendblogger.BLOGGER_LOGIN_BUTTON).click(function() {
    if ($(calendblogger.BLOGGER_LOGIN_BUTTON).attr('value') == 
        calendblogger.BLOGGER_LOGIN_LABEL) {
      bloggerToken = 
          google.accounts.user.login(calendblogger.BLOGGER_FEED_URL);

    } else {

      if (hasBloggerToken()) {          
        $(calendblogger.BLOG_SELECTOR).hide();   
        $(calendblogger.BLOG_SELECTOR).empty();    
        $(calendblogger.BLOG_IFRAME).fadeOut(2000);
        google.accounts.user.logout();
        $(calendblogger.BLOGGER_LOGIN_BUTTON).
            attr({value: calendblogger.BLOGGER_LOGIN_LABEL});
        setIsBloggable();
      }            
    }
  });
  
  // Set up event handling for "blog" button 
  $(calendblogger.BLOGGER_RUN_BUTTON).click(function() {
    postBlogEntry();
  });  
  
  // Set up event handling for blog chooser
  $(calendblogger.BLOG_SELECTOR).change(function() {
    displayBlog();
  });

  // Initialize look & feel based on login status
  if (hasBloggerToken()) {
    
    $(calendblogger.BLOGGER_LOGIN_BUTTON).
        attr({value: calendblogger.BLOGGER_LOGOUT_LABEL});
    setIsBloggable();
    loadBlogList();
  } else {
    $(calendblogger.BLOGGER_LOGIN_BUTTON).
        attr({value: calendblogger.BLOGGER_LOGIN_LABEL});
    setIsBloggable();
    $(calendblogger.BLOG_IFRAME).hide(); 
    $(calendblogger.BLOG_SELECTOR).hide(); 
  }  
}

/**
 * Initialize calendar service and it's UI features
 */
function initCalendar() {

  calendblogger.calendarService =
      new google.gdata.calendar.CalendarService('GoogleInc-calendBlogger-1');

  // set up event handlers for calendar login/logout buttons
  $(calendblogger.CALENDAR_LOGIN_BUTTON).click(function() {
    if ($(calendblogger.CALENDAR_LOGIN_BUTTON).
        attr('value') == calendblogger.CALENDAR_LOGIN_LABEL) {

      calendarToken = 
          google.accounts.user.login(calendblogger.CALENDAR_FEED_URL);
    } else {
      if (hasCalendarToken()) {
        $(calendblogger.DISPLAY_DIV).fadeOut(2000);
        google.accounts.user.logout();
        $(calendblogger.CALENDAR_LOGIN_BUTTON).
            attr({value: calendblogger.CALENDAR_LOGIN_LABEL});
        disableButton(calendblogger.CALENDAR_RUN_BUTTON);
        setEnabledDateMenu(false);
        setIsBloggable();
      }
    }
  });
  
  // Set up event handling for "get events" button
  $(calendblogger.CALENDAR_RUN_BUTTON).click(function() {    
    cookieSetDate();     
    displayEvents();
  });  

  // Initialize look & feel based on login status
  if (hasCalendarToken()) {
    $(calendblogger.CALENDAR_LOGIN_BUTTON).
        attr({value: calendblogger.CALENDAR_LOGOUT_LABEL});
    setIsBloggable();
    setEnabledDateMenu(true);
  } else {
    $(calendblogger.CALENDAR_LOGIN_BUTTON).
        attr({value: calendblogger.CALENDAR_LOGIN_LABEL});
    disableButton(calendblogger.CALENDAR_RUN_BUTTON);
    setIsBloggable();
    setEnabledDateMenu(false);

  }
  
  // set today date or use the cookie date  
  cookieGetDate();

  // set up editable display
  $(calendblogger.DISPLAY_DIV).click(function() {
    
    var displayContent = $(calendblogger.DISPLAY_DIV).html();
    if ($.trim(displayContent).length > 0){
      
      displayContent = displayContent.replace(/<br>/g, '\n');

      var cols = 56;
      var rows = (displayContent.length / cols) * 3;    
 

      editBoxHtml = [
          '<textarea name=cond_des id=cond_des cols=',
          cols,
          ' rows=',
          rows,
          '>',
          displayContent,
          '</textarea>'
          ].join('');

      var editBox = $(editBoxHtml);

      editBox.blur(function() {

        var editContent = $(this).val();

        $(editBox).unbind('blur');
        $(editBox).remove();                

        editContent = editContent.replace(/\n/g, '<br>');      

        $(calendblogger.DISPLAY_DIV).html(editContent);
        $(calendblogger.DISPLAY_DIV).show();
      });       

      $(calendblogger.DISPLAY_DIV).after(editBox);
          
      $(this).hide();
      
      editBox.focus();    

    }
  });
  
  $(calendblogger.CALENDAR_RUN_BUTTON).trigger('click');
}

/**
 * Check if there is a blogger AuthSub token for the current session
 * @return {Boolean} True/false to indicate if there is a blogger AuthSub token
 */  
function hasBloggerToken() {

  var success = true;

  if (google.accounts.user.checkLogin(calendblogger.BLOGGER_FEED_URL) === '') {
    success = false;
  }

  return success;
}

/**
 * Check if there is a calendar AuthSub token for the current session
 * @return {Boolean} True/false to indicate if there is a calendar AuthSub token
 */  
function hasCalendarToken() {

  var success = true;

  if (google.accounts.user.checkLogin(calendblogger.CALENDAR_FEED_URL) === '') {
    success = false;
  }

  return success;
}

/**
 * Check the following condition before submitting an entry to Blogger
 *  1) content is not empty
 *  2) the user has a blog
 * @return {Boolean} True/false to indicate if a blog entry submission can 
 *     take place
 */  
function isBloggable() {

  var status = true;
  
  // check if the calendar entry is empty or two
  if ($.trim($(calendblogger.DISPLAY_DIV).html()).length == 0) {
    alert('you have nothing to blog');
    status = false;
  }  

  // check if there is a blog to blog to
  if ($(calendblogger.BLOG_SELECTOR).get(0).options
      [$(calendblogger.BLOG_SELECTOR).get(0).selectedIndex].value.length == 0) {
    alert('you don\'t have a blog');
    status = false;
  }

  return status;
}

/**
 * Submit the content on event display as a blog entry to Blogger
 */  
function postBlogEntry() {

  if (hasBloggerToken()) {
    if (isBloggable()) {
      insertBlogEntry();
    }
  }
}

/**
 * Create a Date object from the user-selected start date dropdown menu
 * @return {Date} Date object represents the user-selected start date
 */  
function getStartDate() {
  
  var year = $(calendblogger.START_YEAR_CHOOSER).get(0).
      options[$(calendblogger.START_YEAR_CHOOSER).get(0).selectedIndex].value;
  var month = $(calendblogger.START_MONTH_CHOOSER).get(0).
      options[$(calendblogger.START_MONTH_CHOOSER).get(0).selectedIndex].value;
  var date = $(calendblogger.START_DATE_CHOOSER).get(0).
      options[$(calendblogger.START_DATE_CHOOSER).get(0).selectedIndex].value;

  return new Date(year, month, date);
}

/**
 * Create a Date object from the user-selected end date dropdown menu
 * @return {Date} Date object represents the user-selected end date
 */  
function getEndDate() {
  
  var year = $(calendblogger.END_YEAR_CHOOSER).get(0).
      options[$(calendblogger.END_YEAR_CHOOSER).get(0).selectedIndex].value;
  var month = $(calendblogger.END_MONTH_CHOOSER).get(0).
      options[$(calendblogger.END_MONTH_CHOOSER).get(0).selectedIndex].value;
  var date = $(calendblogger.END_DATE_CHOOSER).get(0).
      options[$(calendblogger.END_DATE_CHOOSER).get(0).selectedIndex].value;

  return new Date(year, month, date);
}

/**
 * Set the date dropdown menu to be today's date
 */
function setStartDate(date) {

  var year = date.getFullYear();
  var month = date.getMonth();
  var date = date.getDate();
  
  var latestYear = $(calendblogger.START_YEAR_CHOOSER).get(0).
      options[0].value;

  $(calendblogger.START_YEAR_CHOOSER).get(0).selectedIndex = latestYear - year;
  $(calendblogger.START_MONTH_CHOOSER).get(0).selectedIndex = month;
  $(calendblogger.START_DATE_CHOOSER).get(0).selectedIndex = date - 1;
}

/**
 * Set the date dropdown menu to be today's date
 */
function setEndDate(date) {

  var year = date.getFullYear();
  var month = date.getMonth();
  var date = date.getDate();

  var latestYear = $(calendblogger.END_YEAR_CHOOSER).get(0).
      options[0].value;

  $(calendblogger.END_YEAR_CHOOSER).get(0).selectedIndex = latestYear - year;
  $(calendblogger.END_MONTH_CHOOSER).get(0).selectedIndex = month;
  $(calendblogger.END_DATE_CHOOSER).get(0).selectedIndex = date - 1;
}

/**
 * Display all calendar events within the date range specified by user
 */  
function displayEvents() {

  if (hasCalendarToken()) {

    var startDate = getStartDate();
    var endDate = getEndDate();    

    if (startDate.getTime() == endDate.getTime()) {
       endDate = new Date(startDate);
       endDate.setDate(startDate.getDate() + 1);
    }

    //alert(startDate.toString() + ' ' + endDate.toString());

    getDatedEvents(startDate, endDate);
  }
}

/**
 * Submit the content on display panel as a blog entry to Blogger
 */
function insertBlogEntry() {

  var postUrl = $(calendblogger.BLOG_SELECTOR).get(0).
      options[$(calendblogger.BLOG_SELECTOR).get(0).selectedIndex].value;
  var authorName = null;

  var blogTitle = [
      getStartDate().getFullYear(),
      '/',
      (getStartDate().getMonth() + 1),
      '/',
      getStartDate().getDate(),
      ' - ',
      getEndDate().getFullYear(),
      '/',
      (getEndDate().getMonth() + 1),
      '/',
      getEndDate().getDate()
      ].join('');

  var blogContent = $(calendblogger.DISPLAY_DIV).html();
  
  var newEntry = new google.gdata.blogger.PostEntry(
      {
          authors: [{name: '', email: ''}],
          title: {type: 'text', text: blogTitle},
          content: {type: 'text', text: blogContent}
      }
  );

  calendblogger.bloggerService.getBlogPostFeed(
      postUrl,
      function(root) {      
        root.feed.insertEntry(newEntry, displayBlog, handleError);
      },
      handleError
  );
}

/**
 * load all the blogs of user into the blogger chooser menu
 */
function loadBlogList() {

  var query = 
      new google.gdata.blogger.BlogQuery(calendblogger.BLOGGER_GETBLOGS_FEED);

  calendblogger.bloggerService.getBlogFeed(
      query,
      function(root) {

        var entries = root.feed.getEntries();

        for(var i = 0, entry; entry = entries[i]; i++) {

          var postUrl = entry.getEntryPostLink().getHref();
          var blogUrl = entry.getHtmlLink().getHref();
          var blogTitle = entry.getTitle().getText();
          
          var optionItem = [
              '<option value=',
              postUrl,
              '>',
              blogUrl,
              '</option>'
              ].join('');

          $(calendblogger.BLOG_SELECTOR).append(optionItem);          
        }
        
        if (entries.length > 0) {
          $(calendblogger.BLOG_SELECTOR).get(0).selectedIndex = 0;
          $(calendblogger.BLOG_SELECTOR).trigger('change');
        }

        $(calendblogger.BLOG_SELECTOR).show();
      },
      handleError
  );    
}

/**
 * Refresh the iframe for the selected blog
 */
function displayBlog() {
  
  var blogUrl = $(calendblogger.BLOG_SELECTOR).get(0).
      options[$(calendblogger.BLOG_SELECTOR).get(0).selectedIndex].innerHTML;
  var postUrl = $(calendblogger.BLOG_SELECTOR).get(0).
      options[$(calendblogger.BLOG_SELECTOR).get(0).selectedIndex].value;

  if (postUrl !== '') {
    $(calendblogger.BLOG_IFRAME).get(0).src = blogUrl; 
    $(calendblogger.BLOG_IFRAME).fadeIn(2000);
  }
}

/**
 * Submit a request with JavaScript GData API to calendar to retrieve calendar
 * events within the date range.  The resulted data will be formatted and 
 * displayed in the event display panel
 * @param {Date} startDate is the start date of the query
 * @param {Date} endDate is the end date of the query
 */ 
function getDatedEvents(startDate, endDate) {
  

  $(calendblogger.DISPLAY_DIV).empty();

  var query = 
      new google.gdata.calendar.CalendarEventQuery(
      calendblogger.CALENDAR_FEED_URL);

  // Set the start-min 
  query.setMinimumStartTime(new google.gdata.DateTime(startDate, true));
 
  // Set the start-max
  query.setMaximumStartTime(new google.gdata.DateTime(endDate, true));

  calendblogger.calendarService.getEventsFeed(
    query, 
    function(root) {
      var entries = root.feed.getEntries();

      var html = [];

      for (var i = 0, entry; entry = entries[i]; i++ ) {

        var title = entry.getTitle().getText();

        // if content is empty, replace it with "---"
        var content = 
            (entry.getContent().getText() == undefined) ? '---' : 
            entry.getContent().getText();
        var creators = '';
        var locations = '';
        var times = '';

        for (var j = 0, author; author = entry.getAuthors()[j]; j++) {
          var creatorName = author.getName().getValue();
          creators += creators + ' ' + creatorName;
        }

        for (var j = 0, location; location = entry.getLocations()[j]; j++) {

          // if location is empty, replace it with "---"
          var locationLabel = (location.getValueString()  == undefined) ? 
              '---' : entry.getLocations()[j].getValueString();
          locations += locations + ' ' + locationLabel;
        }

        for (var j = 0, time; time = entry.getTimes()[j]; j++) {

          var timeLabel = time.getStartTime().getDate().
              toLocaleString() + ' -- ' + entry.getTimes()[j].
              getEndTime().getDate().toLocaleString()
          times += times + ' ' + timeLabel;
        }

        
        html.push('Title: ' + title);          
        html.push('Organizer(s): ' + creators);          
        html.push('When: ' + times);          
        html.push('Where: ' + locations);          
        html.push('<br>Description: ' + content);          
        html.push('<hr>');
      }     

      if (entries.length > 0) {
        printToDisplay(html.join('<br>'));  
      }
         
    }, 
    handleError
  );  

}

/**
 * Enable a button to be clickable
 * @param {String} id is the CSS id of a button
 */
function enableButton(id) {
  $(id).get(0).disabled = false;
}

/**
 * Disable a button to be clickable
 * @param {String} id is the CSS id of a button
 */
function disableButton(id) {
  $(id).get(0).disabled = true;
}

/**
 * Enable or disable the date selection menu
 * @param {Boolean} enable represent true/false whether the date menu is 
 *     disabled
 */
function setEnabledDateMenu(enable) {

  enable = !enable;

  $(calendblogger.START_YEAR_CHOOSER).get(0).disabled = enable;
  $(calendblogger.START_MONTH_CHOOSER).get(0).disabled = enable;
  $(calendblogger.START_DATE_CHOOSER).get(0).disabled = enable;  

  $(calendblogger.END_YEAR_CHOOSER).get(0).disabled = enable;
  $(calendblogger.END_MONTH_CHOOSER).get(0).disabled = enable;
  $(calendblogger.END_DATE_CHOOSER).get(0).disabled = enable;
}

/**
 * Enable or disable the "Blog >>>" button 
 * @param {Boolean} enable represent true/false whether the blogger 
 *     button is disabled
 */
function setIsBloggable() {
  // initialize the button value display based on token status
  if (hasBloggerToken() && hasCalendarToken()) {    
    $(calendblogger.BLOGGER_RUN_BUTTON).get(0).disabled = false;
  } else {
    $(calendblogger.BLOGGER_RUN_BUTTON).get(0).disabled = true;
  }
}

/**
 * Print the data on the display panel
 * @param {String} data is a string of content to be displayed
 */
function printToDisplay(data) {
  $(calendblogger.DISPLAY_DIV).html(data);
  $(calendblogger.DISPLAY_DIV).css({display: 'block'});
}

/**
 * Print the error message on the display panel
 * @param {Object} e is the error Object
 */
function errorToDisplay(e) {
  $(calendblogger.DISPLAY_DIV).html(e.cause ? e.cause.statusText : e.message);
}

/**
 * Error handler for JavaScript GData API calls, it is used as a callback
 * @param {Object} e is the error Object
 */
function handleError(e) {
  errorToDisplay(e);
}

/**
 * Set the start date and end date for the date chooser menu.
 * If there is a cookie, the date range will be set to the cookie data.
 * Otherwise the range will be set to be today's date
 */
function cookieGetDate() {
  
  if (!readCookie('startdate')) {
    var today = new Date();
    setStartDate(today);
    setEndDate(today);
  } else {
    setStartDate(new Date(parseInt(readCookie('startdate'))));
    eraseCookie('startdate');
    if (readCookie('enddate')) {
      setEndDate(new Date(parseInt(readCookie('enddate'))));
      eraseCookie('enddate');
    } 
  }
}

/**
 * Set the current date range as a cookie
 */
function cookieSetDate() {
  var start = getStartDate();
  var end = getEndDate();
  
  createCookie('startdate', start.getTime(), 1);
  createCookie('enddate', end.getTime(), 1);
}

/**
 * Create a JavaScript cookie
 * @param {String} name is the name of the cookie
 * @param {String} value is the value of the cookie
 * @param {Number} number is the numbers of days the 
 *     cookie will be expired from today
 */
function createCookie(name,value,days) {

  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    var expires = '; expires=' + date.toGMTString();
  } else {
    var expires = '';
  }
  document.cookie = name + '=' + value+expires + '; path=/';
}

/**
 * Read the value of a JavaScript cookie
 * @param {String} name is the name of the cookie
 * @return {String} value of the cookie that matches the given name
 */
function readCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for(var i=0;i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1, c.length);
    }
    if (c.indexOf(nameEQ) == 0) { 
      return c.substring(nameEQ.length, c.length);
    }
  }
  return null;
}

/**
 * Set a cookie to be expired
 * @param {String} name is the name of the cookie
 */
function eraseCookie(name) {
  createCookie(name,"",-1);
}
