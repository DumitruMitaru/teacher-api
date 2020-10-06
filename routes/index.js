const express = require('express');
const router = express.Router();
const { pick } = require('lodash');
const { sequelize } = require('../models');
const {
	models: { User, Student, Event, StudentsEvents },
} = sequelize;

const auth = require('../middleware/auth');

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

router.put('/student/:id', auth, async (req, res, next) => {
	try {
		const { firstName, lastName, phoneNumber, email } = req.body;
		const [_, [student]] = await Student.update(
			{
				firstName,
				lastName,
				email,
				phoneNumber,
			},
			{
				where: { id: req.params.id },
				returning: true,
			}
		);

		res.json(student);
	} catch (error) {
		next(error);
	}
});

router.put('/event/:id', auth, async (req, res, next) => {
	try {
		const [_, [event]] = await Event.update(
			pick(req.body, ['startDate', 'endDate', 'title']),
			{
				where: { id: req.params.id },
				returning: true,
			}
		);

		if (req.body.Students) {
			await event.setStudents(req.body.Students.map(({ id }) => id));
		}

		res.json({
			...event.get({ plain: true }),
			Students: req.body.Students,
		});
	} catch (error) {
		next(error);
	}
});

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

		await event.setStudents(req.body.Students, { transaction });

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
			req.body.map(async ({ title, startDate, endDate, Students }) => {
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
			})
		);

		await transaction.commit();
		res.json(events);
	} catch (error) {
		await transaction.rollback();
		next(error);
	}
});

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

module.exports = router;
