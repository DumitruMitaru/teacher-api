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

			res.json({ ...comment.get({ plain: true }), User: user });
		} catch (error) {
			next(error);
		}
	});

	router.put('/comment/:id', auth, async (req, res, next) => {
		try {
			const [_, [editedComment]] = await Comment.update(
				{ text: req.body.text },
				{
					where: { id: req.params.id },
					returning: true,
				}
			);

			res.json(editedComment);
		} catch (error) {
			next(error);
		}
	});

	return router;
};
