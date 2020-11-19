const express = require('express');
let router = express.Router();
const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);
const { flow } = require('lodash');

const routeDecorators = fs
	.readdirSync(__dirname)
	.filter(file => {
		return (
			file.indexOf('.') !== 0 &&
			file !== basename &&
			file.slice(-3) === '.js'
		);
	})
	.map(file => {
		return require(path.join(__dirname, file));
	});

module.exports = flow(routeDecorators)(router);
