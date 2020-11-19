const { sequelize } = require('../models');
const {
	models: {
		User,
		Student,
		Event,
		StudentsEvents,
		Announcement,
		Upload,
		PracticeNote,
	},
} = sequelize;

const auth = require('../middleware/auth');

module.exports = router => {
	router.post('/practice-note', auth, async (req, res, next) => {
		try {
			const note = await PracticeNote.create(req.body);

			res.json(note);
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
	return router;
};
