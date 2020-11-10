'use strict';

module.exports = {
	up: async (queryInterface, Sequelize) => {
		return queryInterface.changeColumn('Events', 'title', {
			type: Sequelize.STRING(100),
			allowNull: true,
		});
	},

	down: async (queryInterface, Sequelize) => {
		return queryInterface.changeColumn('Events', 'title', {
			type: Sequelize.STRING(100),
			allowNull: false,
		});
	},
};
