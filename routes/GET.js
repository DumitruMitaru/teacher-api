const express = require('express');
const router = express.Router();
const { pick } = require('lodash');
const { sequelize } = require('../models');
const {
	models: { User, Student, Event, StudentsEvents, PracticeNote },
} = sequelize;

const auth = require('../middleware/auth');

module.exports = router => {
	router.get('/user', auth, async (req, res, next) => {
		try {
			let user = await User.findOne({ where: { auth0Id: req.user.sub } });

			if (!user) {
				user = await User.create({
					auth0Id: req.user.sub,
					email: req.user.email,
				});
			}

			res.json(user);
		} catch (error) {
			next(error);
		}
	});

	router.get('/student', auth, async (req, res, next) => {
		try {
			let user = await User.findOne({
				where: { auth0Id: req.user.sub },
				include: [
					{
						model: Student,
					},
				],
				order: [[Student, 'firstName', 'ASC']],
			});

			res.json(user?.Students || []);
		} catch (error) {
			next(error);
		}
	});

	router.get('/student/:publicProfileId', async (req, res, next) => {
		try {
			let student = await Student.findOne({
				where: {
					publicProfileId: req.params.publicProfileId,
				},
				attributes: ['id', 'firstName', 'lastName'],
				include: [
					{
						model: Event,
						through: {
							model: StudentsEvents,
							attributes: [],
						},
					},
					{
						model: PracticeNote,
					},
				],
				order: [[PracticeNote, 'createdAt', 'ASC']],
			});

			res.json(student);
		} catch (error) {
			next(error);
		}
	});

	router.get('/event', auth, async (req, res, next) => {
		try {
			let user = await User.findOne({
				where: { auth0Id: req.user.sub },
				include: [
					{
						model: Event,
						include: [
							{
								model: Student,
								attributes: ['id', 'firstName', 'lastName'],
								through: {
									model: StudentsEvents,
									attributes: [],
								},
							},
						],
					},
				],
			});

			res.json(user?.Events || []);
		} catch (error) {
			next(error);
		}
	});

	return router;
};
