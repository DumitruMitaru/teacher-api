const { sequelize } = require('../models');
const { pick } = require('lodash');
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
const {
	deleteFromS3,
	getSignedUrlForS3,
	getUploadDataFromRequest,
	uploadToS3,
} = require('../lib');

module.exports = router => {
	router.post('/upload', auth, async (req, res, next) => {
		try {
			let user = await User.findOne({
				where: { auth0Id: req.user.sub },
			});

			const taggedStudents = req.body.taggedStudents;
			const upload = await Upload.create({
				UserId: user.id,
				...pick(req.body, [
					'name',
					'description',
					'url',
					'type',
					'subType',
				]),
			});

			await upload.setTaggedStudents(taggedStudents.map(({ id }) => id));

			res.json({
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
			const taggedStudents = req.body.taggedStudents;

			const [_, [upload]] = await Upload.update(
				pick(req.body, ['name', 'description']),
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

	router.get('/upload/signed-url', auth, async (req, res, next) => {
		try {
			const data = await getSignedUrlForS3(req.query.fileType);

			res.json(data);
		} catch (error) {
			next(error);
		}
	});

	router.delete('/upload/:id', auth, async (req, res, next) => {
		try {
			const upload = await Upload.findByPk(req.params.id, {
				include: [
					{
						model: User,
						where: {
							auth0Id: req.user.sub,
						},
						required: true,
					},
				],
			});

			if (!upload) {
				throw new Error('File not found');
			}

			const fileName = upload.url.split('/').pop();

			await deleteFromS3(fileName);

			await upload.destroy();

			res.status(200).send();
		} catch (error) {
			next(error);
		}
	});

	return router;
};
