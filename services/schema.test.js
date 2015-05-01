'use strict';

var _ = require('lodash'),
  filename = _.startCase(__filename.split('/').pop().split('.').shift()),
  schema = require('./schema'),
  db = require('./db'),
  expect = require('chai').expect,
  sinon = require('sinon'),
  bluebird = require('bluebird');

describe(filename, function () {
  var sandbox;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('read basic schema', function () {
    var textSchema = schema.getSchema('test/fixtures/text');

    expect(textSchema).to.deep.equal({
      name: {
        _type: 'text',
        _required: true
      },
      areas: {
        body: {
          _type: 'component-list'
        }
      }
    });
  });
});