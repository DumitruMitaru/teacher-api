'use strict';

module.exports = {
	up: async (queryInterface, Sequelize) => {
		await queryInterface.addColumn('Users', 'firstName', {
			type: Sequelize.STRING(50),
		});
		await queryInterface.addColumn('Users', 'lastName', {
			type: Sequelize.STRING(50),
		});
		await queryInterface.addColumn('Users', 'phoneNumber', {
			type: Sequelize.STRING(10),
		});
		await queryInterface.addColumn('Users', 'uploadNotifications', {
			type: Sequelize.BOOLEAN,
			defaultValue: false,
			allowNull: false,
		});
	},

	down: async (queryInterface, Sequelize) => {
		await queryInterface.removeColumn('Users', 'firstName');
		await queryInterface.removeColumn('Users', 'lastName');
		await queryInterface.removeColumn('Users', 'phoneNumber');
		await queryInterface.removeColumn('Users', 'uploadNotifications');
	},
};
