'use strict';

module.exports = {
	up: async (queryInterface, Sequelize) => {
		await queryInterface.addColumn(
			'Students',
			'paymentAmount',
			Sequelize.DECIMAL(10, 2)
		);
		await queryInterface.addColumn(
			'Students',
			'paymentInterval',
			Sequelize.ENUM(['weekly', 'monthly'])
		);
	},

	down: async (queryInterface, Sequelize) => {
		await queryInterface.removeColumn('Students', 'paymentAmount');
		await queryInterface.removeColumn('Students', 'paymentInterval');
	},
};
