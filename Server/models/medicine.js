"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Medicine extends Model {
    static associate(models) {
      if (models.PrescriptionItem) {
        Medicine.hasMany(models.PrescriptionItem, { foreignKey: "medicineId" });
      }
    }
  }

  Medicine.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Nama obat wajib diisi" },
        },
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: { args: [0], msg: "Harga obat tidak valid" },
          isInt: { msg: "Harga obat tidak valid" },
        },
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
      modelName: "Medicine",
    }
  );

  return Medicine;
};
