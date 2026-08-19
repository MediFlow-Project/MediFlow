"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PrescriptionItem extends Model {
    static associate(models) {
      if (models.Consultation) {
        PrescriptionItem.belongsTo(models.Consultation, { foreignKey: "consultationId" });
      }
      if (models.Medicine) {
        PrescriptionItem.belongsTo(models.Medicine, { foreignKey: "medicineId" });
      }
    }
  }

  PrescriptionItem.init(
    {
      consultationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      medicineId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: { args: [1], msg: "Jumlah obat minimal 1" },
          isInt: { msg: "Jumlah obat tidak valid" },
        },
      },
      dosage: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Dosis wajib diisi" },
        },
      },
    },
    {
      sequelize,
      modelName: "PrescriptionItem",
    }
  );

  return PrescriptionItem;
};
