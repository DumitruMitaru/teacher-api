const { pick } = require('lodash');
const { sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');

const twilio = require('twilio')(
	process.env.TWILIO_ACCOUNT_SID,
	process.env.TWILIO_AUTH_TOKEN
);

const { uploadToS3, getUploadDataFromRequest } = require('../lib');

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

	router.post('/upload', auth, async (req, res, next) => {
		try {
			let user = await User.findOne({
				where: { auth0Id: req.user.sub },
			});

			const {
				buffer,
				type,
				subType,
				name,
				description,
			} = await getUploadDataFromRequest(req);

			if (!['video', 'image', 'audio'].includes(type)) {
				throw new Error(
					'Please only select video, image or audio files.'
				);
			}

			const { Location: url } = await uploadToS3(
				uuidv4(),
				buffer,
				type,
				subType
			);

			const upload = await Upload.create({
				UserId: user.id,
				name,
				description,
				url,
				type,
				subType,
			});

			res.status(200).json({
				...upload.get({ plain: true }),
				User: { email: user.email },
			});
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
		let transaction = await sequelize.transaction();

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
				transaction,
			});

			await Promise.all(
				user.Students.map(({ phoneNumber }) =>
					twilio.messages.create({
						body:
							user.Announcements[0].text +
							`\n\nThis message was sent from ${req.user.email}. Please do not reply to this message.`,
						from: process.env.TWILIO_PHONE,
						to: phoneNumber,
					})
				)
			);

			await transaction.commit();
			res.json({ sucess: true });
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
