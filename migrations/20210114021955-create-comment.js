'use strict';
module.exports = {
	up: async (queryInterface, Sequelize) => {
		await queryInterface.createTable('Comments', {
			id: {
				allowNull: false,
				primaryKey: true,
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
			},
			text: {
				type: Sequelize.STRING(1000),
				allowNull: false,
			},
			UploadId: {
				type: Sequelize.UUID,
				references: {
					model: 'Uploads',
					key: 'id',
				},
				allowNull: false,
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
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
			StudentId: {
				type: Sequelize.UUID,
				references: {
					model: 'Students',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'SET NULL',
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
		await queryInterface.dropTable('Comments');
	},
};
