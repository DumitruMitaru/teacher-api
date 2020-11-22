const {
	deleteFromS3,
	getUploadDataFromRequest,
	getSignedUrlForS3,
} = require('../lib');
const { sequelize } = require('../models');
const { pick, uniqBy } = require('lodash');
const {
	models: {
		User,
		Student,
		Event,
		StudentsEvents,
		StudentsUploads,
		Announcement,
		Upload,
		PracticeNote,
	},
} = sequelize;

module.exports = router => {
	router.get(
		'/public/student/:publicProfileId/profile',
		async (req, res, next) => {
			try {
				let student = await Student.findOne({
					where: {
						publicProfileId: req.params.publicProfileId,
					},
					attributes: ['id', 'firstName', 'lastName'],
					include: [
						{
							model: Event,
							through: {
								model: StudentsEvents,
								attributes: [],
							},
							include: [
								{
									model: Student,
									attributes: ['firstName', 'lastName'],
								},
							],
						},
						{
							model: PracticeNote,
						},
						{
							model: User,
							attributes: ['id'],
							include: [
								{
									model: Announcement,
									attributes: ['text', 'createdAt'],
									limit: 4,
									order: [['createdAt', 'DESC']],
								},
							],
						},
						{
							model: Upload,
							include: [
								{
									model: User,
									attributes: ['email'],
								},
								{
									model: Student,
									attributes: ['id', 'firstName', 'lastName'],
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
					order: [[PracticeNote, 'createdAt', 'ASC']],
				});

				if (!student) {
					throw new error('Student not found');
				}

				let taggedUploads = await student.getTaggedUploads({
					include: [
						{
							model: User,
							attributes: ['email'],
						},
						{
							model: Student,
							attributes: ['id', 'firstName', 'lastName'],
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
				});

				student = student.get({ plain: true });
				taggedUploads = taggedUploads.map(upload =>
					upload.get({ plain: true })
				);

				student.Uploads = uniqBy(
					[...student.Uploads, ...taggedUploads],
					'id'
				).sort((a, b) => b.createdAt - a.createdAt);
				student.Announcements = student.User.Announcements;
				delete student.User.Announcements;

				res.json(student);
			} catch (error) {
				next(error);
			}
		}
	);

	router.get('/public/student/:publicProfileId', async (req, res, next) => {
		try {
			let student = await Student.findOne({
				where: {
					publicProfileId: req.params.publicProfileId,
				},
				attributes: ['id'],
				include: [
					{
						model: User,
						attributes: ['id'],
						include: [
							{
								model: Student,
								attributes: ['id', 'firstName', 'lastName'],
							},
						],
					},
				],
				order: [[User, Student, 'firstName', 'ASC']],
			});

			if (!student) {
				throw new error('Student not found');
			}

			res.json(student.User.Students);
		} catch (error) {
			next(error);
		}
	});

	router.get(
		'/public/upload/signed-url/:publicProfileId',
		async (req, res, next) => {
			try {
				let student = await Student.findOne({
					where: { publicProfileId: req.params.publicProfileId },
				});

				if (!student) {
					throw new Error('Student not found');
				}

				const data = await getSignedUrlForS3(req.query.fileType);

				res.json(data);
			} catch (error) {
				next(error);
			}
		}
	);

	router.post('/public/upload/:publicProfileId', async (req, res, next) => {
		try {
			let student = await Student.findOne({
				attributes: ['id', 'firstName', 'lastName'],
				where: { publicProfileId: req.params.publicProfileId },
				include: [
					{
						model: User,
					},
				],
			});

			if (!student) {
				throw new Error('Student not found');
			}

			const taggedStudents = req.body.taggedStudents;
			const upload = await Upload.create({
				UserId: student.User.id,
				StudentId: student.id,
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
				User: { email: student.User.email },
				Student: student,
				taggedStudents,
			});
		} catch (error) {
			next(error);
		}
	});

	router.put(
		'/public/:publicProfileId/upload/:id',
		async (req, res, next) => {
			try {
				const student = await Student.findOne({
					where: {
						publicProfileId: req.params.publicProfileId,
					},
					include: [
						{
							model: Upload,
							where: {
								id: req.params.id,
							},
						},
					],
				});

				if (!student) {
					throw new Error('Student not found');
				}

				if (student.Uploads.length === 0) {
					throw new Error('Upload not found');
				}

				const taggedStudents = req.body.taggedStudents;

				const [_, [upload]] = await Upload.update(
					pick(req.body, ['name', 'description']),
					{
						where: { id: req.params.id },
						returning: true,
					}
				);

				await upload.setTaggedStudents(
					taggedStudents.map(({ id }) => id)
				);

				res.json({ ...upload.get({ plain: true }), taggedStudents });
			} catch (error) {
				next(error);
			}
		}
	);

	router.delete(
		'/public/:publicProfileId/upload/:id',
		async (req, res, next) => {
			try {
				const student = await Student.findOne({
					where: {
						publicProfileId: req.params.publicProfileId,
					},
					include: [
						{
							model: Upload,
							where: {
								id: req.params.id,
							},
						},
					],
				});
				const [upload] = student.Uploads;

				if (!student) {
					throw new Error('Student not found');
				}

				if (!upload) {
					throw new Error('File not found');
				}

				await deleteFromS3(upload.url);

				await upload.destroy();

				res.status(200).send();
			} catch (error) {
				next(error);
			}
		}
	);

	return router;
};
