const { pick, uniqBy } = require('lodash');
const { sequelize } = require('../models');
const {
	models: {
		Announcement,
		Comment,
		Event,
		PracticeNote,
		Student,
		StudentsEvents,
		StudentsUploads,
		Upload,
		User,
	},
} = sequelize;

const { deleteFromS3, getSignedUrlForS3, sendText } = require('../lib');

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
								{
									model: Comment,
									attributes: ['text'],
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

	router.get(
		'/public/:publicProfileId/upload/:id/comments',
		async (req, res, next) => {
			try {
				let student = await Student.findOne({
					where: {
						publicProfileId: req.params.publicProfileId,
					},
				});

				if (!student) {
					throw new error('Student not found');
				}

				const upload = await Upload.findByPk(req.params.id, {
					include: [
						{
							model: Comment,
							include: [
								{
									model: User,
									attributes: ['email'],
								},
								{
									model: Student,
									attributes: ['firstName'],
								},
							],
						},
					],
				});

				res.json(upload.Comments);
			} catch (error) {
				next(error);
			}
		}
	);

	router.post('/public/:publicProfileId/upload', async (req, res, next) => {
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

			const { uploadNotifications, phoneNumber } = student.User;
			if (uploadNotifications && phoneNumber) {
				await sendText(
					phoneNumber,
					`${student.firstName} uploaded a new file named ${upload.name}!!`
				);
			}
		} catch (error) {
			next(error);
		}
	});

	router.post('/public/:publicProfileId/comment', async (req, res, next) => {
		try {
			let student = await Student.findOne({
				where: {
					publicProfileId: req.params.publicProfileId,
				},
				include: [
					{
						model: User,
						attributes: ['id', 'email'],
					},
				],
			});

			if (!student) {
				throw new error('Student not found');
			}

			const comment = await Comment.create({
				...req.body,
				StudentId: student.id,
				UserId: student.User.id,
			});

			res.json({
				...comment.get({ plain: true }),
				Student: pick(student, ['firstName']),
				User: pick(student.User, ['email']),
			});
		} catch (error) {
			next(error);
		}
	});

	router.put(
		'/public/:publicProfileId/comment/:id',
		async (req, res, next) => {
			try {
				const student = await Student.findOne({
					where: {
						publicProfileId: req.params.publicProfileId,
					},
					include: [
						{
							model: Comment,
							where: {
								id: req.params.id,
							},
						},
					],
				});

				if (!student) {
					throw new Error('Student not found');
				}

				if (student.Comments.length === 0) {
					throw new Error('Comment not found');
				}

				const [comment] = student.Comments;

				comment.text = req.body.text;

				await comment.save();
				res.json(comment);
			} catch (error) {
				next(error);
			}
		}
	);

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
