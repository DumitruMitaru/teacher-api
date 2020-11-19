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
