const express = require('express');
const router = express.Router();
const { pick } = require('lodash');
const { sequelize } = require('../models');
const {
	models: { User, Student, Event, StudentsEvents, Announcement },
} = sequelize;

const auth = require('../middleware/auth');

module.exports = router => {
	router.delete('/event/bulk', auth, async (req, res, next) => {
		try {
			await Event.destroy({
				where: {
					id: req.body,
				},
			});

			res.status(200).send();
		} catch (error) {
			next(error);
		}
	});

	router.delete('/event/:id', auth, async (req, res, next) => {
		try {
			await Event.destroy({
				where: {
					id: req.params.id,
				},
			});

			res.status(200).send();
		} catch (error) {
			next(error);
		}
	});

	router.delete('/announcement/:id', auth, async (req, res, next) => {
		try {
			await Announcement.destroy({
				where: {
					id: req.params.id,
				},
			});

			res.status(200).send();
		} catch (error) {
			next(error);
		}
	});

	router.delete('/student/:id', auth, async (req, res, next) => {
		try {
			await Student.destroy({
				where: {
					id: req.params.id,
				},
			});

			res.status(200).send();
		} catch (error) {
			next(error);
		}
	});

	return router;
};
