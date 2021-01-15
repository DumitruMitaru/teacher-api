const { sequelize } = require('../models');
const {
	models: { Comment, User },
} = sequelize;

const auth = require('../middleware/auth');

module.exports = router => {
	router.post('/comment', auth, async (req, res, next) => {
		try {
			let user = await User.findOne({
				where: { auth0Id: req.user.sub },
			});

			const comment = await Comment.create({
				...req.body,
				UserId: user.id,
			});

			res.json(comment);
		} catch (error) {
			next(error);
		}
	});

	router.put('/comment/:id', auth, async (req, res, next) => {
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
