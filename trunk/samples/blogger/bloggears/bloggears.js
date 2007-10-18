/* Copyright (c) 2007 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/** 
 * Authorizing to this URL enables us full access to user's blog feeds.
 * @type {String}
 */
var BLOGGER_AUTH_URL = 'http://www.blogger.com/feeds';

/**
 * This is the URL to query to get a list of the user's blogs
 * @type {String}
 */ 
var BLOGGER_LIST_URL = 'http://www.blogger.com/feeds/default/blogs';


/**
 * This object holds all the global variables used throughout the program.
 * @type {Object}
 */
var BlogPress = {
  /**
   * This becomes the google.gdata.blogger.BloggerService object that
   * we later perform insert/update/delete/get operations on.
   * @type {Object}
   */
  service: null,
  /**
   * This keeps track of currently selected blog's postHref. 
   * @type {String}
   */
  currentBlogPostHref: '',
  /**
   * This is the database object for our sql-lite local DB.
   * @type {Object}
   */
  db: null,
  /**
   * This is the timer set by setInterval, used for syncing.
   * @type {Object}
   */
  syncTimer: null,
  /**
   * This is the local store used by gears for capturing files.
   * @type {Object}
   */
  store: null,
  /** 
   * This is the number of milliseconds to wait between syncs.
   * @type {Number}
   */
  TIMER_MS: 20000,
  /**
   * This is the name of the store to open and capture files to.
   * @type {String}
   */
  STORE_NAME: 'bloggears',
  /**
   * These are the files required by this to work offline.
   * @type {Array}.<String>
   */
  PAGE_FILES: [
    'bloggears.html',
    'bloggears.js',
    'bloggears.png',
    'bloggears_styles.css',
    'gears_init.js',
    'gearsdb.js',
    'jsapi.js' ]
};

/**
 * This is used for setting the view mode in the app, by switchView.
 * @enum {Number}
 */
var BP_VIEWMODE = {
  SHOWPOSTS: 0,
  CREATEPOST: 1,
  EDITPOST: 2,
  ABOUT: 3
};

/**
 * These are the IDs for the various DOM elements used by the JS.
 * @enum {String}
 */
var BP_ID = {
  SHOWPOST_TAB: 'sublink0',
  SHOWPOST_LINK: 'sublink0a',
  SHOWPOST_BLOCK: 'showAllPostsDiv',
  CREATEPOST_TAB: 'sublink1',
  CREATEPOST_LINK: 'sublink1a',
  CREATEPOST_BLOCK: 'createOrEditDiv',
  ABOUT_TAB: 'sublink2',
  ABOUT_LINK: 'sublink2a',
  ABOUT_BLOCK: 'aboutDiv',
  DRAFT_BUTTON: 'draftButton',
  PUBLISH_BUTTON: 'publishButton',
  AUTH_BUTTON: 'authButton',
  FORM_EDITURI: 'blogPostEditUri',
  FORM_ID: 'blogPostId',
  FORM_HTMLHREF: 'blogPostHtmlHref',
  FORM_TITLE: 'blogPostTitleInput',
  FORM_CONTENT: 'blogPostTextArea',
  FORM_TAGS: 'blogPostCategoriesInput',
  AUTH_BLOCK: 'loginNotice'
};

/**
 * These are the hexadecimal color strings for the on/off tab states.
 * @enum {String}
 */
var BP_COLOR = {
  TAB_ON: '#0d324f',
  TAB_OFF: '#83b4d8',
  LINK_ON: '#fff',
  LINK_OFF: '#000'
};

/**
 * These indicate the various sync states of rows in the database.
 * @enum {Number}
 */
var BP_SYNCSTATE = {
  NOTHING_TO_DO: 0,
  MUST_DELETE: 1,
  MUST_SAVE_DRAFT: 2,
  MUST_PUBLISH: 3
};

/**
 * This function checks if the user is logged in, 
 * and changes the login button and displayed sections accordingly.
 * It also initializes the BlogPress.service variable, the Gears DB and store,
 * and calls a function to fill in the blog drop-down if possible.
 */
function init() {
  switchView(BP_VIEWMODE.ABOUT);

  if (!google.gears) {
    alert('Google Gears is required for this offline Blogger to work.' + 
        'Please download Gears from the link on the "About" tab.');
    return;
  }

  setupStore();
  setupDB(); 

  BlogPress.service = 
      new google.gdata.blogger.BloggerService('Google-BloggerOfflineSample-1');

  var token = google.accounts.user.checkLogin(BLOGGER_AUTH_URL);
  if (token) {
    el(BP_ID.AUTH_BUTTON).value = 'Logout';
    getBlogs();
  } else {
    el(BP_ID.AUTH_BUTTON).value = 'Login';
    el(BP_ID.AUTH_BLOCK).style.display = 'block';
  }
};

/**
 * This function setups the Local Server and store for this sample.
 * It captures all the files listed in BlogPress.PAGE_FILES
 */
function setupStore() {
  try {
    var localServer = google.gears.factory.create('beta.localserver', '1.0');
  } catch (e) {
    alert('Could not create local server: ' + e.message);
    return;
  }

  // Load in the offline resources (js/css/etc)
  BlogPress.store = localServer.openStore(BlogPress.STORE_NAME) ||
      localServer.createStore(BlogPress.STORE_NAME);
  BlogPress.store.capture(BlogPress.PAGE_FILES, function() {}); 
};

/**
 * This function setups the Local Server and store for this sample.
 * It captures all the files listed in BlogPress.PAGE_FILES
 */
function setupStore() {
  try {
    var localServer = google.gears.factory.create('beta.localserver', '1.0');
  } catch (e) {
    alert('Could not create local server: ' + e.message);
    return;
  }

  // Load in the offline resources (js/css/etc)
  BlogPress.store = localServer.openStore(BlogPress.STORE_NAME) ||
      localServer.createStore(BlogPress.STORE_NAME);
  BlogPress.store.capture(BlogPress.PAGE_FILES, 
      function(url, success, captureId) {});
};

/**
 * This function is used to clear the store. 
 * It is not called from the code but can be called from the browser
 * to force a refresh of the sample resources on next page load.
 */
function clearStore() {
  for (var i = 0; i < BlogPress.PAGE_FILES.length; i++) {
    BlogPress.store.remove(BlogPress.PAGE_FILES[i]);
  }
};

/**
 * This function sets up the local database, and creates 
 * two tables: one for the blogs, one for the posts.
 */
function setupDB() {
  BlogPress.db = new GearsDB('bloggears1'); 
  
  if (BlogPress.db) {
    BlogPress.db.run('create table if not exists blogs' + 
         ' (title varchar(100), postHref varchar(255), ' +
         'id integer primary key autoincrement)');
    BlogPress.db.run('create table if not exists postentries' +
         ' (id string, date varchar(255), title varchar(100), ' + 
         ' tags varchar(100), commentsHref varchar(255), ' + 
         ' author varchar(100), content varchar(1024), ' + 
         ' htmlHref varchar(255), editHref varchar(255), ' + 
         ' syncstate integer, postHref varchar(255))');
  }
};

/**
 * This function is triggered by the login/logout button.
 * If the user is logged in to the app, it logs them out.
 * If the user is logged out to the app, it logs them in.
 */
function loginOrLogout(){
  var token = google.accounts.user.checkLogin(BLOGGER_AUTH_URL);
  if (token) {
    google.accounts.user.logout();
    init();
  } else {
    google.accounts.user.login(BLOGGER_AUTH_URL);
  }
};

/**
 * Updates the current blog number when drop-down is changed.
 */
function updateCurrentBlogNum() {
  BlogPress.currentBlogPostHref = el('blogSelect').value;
  getPosts();
};

/**
 * Retrieves the feed of all the user's blogs. 
 * First looks for them in the local database,
 * then issues a request through the client lib for them.
 */
function getBlogs() {
  getLocalBlogs();
  getServerBlogs();
};

/**
 * This function checks the local database for the blogs,
 * and then fills the blog dropdown.
 */
function getLocalBlogs() {
  changeStatus('Retrieving blogs from local database.');
  var blogs = BlogPress.db.selectAll('select * from blogs', null);
  fillBlogsDropdown(blogs);
};

/**
 * This function sends a query through the client lib to get a feed
 * of the logged in users' blogs. 
 */
function getServerBlogs() {
  changeStatus('Attempting to retrieve blogs from Blogger service.');
  var query = new google.gdata.blogger.BlogQuery(BLOGGER_LIST_URL);
  downloadUrl(getRandomUrl(), function (responseText, status) {
    BlogPress.service.getBlogFeed(query, handleBlogsFeed, handleError);
  });
};

/**
 * This function is called after the feed query returns.
 * First it clears the blogs table. Then it parses through the entries, 
 * grabbing the necessary info and storing it in the local database.
 * When it's done, it fills the blog dropdown and attempts a local sync.
 * @param {google.gdata.BloggerFeed} resultsFeedRoot The blogs feed
 */
function handleBlogsFeed(resultsFeedRoot) {
  changeStatus('Retrieved blogs from Blogger service.');
  var blogsFeed = resultsFeedRoot.feed;

  var blogs = [];
  BlogPress.db.run('delete from blogs');
  for (var i = 0; i < blogsFeed.getEntries().length; i++) {
    var blogEntry = blogsFeed.getEntries()[i];
    var blogTitle = blogEntry.getTitle().getText();
    var blogPostLinkHref = blogEntry.getEntryPostLink().getHref();
    var blog = {title: blogTitle, postHref: blogPostLinkHref};
    blogs.push(blog);
    BlogPress.db.insertRow('blogs', blog);
  }
  fillBlogsDropdown(blogs);

  syncLocal();
  BlogPress.syncTimer = setInterval(syncLocal, BlogPress.TIMER_MS);
};

/**
 * Fills the blog dropdown according to info passed in.
 * @param {Array} blogs Array of blog objects, which contain title, postHref
 */
function fillBlogsDropdown(blogs) {
  var blogSelect = el('blogSelect');
  blogSelect.innerHTML = '';

  for (var i = 0; i < blogs.length; i++) {
    var blog = blogs[i];
    var blogOption = document.createElement('option');
    blogOption.setAttribute('value', blog.postHref);
    blogOption.appendChild(document.createTextNode(blog.title));
    blogSelect.appendChild(blogOption);
  }
  
  BlogPress.currentBlogPostHref = el('blogSelect').value;
};

/**
 * This function gets the posts for the currently selected blog.
 * It first tries to get them from the local database, and then
 * tries to issue a request through the client lib to get them.
 */
function getPosts() {
  // Get posts
  if (BlogPress.currentBlogPostHref.length > 5) {
    getLocalPosts(BlogPress.currentBlogPostHref);
    getServerPosts(BlogPress.currentBlogPostHref);
  }
};

/**
 * This function retrieves the posts from the local database
 * for the blog identified by the postHref, with non-synced posts first.
 * It then calls the function to refresh the blog post display.
 * @param {String} blogPostHref The postHref for the current blog
 */
function getLocalPosts(blogPostHref) {
  changeStatus('Retrieving posts from local database.');
  var posts = BlogPress.db.selectAll('select * from postentries ' +
    ' where postHref = \'' + blogPostHref + '\' and syncstate <>' 
    + BP_SYNCSTATE.MUST_DELETE + ' order by syncstate desc');
  displayBlogPosts(posts);
};

/**
 * This function sends a query through the client lib to get the posts
 * specified by the postHref. 
 * @param {blogPostHref} num The index of the blog in blogs array.
 */
function getServerPosts(blogPostHref) {
  changeStatus('Attempting to retrieve posts from Blogger service.');
  downloadUrl(getRandomUrl(), function (responseText, status) {
      BlogPress.service.getBlogPostFeed(blogPostHref, handlePostsFeed, 
        handleError);
  });
};
  
/**
 * This is the callback function for getServerPosts (on success).
 * It iterates through the results, retrieving the necessary info
 * and saving to the local database.
 * It calls the function to refresh the posts display when done.
 * @param {Object} resultsFeedRoot A google.gdata.BlogFeed object
 */
function handlePostsFeed(resultsFeedRoot) {
  changeStatus('Retrieved posts from Blogger service.');
  var postsFeed = resultsFeedRoot.feed;
  var postHref = postsFeed.getEntryPostLink().getHref();
  BlogPress.db.run('delete from postentries where postHref = \'' + postHref + 
      '\' and syncstate = ' + BP_SYNCSTATE.NOTHING_TO_DO);

  // Get the blog post information from the feed.
  var posts = [];
  for (var i = 0; i < postsFeed.getEntries().length; i++) {
    var blogPost = postsFeed.getEntries()[i];
    var post = {};
    post.syncstate = BP_SYNCSTATE.NOTHING_TO_DO;
    post.postHref = postHref;
    post.id = blogPost.getId().getValue();
    post.title = blogPost.getTitle().getText();
    post.content = blogPost.getContent().getText();
    post.author = blogPost.getAuthors()[0].getName().getValue();
    var updated = blogPost.getUpdated().getValue();
    post.date = google.gdata.DateTime.toIso8601(updated);
    post.commentsHref = '';
    if (blogPost.getRepliesHtmlLink()) {
      post.commentsHref = blogPost.getRepliesHtmlLink().getHref();
    }
    post.editHref = blogPost.getEditLink().getHref();
    // We know it's a draft post if it doesn't have an html link.
    post.htmlHref = '';
    if (blogPost.getHtmlLink()) {
      post.htmlHref = blogPost.getHtmlLink().getHref();
    }
     
    var categoriesArray = []
    for (var c = 0; c < blogPost.getCategories().length; c++) {
      categoriesArray.push(blogPost.getCategories()[c].getTerm());
    }
    post.tags = categoriesArray.join(', ');
      
    posts.push(post);
    BlogPress.db.insertRow('postentries', post);
  }
  getLocalPosts(postHref);
};

/**
 * Displays the blog posts passed in.
 * @param {Array} posts The  posts to display.
 */
function displayBlogPosts(posts) {
  // If there are no posts in this blog feed, display message.
  if (posts.length == 0) {
    el(BP_ID.SHOWPOST_BLOCK).innerHTML = 
        'There are either no posts in this blog or ' +
        'they have not been synced yet.';
    return;
  }
 
  var table = document.createElement('table');
  var tbody = document.createElement('tbody');
   
  // Create the top row for the table.
  var th = document.createElement('tr');
  addRowCell(th, 'top', document.createTextNode('When'));
  addRowCell(th, 'top', document.createTextNode('Title'));
  addRowCell(th, 'top', document.createTextNode('Categories'));
  addRowCell(th, 'top', document.createTextNode('Comments'));
  addRowCell(th, 'top', document.createTextNode('Author'));
  addRowCell(th, 'top', document.createTextNode(''));
  addRowCell(th, 'top', document.createTextNode(''));
  addRowCell(th, 'top', document.createTextNode(''));
  tbody.appendChild(th);

  // Iterate through the blog posts, displaying info for each.
  for (var i = 0; i < posts.length; i++) {
    var post = posts[i];
    var color = (i%2 == 0) ? 'odd' : 'even';
    if (post.syncstate != 0) {
      color = 'notsynced';
    }
    var isDraft = (post.htmlHref == '') ? true : false;
    if (post.syncstate == BP_SYNCSTATE.MUST_PUBLISH) {
      isDraft = false;
    }
    
    var tr = document.createElement('tr');

    addRowCell(tr, color, document.createTextNode(post.date));
    addRowCell(tr, color, document.createTextNode(post.title));
    addRowCell(tr, color, document.createTextNode(post.tags));
    if (!isDraft && post.commentsHref != null && post.commentsHref.length > 5) {
      var commentsA = document.createElement('a');
      commentsA.setAttribute('href', post.commentsHref);
      commentsA.setAttribute('target', '_blank');
      commentsA.appendChild(document.createTextNode('Read'));
      addRowCell(tr, color, commentsA);
    } else {
      addRowCell(tr, color, document.createTextNode(''));
    }
    
    addRowCell(tr, color, document.createTextNode(post.author));

    if (!isDraft && post.htmlHref != null && post.htmlHref.length > 5) {
      var viewA = document.createElement('a');
      viewA.setAttribute('href', post.htmlHref);
      viewA.setAttribute('target', '_blank');
      viewA.appendChild(document.createTextNode('View'));      
      addRowCell(tr, color, viewA);
    } else if (!isDraft) {
      addRowCell(tr, color, document.createTextNode(''));
    } else {
      addRowCell(tr, color, document.createTextNode('(draft)'));
    }

    var viewA = document.createElement('a');
    viewA.setAttribute('href', 
        'javascript:prepareEditView(\'' + post.editHref + '\')');
    viewA.appendChild(document.createTextNode('Edit'));      
    addRowCell(tr, color, viewA);

    var viewA = document.createElement('a');
    viewA.setAttribute('href', 
        'javascript:deletePost(\'' + post.editHref + '\')');
    viewA.appendChild(document.createTextNode('Delete'));      
    addRowCell(tr, color, viewA);

    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  el(BP_ID.SHOWPOST_BLOCK).innerHTML = '';
  el(BP_ID.SHOWPOST_BLOCK).appendChild(table);
};

/**
 * Adds a TD to the given row with the given content node.
 * @param {Element} tr The row to append the created TD to.
 * @param {String} classname The name of the CSS class for this cell.
 * @param {Element} content The DOM node to append to the created TD.
 */
function addRowCell(tr, classname, content) {
  var td = document.createElement('td');
  td.className = classname;
  td.appendChild(content);
  tr.appendChild(td);
};

/*
 * Switches to create/edit/show posts view and mode.
 * @param {Number} viewNum Indicates which view to switch to.
 */
function switchView(viewNum) {
  el(BP_ID.SHOWPOST_TAB).style.backgroundColor = BP_COLOR.TAB_OFF;
  el(BP_ID.CREATEPOST_TAB).style.backgroundColor = BP_COLOR.TAB_OFF;
  el(BP_ID.ABOUT_TAB).style.backgroundColor = BP_COLOR.TAB_OFF;

  el(BP_ID.SHOWPOST_LINK).style.color = BP_COLOR.LINK_OFF;
  el(BP_ID.CREATEPOST_LINK).style.color = BP_COLOR.LINK_OFF;
  el(BP_ID.ABOUT_LINK).style.color = BP_COLOR.LINK_OFF;

  el(BP_ID.SHOWPOST_BLOCK).style.display = 'none';
  el(BP_ID.CREATEPOST_BLOCK).style.display = 'none';
  el(BP_ID.ABOUT_BLOCK).style.display = 'none';

  switch(viewNum) {
  case BP_VIEWMODE.SHOWPOSTS:
    el(BP_ID.SHOWPOST_TAB).style.backgroundColor = BP_COLOR.TAB_ON;
    el(BP_ID.SHOWPOST_LINK).style.color = BP_COLOR.LINK_ON;
    el(BP_ID.SHOWPOST_BLOCK).style.display = 'block';
    getPosts(); 
    break;
  case BP_VIEWMODE.CREATEPOST: 
    el(BP_ID.CREATEPOST_TAB).style.backgroundColor = BP_COLOR.TAB_ON;
    el(BP_ID.CREATEPOST_LINK).style.color = BP_COLOR.LINK_ON;
    el(BP_ID.CREATEPOST_BLOCK).style.display = 'block';
    el(BP_ID.FORM_EDITURI).value = '';
    el(BP_ID.FORM_HTMLHREF).value = '';
    el(BP_ID.FORM_TITLE).value = '';
    el(BP_ID.FORM_CONTENT).value = '';
    el(BP_ID.FORM_TAGS).value = '';
    el(BP_ID.DRAFT_BUTTON).style.visibility = 'visible';
    el(BP_ID.PUBLISH_BUTTON).value = 'Publish';
    break;
  case BP_VIEWMODE.EDITPOST:
    el(BP_ID.SHOWPOST_TAB).style.backgroundColor = BP_COLOR.TAB_ON;
    el(BP_ID.SHOWPOST_LINK).style.color = BP_COLOR.LINK_ON;
    el(BP_ID.CREATEPOST_BLOCK).style.display = 'block';
    break;
  case BP_VIEWMODE.ABOUT:
    el(BP_ID.ABOUT_TAB).style.backgroundColor = BP_COLOR.TAB_ON;
    el(BP_ID.ABOUT_LINK).style.color = BP_COLOR.LINK_ON;
    el(BP_ID.ABOUT_BLOCK).style.display = 'block';
    break; 
  }
};

/**
 * Short alias for document.getElementById.
 * @param {String} id The ID of the element.
 * @return {Element} The element found.
 */
function el(id) {
  return document.getElementById(id);
};

/**
 * Reads the contents of the blog post form and sends it to the Blogger
 * servers as either a new blog post or an update of an old one.
 * @param {Boolean} isDraft Indicates whether this post is a draft.
 */
function savePost(isDraft) {
  clearInterval(BlogPress.syncTimer);
  var id = saveLocalPost(isDraft);
  saveServerPost(id, true);
  switchView(BP_VIEWMODE.SHOWPOSTS);
  BlogPress.syncTimer = setInterval(syncLocal, BlogPress.TIMER_MS);
};

/**
 * Saves the information from the form into the database.
 * Either inserts a new row, or updates a row if this is an edit.
 * @param {Boolean} isDraft Indicates whether user wants to save as draft
 * @return {String} Returns identifier of the saved post.
 */
function saveLocalPost(isDraft) {
  changeStatus('Saving post to local database.');
  // Get the values from the form.
  var post = {};
  if (isDraft) {
    post.syncstate = BP_SYNCSTATE.MUST_SAVE_DRAFT;
  } else {
    el(BP_ID.DRAFT_BUTTON).style.visibility = 'hidden';
    post.syncstate = BP_SYNCSTATE.MUST_PUBLISH;
  }

  post.title = el(BP_ID.FORM_TITLE).value;
  post.content= el(BP_ID.FORM_CONTENT).value;
  post.tags = el(BP_ID.FORM_TAGS).value;
  post.editHref = el(BP_ID.FORM_EDITURI).value;
  post.id = el(BP_ID.FORM_ID).value;
  post.htmlHref = el(BP_ID.FORM_HTMLHREF).value;
  post.postHref = BlogPress.currentBlogPostHref;
 
  // If it's a new entry, insert a row.
  if (post.editHref == '') {
    // Make a random fake ID.
    var randUnrounded=Math.random()*999999999;
    var randNumber=Math.floor(randUnrounded);
    post.id = randNumber;
    BlogPress.db.insertRow('postentries', post);
  } else {
  // If it's an old entry, update the relevant row identify by editHref
    BlogPress.db.updateRow('postentries', post, 'editHref');
  }

  return post.id;
};

/**
 * Sends a query through the JS client lib to save a post to a server.
 * @param {String} id The identifier of the post in the database.
 * @param {Boolean} getPosts Indicates whether to retrieve blog feed when done.
 */
function saveServerPost(id, getPosts) {
  changeStatus('Attempting to save post through Blogger service.');
  var post = BlogPress.db.selectRow('postentries', 'id = \'' + id + '\'');
   
  // Create event object and set relevant properties.
  var blogPostEntry = new google.gdata.blogger.BlogPostEntry();
  blogPostEntry.setTitle(google.gdata.Text.create(post.title));
  blogPostEntry.setContent(google.gdata.Text.create(post.content, 'html'));
  var categoriesArray = post.tags.split(',');

  for (var c = 0; c < categoriesArray.length; c++) {
    if (categoriesArray[c] != '') {
      var category = new google.gdata.Category();
      category.setTerm(categoriesArray[c]);
      category.setScheme('http://www.blogger.com/atom/ns#');
      blogPostEntry.addCategory(category);
    }
  }
 
  if (post.syncstate == BP_SYNCSTATE.MUST_SAVE_DRAFT) {
    var draft = new google.gdata.Draft();
    draft.setValue(google.gdata.Draft.VALUE_YES);
    var control = new google.gdata.Control();
    control.setDraft(draft);
    blogPostEntry.setControl(control);
  }

  if (post.editHref != null && post.editHref.length > 5) { 
    // Editing existing post.
    downloadUrl(getRandomUrl(), function (responseText, status) {
      BlogPress.service.updateEntry(post.editHref, blogPostEntry, 
          function(entryRoot) {
            handleSavePost(entryRoot, id, getBlogs)}, 
          handleError);
    });
  } else {
    // Inserting a new post.
    downloadUrl(getRandomUrl(), function (responseText, status) {
        BlogPress.service.insertEntry(post.postHref, blogPostEntry,
          function (entryRoot) {
            handleSavePost(entryRoot, id, getBlogs, new Date());
          }, handleError);
   });
  } 
};

/**
 * The syncing function, called by a setInterval.
 * It iterates through the database looking for not-synced posts.
 * It deletes or saves them as appropriate, and tells the last 
 * action to retrieve the new post feed when finished.
 */
function syncLocal() {
  var posts = BlogPress.db.selectAll('select * from postentries ' +
      ' where syncstate <> ' + BP_SYNCSTATE.NOTHING_TO_DO);
  if (posts.length == 0) {
    return;
  }

  changeStatus("Attempting to sync " + posts.length + " posts.");
  for (var i = 0; i < posts.length; i++) {
    var post = posts[i];
    // Only get blogs if this is the last call, for efficiency.
    var getBlogs = (i == (posts.length -1)) ? true : false;
    switch (post.syncstate) {
      case BP_SYNCSTATE.MUST_DELETE:
      deleteServerPost(post.editHref, false);
      break;
      case BP_SYNCSTATE.MUST_SAVE_DRAFT:
      case BP_SYNCSTATE.MUST_PUBLISH:
      saveServerPost(post.id, false); 
      break;
    }
  } 
};

/**
 * Generates a filename consisting of a file that exists,
 * plus a random query string on the end. This is to make sure
 * that the file isn't being served from cache, as we ping this file
 * to see if we're actually online.
 * @return {String} The filename with random query appended
 */
function getRandomUrl() {
  var randUnrounded=Math.random()*999999999;
  var randNumber=Math.floor(randUnrounded);
  var randUrl = 'bloggears_ping.txt?time=' + randNumber;
  return randUrl;
}

/**
 * Deletes a post in the current blog feed.
 * @param {String} editHref The editHref of the post to delete.
 */
function deletePost(editHref) {
  deleteLocalPost(editHref);
  deleteServerPost(editHref, true);
};

/**
 * This function tells the local database that a post should be
 * marked for deletion, and then refreshes the post display.
 */
function deleteLocalPost(editHref) {
  changeStatus('Deleting post from local database.');
  // Mark locally as should be deleted.
  var post = {syncstate: BP_SYNCSTATE.MUST_DELETE, editHref: editHref};
  BlogPress.db.updateRow('postentries', post, 'editHref');
  getLocalPosts(BlogPress.currentBlogPostHref);
};

/**
 * This function sends a query through the JS client lib to delete
 * the entry specified by editHref.
 * @param {String} editHref The editHref of the post to delete.
 * @param {Boolean} getPosts Indicates whether to call getPosts when done.
 */
function deleteServerPost(editHref, getPosts) {
  changeStatus('Attempting to delete post through Blogger service.');
  // Try updating on server.
  downloadUrl(getRandomUrl(), function (responseText, status) {
    BlogPress.service.deleteEntry(editHref, function() {
      BlogPress.db.run('delete from postentries where editHref = \'' + 
          editHref + '\'');
      if (getPosts) {
        getServerPosts(BlogPress.currentBlogPostHref);
      }
    }, handleError);
  });
};

/**
 * Prepare to go into edit view by pre-filling the form
 * with the post details.
 * @param {Number} postNum The index of the post to edit.
 * @param {Boolean} isDraft Indicates whether post to edit is a draft.
 */
function prepareEditView(editHref) {
  var post = BlogPress.db.selectRow('postentries', 
      'editHref = \'' + editHref + '\'');
  var isDraft = (post.htmlHref == '') ? true : false;

  el(BP_ID.FORM_EDITURI).value = post.editHref;
  el(BP_ID.FORM_ID).value = post.id;
  el(BP_ID.FORM_HTMLHREF).value = post.htmlHref;
  el(BP_ID.FORM_TITLE).value = post.title;
  el(BP_ID.FORM_CONTENT).value = post.content;
  el(BP_ID.FORM_TAGS).value = post.tags;

  if (isDraft) {
    el(BP_ID.DRAFT_BUTTON).style.visibility = 'visible';
    el(BP_ID.PUBLISH_BUTTON).value = 'Publish';
  } else {
    el(BP_ID.DRAFT_BUTTON).style.visibility = 'hidden';
    el(BP_ID.PUBLISH_BUTTON).value = 'Re-publish';
  }

  switchView(BP_VIEWMODE.EDITPOST);
};

/**
 * This function is called if an error is encountered
 * while retrieving a feed, adding, editing or deleting an entry.
 * @param {Object} error
 */
function handleError(error) {
  var errorString = (error.cause ? error.cause.statusText : error.message);
  changeStatus('Error: ' + errorString);
};

/**
 * The callback function for a post save.
 * It updates the local DB to mark the saved entry as synced.
 * @param {Object} entryRoot A google.gdata.BlogEntry object.
 * @param {String} id The identifier of the saved post
 * @param {Boolean} getPosts Indicates whether to call getPosts after
 */
function handleSavePost(entryRoot, id, getPosts, date) {
  changeStatus('Saved post through Blogger service.');
  var blogPost = entryRoot.entry;

  var post = {};
  post.syncstate = BP_SYNCSTATE.NOTHING_TO_DO;
  post.id = id;
  post.title = blogPost.getTitle().getText();
  var updated = blogPost.getUpdated().getValue();
  post.date = google.gdata.DateTime.toIso8601(updated);
  post.editHref = blogPost.getEditLink().getHref();
  var categoriesArray = []
  for (var c = 0; c < blogPost.getCategories().length; c++) {
    categoriesArray.push(blogPost.getCategories()[c].getTerm());
  }
  post.tags = categoriesArray.join(', ');  
  BlogPress.db.updateRow('postentries', post, 'id'); 

  el(BP_ID.FORM_EDITURI).value = post.editHref;
 
  if (getPosts) {
    getServerPosts(BlogPress.currentBlogPostHref);
  }
};

/**
 * Logging function. To make it easy to change logging method.
 * @param {String} status Message to display
 */
function changeStatus(status) {
  el("statusDiv").innerHTML = status;
};


/**
 * Returns an XMLHttp instance to use for asynchronous
 * downloading. This method will never throw an exception, but will
 * return NULL if the browser does not support XmlHttp for any reason.
 * @return {XMLHttpRequest|Null}
*/
function createXmlHttpRequest() {
  try {
    if (typeof ActiveXObject != 'undefined') {
      return new ActiveXObject('Microsoft.XMLHTTP');
    } else if (window["XMLHttpRequest"]) {
      return new XMLHttpRequest();
    }
  } catch (e) {
    changeStatus(e);
  }
  return null;
};

/**
 * This functions wraps XMLHttpRequest open/send function.
 * It lets you specify a URL and will call the callback if 
 * it gets a status code of 200.
 * @param {String} url The URL to retrieve
 * @param {Function} callback The function to call once retrieved. 
 */
function downloadUrl(url, callback) {
  var status = -1;
  var request = createXmlHttpRequest();
  if (!request) {
    return false;
  }

  request.onreadystatechange = function() {
    if (request.readyState == 4) {
      try {
        status = request.status;
      } catch (e) {
        // Usually indicates request timed out in FF.
      }
      if (status == 200) {
        callback(request.responseText, request.status);
        request.onreadystatechange = function() {};
      }
    }
  }
  request.open('GET', url, true);
  try {
    request.send(null);
  } catch (e) {
    changeStatus(e);
  }
};
