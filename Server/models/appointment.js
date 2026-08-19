"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Appointment extends Model {
    static associate(models) {
      Appointment.belongsTo(models.User, {
        foreignKey: "patientId",
        as: "Patient",
      });
      Appointment.belongsTo(models.Doctor, { foreignKey: "doctorId" });
    }
  }

  Appointment.init(
    {
      patientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      doctorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      session: {
        type: DataTypes.ENUM("morning", "afternoon"),
        allowNull: false,
      },
      queueNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          "booked",
          "waiting",
          "called",
          "in_consultation",
          "completed",
          "cancelled",
          "no_show"
        ),
        allowNull: false,
        defaultValue: "booked",
      },
    },
    {
      sequelize,
      modelName: "Appointment",
    }
  );

  return Appointment;
};
