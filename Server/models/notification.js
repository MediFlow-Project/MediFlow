"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    static associate(models) {
      if (models.User) {
        Notification.belongsTo(models.User, { foreignKey: "userId" });
      }
      if (models.Appointment) {
        Notification.belongsTo(models.Appointment, { foreignKey: "appointmentId" });
      }
      if (models.Invoice) {
        Notification.belongsTo(models.Invoice, { foreignKey: "invoiceId" });
      }
    }
  }

  Notification.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      message: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      href: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      appointmentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      invoiceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Notification",
    }
  );

  return Notification;
};
