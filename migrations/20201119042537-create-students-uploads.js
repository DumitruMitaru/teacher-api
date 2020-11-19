'use strict';
module.exports = {
	up: async (queryInterface, Sequelize) => {
		await queryInterface.createTable('StudentsUploads', {
			StudentId: {
				primaryKey: true,
				type: Sequelize.UUID,
				references: {
					model: 'Students',
					key: 'id',
				},
				allowNull: false,
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			UploadId: {
				primaryKey: true,
				type: Sequelize.UUID,
				references: {
					model: 'Uploads',
					key: 'id',
				},
				allowNull: false,
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
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
		await queryInterface.dropTable('StudentsUploads');
	},
};
