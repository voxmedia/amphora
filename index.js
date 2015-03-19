// this will set up things
'use strict';

var express = require('express'),
  _ = require('lodash'),
  vhost = require('vhost'),
  config = require('config'),
  siteService = require('./services/sites'),
  sitesMap = siteService.sites(),
  siteHosts = siteService.hosts(),
  sitesFolder = siteService.sitesFolder,
  composer = require('./services/composer'),
  app = express();

/**
 * add site.slug to locals for each site
 * @param {string} slug
 */
function addSiteLocals(slug) {
  return function (req, res, next) {
    res.locals.site = slug;
    next();
  };
}

/**
 * syntactical sugar to quickly add routes that point directly to a layout
 * @param {string} route  e.g. '/users/:id'
 * @param {string} layout e.g. 'user-page'
 * note: all params will automatically be added to res.locals
 */
function setLayout(route, layout) {
  this.get(route, function (req, res, next) { // jshint ignore:line
    res.locals = req.params; // add all params
    res.locals.layout = layout; // add layout
    next();
  });
}

module.exports = function () {
  // iterate through the hosts
  _.map(siteHosts, function (host) {
    let sitesOnThisHost = _.filter(sitesMap, { host: host }).sort(function (a, b) {
        // sort by the depth of the path, so we can have domain.com/ and domain.com/foo/ as two separate sites
        return a.path.split('/').length - b.path.split('/').length;
      }),
      hostMiddleware = express.Router(),
      envHost = config.get('hosts')[host]; // get the "host" for the current env, e.g. localhost

    // iterate through the sites on this host, add routers
    _.map(sitesOnThisHost, function (site) {
      let siteController = sitesFolder + site.slug,
        siteRouter = express.Router();

      // add support for site.setLayout sugar
      siteRouter.setLayout = setLayout;

      // add the routes for that site's path
      hostMiddleware.use(site.path, require(siteController)(siteRouter));
      // add res.locals.site (slug) to every request
      hostMiddleware.use(site.path, addSiteLocals(site.slug));
    });

    // once all sites are added, wrap them in a vhost
    app.use(vhost(envHost, hostMiddleware));
  });

  // point the renderer towards the layouts folder
  app.set('views', 'layouts/');

  // pass all route handlers into the composer
  app.use(composer);

  return app;
};