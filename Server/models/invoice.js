"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Invoice extends Model {
    static associate(models) {
      if (models.Appointment) {
        Invoice.belongsTo(models.Appointment, { foreignKey: "appointmentId" });
      }
    }
  }

  Invoice.init(
    {
      appointmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: { args: [0], msg: "Nominal tagihan tidak valid" },
          isInt: { msg: "Nominal tagihan tidak valid" },
        },
      },
      status: {
        type: DataTypes.ENUM("unpaid", "pending", "paid", "expire", "failed"),
        allowNull: false,
        defaultValue: "unpaid",
      },
      midtransOrderId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      snapToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Invoice",
    }
  );

  return Invoice;
};
