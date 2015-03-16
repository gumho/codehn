var HomeView = Backbone.View.extend({
  el: '#root',

  maxStories: 30,

  render: function() {
    var self = this;
    var deferred = $.getJSON('https://hacker-news.firebaseio.com/v0/topstories.json');
    $.when(deferred).then(function(data) {
      var requests = [];
      $.each(data.slice(0, self.maxStories), function(i, id) {
        var d = $.getJSON('https://hacker-news.firebaseio.com/v0/item/' + id + '.json', function(dt) {
          self.$el.append(storyTmpl(dt));
        })
        requests.push(d);
      });
      $.when.apply($, requests).then(function() {
        hljs.highlightBlock(self.$el[0]);
      })
    });
  }
});

var StoryView = Backbone.View.extend({
  el: '#root',

  events: {
    'click .expand': 'expandChildComments'
  },

  expandChildComments: function(ev) {
    var self = this;
    var commentEl = $(ev.currentTarget).closest('.comment');

    // If child comments were already loaded, click event functions as a
    // show/hide toggle
    if(commentEl.find('ul').length > 0) {
      commentEl.find('ul').toggle();
      return;
    }

    commentEl.append('<ul></ul>');

    var id = commentEl.data('id');
    $.getJSON('https://hacker-news.firebaseio.com/v0/item/' + id + '.json', function(data) {
      $.each(data.kids, function(i, commentId) {
        $.getJSON('https://hacker-news.firebaseio.com/v0/item/' + commentId + '.json', function(dt) {
          var tmpl = $(commentTmpl(dt));
          hljs.highlightBlock(tmpl[0]);
          commentEl.find('ul').append(tmpl);
        });
      });
    });
  },

  render: function(storyId) {
    var self = this;

    var deferred = $.getJSON('https://hacker-news.firebaseio.com/v0/item/' + storyId + '.json');
    $.when(deferred).then(function(data) {
      self.$el.append(storyTmpl(data));

      var requests = [];
      $.each(data.kids.slice(0, self.maxComments), function(i, commentId) {
        var d = $.getJSON('https://hacker-news.firebaseio.com/v0/item/' + commentId + '.json', function(dt) {
          self.$el.append(commentTmpl(dt));
        });
        requests.push(d)
      });

      $.when.apply($, requests).then(function() {
        hljs.highlightBlock(self.$el[0]);
      });
    });
  }
});

var AppView = Backbone.View.extend({
  el: $('#app'),

  initialize: function() {
    Handlebars.registerHelper('timeago', function(timestamp) {
      return moment(timestamp, 'X').fromNow();
    });

    Handlebars.registerHelper('htmlize', function(text) {
      return $("<div/>").html(text).text();
    });
  },
  render: function(storyId) {
    this.$el.html(
      '<ul id="root">' + 
        '<li><pre>#!/usr/bin/env python</pre></li>' + 
        '<li><pre>from python_hn import <a href="#">home</a>\n\n\n</pre></li>' +
      '</ul>')
  }
});

var storyTmpl = Handlebars.compile($("#story-template").html());
var commentTmpl = Handlebars.compile($("#comment-template").html());

var AppRouter = Backbone.Router.extend({
  routes: {
    '': 'home',
    'story/:id': 'story'
  },

  home: function() {
    (new AppView()).render();
    (new HomeView()).render();
  },

  story: function(storyId) {
    (new AppView).render();
    (new StoryView).render(storyId);
  }
});

var router = new AppRouter;
Backbone.history.start();
