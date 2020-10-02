'use strict';
module.exports = {
	up: async (queryInterface, Sequelize) => {
		await queryInterface.createTable('Events', {
			id: {
				allowNull: false,
				primaryKey: true,
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
			title: {
				type: Sequelize.STRING(100),
				allowNull: false,
			},
			startDate: {
				type: Sequelize.DATE,
				allowNull: false,
			},
			endDate: {
				type: Sequelize.DATE,
			},
			isRecurring: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
			},
			allDay: {
				type: Sequelize.BOOLEAN,
			},
			startTime: {
				type: Sequelize.DATE,
			},
			endTime: {
				type: Sequelize.DATE,
			},
			rrule: {
				type: Sequelize.JSONB,
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
		await queryInterface.dropTable('Events');
	},
};
