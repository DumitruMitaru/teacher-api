'use strict';
module.exports = {
	up: async (queryInterface, Sequelize) => {
		await queryInterface.createTable('Students', {
			id: {
				allowNull: false,
				primaryKey: true,
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
			},
			publicProfileId: {
				allowNull: false,
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
			},
			UserId: {
				type: Sequelize.UUID,
				references: {
					model: 'Users',
					key: 'id',
				},
				allowNull: false,
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			firstName: {
				allowNull: false,
				type: Sequelize.STRING(50),
			},
			lastName: {
				allowNull: false,
				type: Sequelize.STRING(50),
			},
			email: {
				type: Sequelize.STRING,
				validate: {
					isEmail: true,
				},
			},
			phoneNumber: {
				type: Sequelize.STRING(10),
				allowNull: false,
			},
			createdAt: {
				allowNull: false,
				type: Sequelize.DATE,
			},
			updatedAt: {
				allowNull: false,
				type: Sequelize.DATE,
			},
		});
	},
	down: async (queryInterface, Sequelize) => {
		await queryInterface.dropTable('Students');
	},
};
