const express = require('express');
const router = express.Router();
const { pick } = require('lodash');
const { sequelize } = require('../models');
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
const { getUploadDataFromRequest } = require('../lib');

module.exports = router => {
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

	router.put('/practice-note/:id', auth, async (req, res, next) => {
		try {
			const [_, [note]] = await PracticeNote.update(
				{
					text: req.body.text,
				},
				{
					where: { id: req.params.id },
					returning: true,
				}
			);

			res.json(note);
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

	router.put('/upload/:id', auth, async (req, res, next) => {
		try {
			const {
				name,
				description,
				Students,
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

			await upload.setStudents(Students.map(({ id }) => id));

			res.json({ ...upload.get({ plain: true }), Students });
		} catch (error) {
			next(error);
		}
	});

	router.put('/event/:id', auth, async (req, res, next) => {
		try {
			const [_, [event]] = await Event.update(
				pick(req.body, ['startDate', 'endDate', 'title']),
				{
					where: { id: req.params.id },
					returning: true,
				}
			);

			if (req.body.Students) {
				await event.setStudents(req.body.Students.map(({ id }) => id));
			}

			res.json({
				...event.get({ plain: true }),
				Students: req.body.Students,
			});
		} catch (error) {
			next(error);
		}
	});

	return router;
};
