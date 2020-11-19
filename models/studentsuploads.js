'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
	class StudentsUploads extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// define association here
			this.belongsTo(models.Upload);
			this.belongsTo(models.Student);
		}
	}
	StudentsUploads.init(
		{
			StudentId: DataTypes.UUID,
			UploadId: DataTypes.UUID,
		},
		{
			sequelize,
			modelName: 'StudentsUploads',
		}
	);
	return StudentsUploads;
};
