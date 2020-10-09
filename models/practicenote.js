'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
	class PracticeNote extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// define association here
			this.belongsTo(models.Student);
		}
	}
	PracticeNote.init(
		{
			id: {
				allowNull: false,
				primaryKey: true,
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
			},
			text: DataTypes.TEXT,
		},
		{
			sequelize,
			modelName: 'PracticeNote',
		}
	);
	return PracticeNote;
};
