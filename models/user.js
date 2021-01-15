'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
	class User extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// define association here
			this.hasMany(models.Student);
			this.hasMany(models.Event);
			this.hasMany(models.Announcement);
			this.hasMany(models.Upload);
			this.hasMany(models.Comment);
		}
	}
	User.init(
		{
			id: {
				allowNull: false,
				primaryKey: true,
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
			},
			email: DataTypes.STRING,
			firstName: DataTypes.STRING(50),
			lastName: DataTypes.STRING(50),
			phoneNumber: DataTypes.STRING(10),
			uploadNotifications: DataTypes.BOOLEAN,
			auth0Id: DataTypes.STRING,
		},
		{
			sequelize,
			modelName: 'User',
		}
	);
	return User;
};
