'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
	class Announcement extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// define association here
			this.belongsTo(models.User);
		}
	}
	Announcement.init(
		{
			id: {
				allowNull: false,
				primaryKey: true,
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
			},
			text: DataTypes.STRING(50),
		},
		{
			sequelize,
			modelName: 'Announcement',
		}
	);
	return Announcement;
};
