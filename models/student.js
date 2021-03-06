'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
	class Student extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// define association here
			this.hasMany(models.PracticeNote);
			this.hasMany(models.Upload);
			this.hasMany(models.Comment);

			this.belongsTo(models.User);

			this.belongsToMany(models.Event, {
				through: models.StudentsEvents,
			});
			this.belongsToMany(models.Upload, {
				as: 'taggedUploads',
				through: models.StudentsUploads,
			});
		}
	}
	Student.init(
		{
			id: {
				allowNull: false,
				primaryKey: true,
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
			},
			publicProfileId: {
				allowNull: false,
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
			},
			firstName: DataTypes.STRING,
			lastName: DataTypes.STRING,
			email: DataTypes.STRING,
			phoneNumber: DataTypes.STRING(10),
		},
		{
			sequelize,
			modelName: 'Student',
		}
	);
	return Student;
};
