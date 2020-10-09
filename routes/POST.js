const express = require('express');
const router = express.Router();
const { pick } = require('lodash');
const { sequelize } = require('../models');
const {
	models: { User, Student, Event, StudentsEvents, PracticeNote },
} = sequelize;

const auth = require('../middleware/auth');

module.exports = router => {
	router.post('/student', auth, async (req, res, next) => {
		try {
			let user = await User.findOne({
				where: { auth0Id: req.user.sub },
			});

			const { firstName, lastName, phoneNumber, email } = req.body;
			const student = await Student.create({
				firstName,
				lastName,
				email,
				phoneNumber,
				UserId: user.id,
			});

			res.json(student);
		} catch (error) {
			next(error);
		}
	});

	router.post('/practice-note', auth, async (req, res, next) => {
		try {
			const note = await PracticeNote.create(req.body);

			res.json(note);
		} catch (error) {
			next(error);
		}
	});

	router.post('/event', auth, async (req, res, next) => {
		let transaction = await sequelize.transaction();

		try {
			let user = await User.findOne({
				where: { auth0Id: req.user.sub },
				transaction,
			});

			const event = await Event.create(
				{
					...req.body,
					UserId: user.id,
				},
				{ transaction }
			);

			await event.setStudents(
				req.body.Students.map(({ id }) => id),
				{ transaction }
			);

			await transaction.commit();
			res.json({
				...event.get({ plain: true }),
				Students: req.body.Students,
			});
		} catch (error) {
			await transaction.rollback();
			next(error);
		}
	});

	router.post('/event/copy', auth, async (req, res, next) => {
		let transaction = await sequelize.transaction();

		try {
			let user = await User.findOne({
				where: { auth0Id: req.user.sub },
				transaction,
			});

			const events = await Promise.all(
				req.body.map(
					async ({ title, startDate, endDate, Students }) => {
						const event = await Event.create(
							{
								title,
								startDate,
								endDate,
								UserId: user.id,
							},
							{ transaction }
						);

						await event.setStudents(
							Students.map(({ id }) => id),
							{ transaction }
						);

						return { ...event.get({ plain: true }), Students };
					}
				)
			);

			await transaction.commit();
			res.json(events);
		} catch (error) {
			await transaction.rollback();
			next(error);
		}
	});

	return router;
};
