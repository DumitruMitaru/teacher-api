const { pick } = require('lodash');
const { sequelize } = require('../models');
const {
	models: { User, Student, Event, StudentsEvents, Announcement, Upload },
} = sequelize;

const auth = require('../middleware/auth');

module.exports = router => {
	router.post('/student', auth, async (req, res, next) => {
		try {
			let user = await User.findOne({
				where: { auth0Id: req.user.sub },
			});

			const student = await Student.create({
				...pick(req.body, [
					'firstName',
					'lastName',
					'email',
					'phoneNumber',
					'paymentAmount',
					'paymentInterval',
				]),
				UserId: user.id,
			});

			res.json(student);
		} catch (error) {
			next(error);
		}
	});

	router.put('/student/:id', auth, async (req, res, next) => {
		try {
			const [_, [student]] = await Student.update(
				pick(req.body, [
					'firstName',
					'lastName',
					'email',
					'phoneNumber',
					'paymentAmount',
					'paymentInterval',
				]),
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
