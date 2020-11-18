const express = require('express');
const router = express.Router();
const { pick } = require('lodash');
const { sequelize } = require('../models');
const {
	models: {
		Announcement,
		Event,
		PracticeNote,
		Student,
		StudentsEvents,
		User,
		Upload,
	},
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

	router.get('/upload', auth, async (req, res, next) => {
		try {
			let user = await User.findOne({
				where: { auth0Id: req.user.sub },
				include: [
					{
						model: Upload,
						include: [
							{
								model: User,
								attributes: ['email'],
							},
							{
								model: Student,
								attributes: ['firstName', 'lastName'],
							},
						],
					},
				],
				order: [[Upload, 'createdAt', 'DESC']],
			});

			res.json(user?.Uploads || []);
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
						include: [
							{
								model: Student,
								attributes: ['firstName', 'lastName'],
							},
						],
					},
					{
						model: PracticeNote,
					},
					{
						model: User,
						include: [
							{
								model: Announcement,
								attributes: ['text', 'createdAt'],
								limit: 4,
								order: [['createdAt', 'DESC']],
							},
						],
					},
				],
				order: [[PracticeNote, 'createdAt', 'ASC']],
			});

			student = student.get({ plain: true });
			student.Announcements = student.User.Announcements;
			delete student.User.Announcements;

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

	router.get('/announcement', auth, async (req, res, next) => {
		try {
			let user = await User.findOne({
				where: { auth0Id: req.user.sub },
				include: [
					{
						model: Announcement,
					},
				],
				order: [[Announcement, 'createdAt', 'desc']],
			});

			res.json(user?.Announcements || []);
		} catch (error) {
			next(error);
		}
	});

	return router;
};
