"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Consultation extends Model {
    static associate(models) {
      if (models.Appointment) {
        Consultation.belongsTo(models.Appointment, { foreignKey: "appointmentId" });
      }
      if (models.PrescriptionItem) {
        Consultation.hasMany(models.PrescriptionItem, { foreignKey: "consultationId" });
      }
    }
  }

  Consultation.init(
    {
      appointmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      complaint: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      diagnosis: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Consultation",
    }
  );

  return Consultation;
};
