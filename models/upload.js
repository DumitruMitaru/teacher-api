'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
	class Upload extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// define association here
			this.belongsTo(models.User);
			this.belongsTo(models.Student);
			this.belongsToMany(models.Student, {
				through: models.StudentsUploads,
				as: 'taggedStudents',
			});
		}
	}
	Upload.init(
		{
			id: {
				allowNull: false,
				primaryKey: true,
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
			},
			url: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			type: {
				type: DataTypes.ENUM('video', 'audio', 'image'),
				allowNull: false,
			},
			subType: {
				type: DataTypes.STRING(100),
				allowNull: false,
			},
			name: {
				type: DataTypes.STRING(50),
				allowNull: false,
			},
			description: {
				type: DataTypes.STRING(1000),
			},
		},
		{
			sequelize,
			modelName: 'Upload',
		}
	);
	return Upload;
};
