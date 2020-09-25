const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { sequelize } = require('../models');
const {
	models: { User, Student },
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

module.exports = router;
