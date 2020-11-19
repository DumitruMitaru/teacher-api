const { sequelize } = require('../models');
const {
	models: {
		Announcement,
		Event,
		Student,
		StudentsEvents,
		StudentsUploads,
		Upload,
		User,
	},
} = sequelize;
const { v4: uuidv4 } = require('uuid');

const auth = require('../middleware/auth');
const { uploadToS3, getUploadDataFromRequest } = require('../lib');

module.exports = router => {
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
				taggedStudents,
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

			await upload.setTaggedStudents(taggedStudents.map(({ id }) => id));

			res.status(200).json({
				...upload.get({ plain: true }),
				User: { email: user.email },
				taggedStudents,
			});
		} catch (error) {
			next(error);
		}
	});

	router.put('/upload/:id', auth, async (req, res, next) => {
		try {
			const {
				name,
				description,
				taggedStudents,
			} = await getUploadDataFromRequest(req);
			const [_, [upload]] = await Upload.update(
				{
					name,
					description,
				},
				{
					where: { id: req.params.id },
					returning: true,
				}
			);

			await upload.setTaggedStudents(taggedStudents.map(({ id }) => id));

			res.json({ ...upload.get({ plain: true }), taggedStudents });
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
							{
								model: Student,
								as: 'taggedStudents',
								attributes: ['id', 'firstName', 'lastName'],
								through: {
									model: StudentsUploads,
									attributes: [],
								},
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

	router.delete('/upload/:id', auth, async (req, res, next) => {
		try {
			await Upload.destroy({
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
