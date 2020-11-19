const { uploadToS3, getUploadDataFromRequest } = require('../lib');
const { v4: uuidv4 } = require('uuid');
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

	router.post('/public/upload/:publicProfileId', async (req, res, next) => {
		try {
			let student = await Student.findOne({
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
				UserId: student.User.id,
				StudentId: student.id,
				name,
				description,
				url,
				type,
				subType,
			});

			await upload.setTaggedStudents(taggedStudents.map(({ id }) => id));

			res.status(200).json({
				...upload.get({ plain: true }),
				User: { email: student.User.email },
				Student: pick(student, ['id', 'firstName', 'lastName']),
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

				if (!student) {
					throw new Error('Student not found');
				}

				if (student.Uploads.length === 0) {
					throw new Error('Upload not found');
				}

				await Upload.destroy({
					where: {
						id: req.params.id,
					},
				});

				res.status(200).send();
			} catch (error) {
				next(error);
			}
		}
	);

	return router;
};
