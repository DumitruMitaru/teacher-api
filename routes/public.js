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
	router.get('/public/student/:publicProfileId', async (req, res, next) => {
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
						include: [
							{
								model: Announcement,
								attributes: ['text', 'createdAt'],
								limit: 4,
								order: [['createdAt', 'DESC']],
							},
						],
					},
				],
				order: [[PracticeNote, 'createdAt', 'ASC']],
			});

			student = student.get({ plain: true });
			student.Announcements = student.User.Announcements;
			delete student.User.Announcements;

			res.json(student);
		} catch (error) {
			next(error);
		}
	});

	return router;
};
