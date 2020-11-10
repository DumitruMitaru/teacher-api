'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
	class Event extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// define association here
			this.belongsToMany(models.Student, {
				through: models.StudentsEvents,
			});
			this.belongsTo(models.User);
		}
	}
	Event.init(
		{
			id: {
				allowNull: false,
				primaryKey: true,
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
			},
			title: {
				type: DataTypes.STRING(100),
			},
			startDate: {
				type: DataTypes.DATE,
				allowNull: false,
			},
			endDate: {
				type: DataTypes.DATE,
			},
		},
		{
			sequelize,
			modelName: 'Event',
		}
	);
	return Event;
};
