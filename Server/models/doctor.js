"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Doctor extends Model {
    static associate(models) {
      Doctor.belongsTo(models.User, { foreignKey: "userId" });
      Doctor.belongsTo(models.Specialty, { foreignKey: "specialtyId" });
      Doctor.hasMany(models.Schedule, { foreignKey: "doctorId" });
      Doctor.hasMany(models.Appointment, { foreignKey: "doctorId" });
    }
  }

  Doctor.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      specialtyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      consultationFee: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: { args: [0], msg: "Biaya konsultasi tidak valid" } },
      },
      bio: {
        type: DataTypes.TEXT,
      },
      imgUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isUrl: { msg: "imgUrl harus berupa URL yang valid" },
        },
      },
    },
    {
      sequelize,
      modelName: "Doctor",
    }
  );

  return Doctor;
};
