'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
	class comment extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// define association here
			this.belongsTo(models.Student);
			this.belongsTo(models.User);
			this.belongsTo(models.Upload);
		}
	}
	comment.init(
		{
			id: {
				allowNull: false,
				primaryKey: true,
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
			},
			text: DataTypes.STRING(1000),
		},
		{
			sequelize,
			modelName: 'Comment',
		}
	);
	return comment;
};
