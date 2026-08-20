"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Specialty extends Model {
    static associate(models) {
      Specialty.hasMany(models.Doctor, { foreignKey: "specialtyId" });
    }
  }

  Specialty.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: { msg: "Nama spesialisasi sudah ada" },
        validate: { notEmpty: { msg: "Nama spesialisasi wajib diisi" } },
      },
      description: {
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
      modelName: "Specialty",
    }
  );

  return Specialty;
};
