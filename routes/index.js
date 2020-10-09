const express = require('express');
let router = express.Router();
const { flow } = require('lodash');
const { sequelize } = require('../models');
const {
	models: { User, Student, Event, StudentsEvents },
} = sequelize;

const auth = require('../middleware/auth');

const getRoutes = require('./GET');
const postRoutes = require('./POST');
const putRoutes = require('./PUT');
const deleteRoutes = require('./DELETE');

module.exports = flow([getRoutes, postRoutes, putRoutes, deleteRoutes])(router);
