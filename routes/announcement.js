const { sequelize } = require('../models');
const { pick } = require('lodash');
const {
	models: { User, Student, Event, StudentsEvents, Announcement, Upload },
} = sequelize;

const auth = require('../middleware/auth');
const { sendText } = require('../lib');

module.exports = router => {
	router.post('/announcement', auth, async (req, res, next) => {
		let transaction = await sequelize.transaction();

		try {
			let user = await User.findOne({
				where: { auth0Id: req.user.sub },
				transaction,
			});

			const annoucement = await Announcement.create(
				{
					...pick(req.body, 'text'),
					UserId: user.id,
				},
				{ transaction }
			);

			await transaction.commit();
			res.json(annoucement);
		} catch (error) {
			await transaction.rollback();
			next(error);
		}
	});

	router.post('/announcement/:id/send', auth, async (req, res, next) => {
		try {
			let user = await User.findOne({
				where: { auth0Id: req.user.sub },
				include: [
					{
						model: Student,
						attributes: ['id', 'phoneNumber'],
						where: {
							id: req.body,
						},
					},
					{
						model: Announcement,
						where: {
							id: req.params.id,
						},
					},
				],
			});

			await Promise.all(
				user.Students.map(({ phoneNumber }) =>
					sendText(
						phoneNumber,
						user.Announcements[0].text +
							`\n\nThis message was sent from ${req.user.email}. Please do not reply to this message.`
					)
				)
			);

			res.status(200).send();
		} catch (error) {
			next(error);
		}
	});

	router.put('/announcement/:id', auth, async (req, res, next) => {
		try {
			const [_, [announcement]] = await Announcement.update(
				{
					text: req.body.text,
				},
				{
					where: { id: req.params.id },
					returning: true,
				}
			);

			res.json(announcement);
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

	return router;
};
