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

	return router;
};
