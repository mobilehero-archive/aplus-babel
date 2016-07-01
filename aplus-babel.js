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

/**
 * Run babel tranformations on Alloy source code
 * 
 * @param {object} params
 */
function plugin(params) {

	logger = params.logger;
	params.dirname = params.dirname || params.event.dir.lib;
	params.dirname = params.dirname ? _.template(params.dirname)(params) : params.event.dir.lib;

	logger.trace("running babel in directory: " + params.dirname);

	var babelConfig = params.config.babel || {};

	var files = findFiles(dirname);
	_.forEach(files, function(file) {
		translateFile(path.join(rootpath, file));
	});

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
function findFiles(rootpath, extensions) {
	logger.trace("inside findFiles()");
	var extensions = extensions || ['js'];
	var regex = new RegExp('^.+\.(' + extensions.join('|') + ')$');

	var files = _.map(wrench.readdirSyncRecursive(rootpath), function(filename) {
		return path.posix.sep + replaceBackSlashes(filename);
	});
	return _.filter(files, function(file) {
		return regex.test(file) && !fs.statSync(path.join(rootpath, file)).isDirectory();
	}) || [];
};


function translateFile(filepath, babelConfig) {
	logger.trace("translateFile():  translating file - " + filepath);
	var content = fs.readFileSync(filepath, 'utf8');
	// var result = babel.transform(content, {
	// 	presets: ['es2015']
	// });
	var result = babel.transform(content, babelConfig);
	var modified = result.code;
	fs.writeFileSync(filepath, modified);
}

module.exports = plugin;