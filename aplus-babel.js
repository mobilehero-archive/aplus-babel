"use strict";
/***
 *                          __     _  __       __                     
 *       ____ ___   ____   / /_   (_)/ /___   / /_   ___   _____ ____ 
 *      / __ `__ \ / __ \ / __ \ / // // _ \ / __ \ / _ \ / ___// __ \ 
 *     / / / / / // /_/ // /_/ // // //  __// / / //  __// /   / /_/ / 
 *    /_/ /_/ /_/ \____//_.___//_//_/ \___//_/ /_/ \___//_/    \____/ 
 *                                                                    
 *                  mobile solutions for everyday heroes
 *                                                                    
 * @file 
 * Alloy+ plugin for running babel transformations on your Appcelerator code
 * 
 * @module 
 * @aplus/babel
 * 
 * @author 
 * Brenton House <brenton.house@gmail.com>
 * 
 * @copyright
 * Copyright (c) 2016 by Superhero Studios Incorporated.  All Rights Reserved.
 *      
 * @license
 * Licensed under the terms of the MIT License (MIT)
 * Please see the LICENSE.md included with this distribution for details.
 * 
 */

var path = require('path');
var fs = require('fs');
var wrench = require('wrench');
var _ = require('lodash');
var logger;
var babel = require('babel-core');
var minimatch = require('minimatch');

/**
 * Run babel tranformations on Alloy source code
 * 
 * @param {object} params
 */
function plugin(params) {

	logger = params.logger;
	params.dirname = params.dirname ? _.template(params.dirname)(params) : params.event.dir.resourcesPlatform;

	logger.trace("running babel in directory: " + params.dirname);

	_.defaults(params, {
		options: {},
		includes: ["**/*.js", "!backbone.js"]
	});

	var babelOptions = params.options;
	// logger.trace(JSON.stringify(params, null, 2));

	if (params.code) {
		params.code = translateCode(params.code, babelOptions);
	} else {
		var files = findFiles(params.dirname, params.includes);
		_.forEach(files, function(file) {
			translateFile(path.join(params.dirname, file), babelOptions);
		});
	}
}


/**
 * Replace backslashes for cross-platform usage
 * 
 * @param str Input to be modified
 * @returns Modified string
 */
function replaceBackSlashes(str) {
	var isExtendedLengthPath = /^\\\\\?\\/.test(str);
	var hasNonAscii = /[^\x00-\x80]+/.test(str);

	if (isExtendedLengthPath || hasNonAscii) {
		return str;
	}

	return str.replace(/\\/g, '/');
};


/**
 * Find all files that match extension criteria
 * 
 * @param extensions (array of extensions)
 * @returns (bool)
 */
function findFiles(rootpath, patterns) {
	logger.trace("inside findFiles()");
	var patterns = patterns || ['**'];
	var files = _.map(wrench.readdirSyncRecursive(rootpath), function(filename) {
		return path.posix.sep + replaceBackSlashes(filename);
	});
	var matchedFiles = match(files, patterns, {
		nocase: true,
		matchBase: true,
		dot: true,
	});
	return _.filter(matchedFiles, function(file) {
		return !fs.statSync(path.join(rootpath, file)).isDirectory();
	}) || [];

};

// Adapted from https://github.com/sindresorhus/multimatch
function match(list, patterns, options) {
	list = list || [];
	patterns = patterns || [];

	if (list.length === 0 || patterns.length === 0) {
		return [];
	}

	options = options || {};
	return patterns.reduce(function(ret, pattern) {
		var process = _.union
		if (pattern[0] === '!') {
			pattern = pattern.slice(1);
			process = _.difference;
		}
		return process(ret, minimatch.match(list, pattern, options));
	}, []);
};



function translateFile(filepath, babelConfig) {
	logger.trace("translating file - " + filepath);
	var content = fs.readFileSync(filepath, 'utf8');
	// var result = babel.transform(content, {
	// 	presets: ['es2015']
	// });

	var result = translateCode(content, babelConfig);
	fs.writeFileSync(filepath, result);
}

function translateCode(code, babelConfig) {
	var result = babel.transform(code, babelConfig);
	var modified = result.code;
	return modified;
}

module.exports.execute = plugin;
module.exports.tasks = [{
	"module": module.id,
	"options": {
		"presets": [
			"es2015"
		]
	},
	"includes": ["**/*.js", "!backbone2.js"],
	"events": ["preload", "preparse"]
}]