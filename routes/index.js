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
		const [_, [event]] = await Event.update(req.body, {
			where: { id: req.params.id },
			returning: true,
		});

		await event.setStudents(req.body.Students);

		res.json(event);
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

		res.json(event);
		await transaction.commit();
	} catch (error) {
		await transaction.rollback();
		next(error);
	}
});

module.exports = router;
