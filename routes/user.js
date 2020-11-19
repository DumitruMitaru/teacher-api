const express = require('express');
const { pick } = require('lodash');
const { sequelize } = require('../models');
const {
	models: { User, Student, Event, StudentsEvents, Announcement, Upload },
} = sequelize;

const auth = require('../middleware/auth');

module.exports = router => {
	router.get('/user', auth, async (req, res, next) => {
		try {
			let user = await User.findOne({ where: { auth0Id: req.user.sub } });

			if (!user) {
				user = await User.create({
					auth0Id: req.user.sub,
					email: req.user.email,
				});
			}

			res.json(user);
		} catch (error) {
			next(error);
		}
	});
	return router;
};
