"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    static associate(models) {
      if (models.Appointment) {
        Message.belongsTo(models.Appointment, { foreignKey: "appointmentId" });
      }
      if (models.User) {
        Message.belongsTo(models.User, { foreignKey: "senderId" });
      }
    }
  }

  Message.init(
    {
      appointmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      senderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      body: {
        type: DataTypes.STRING(1000),
        allowNull: false,
        validate: {
          notEmpty: { msg: "Pesan tidak boleh kosong" },
          len: { args: [1, 1000], msg: "Pesan maksimal 1000 karakter" },
        },
      },
    },
    {
      sequelize,
      modelName: "Message",
      updatedAt: false,
    }
  );

  return Message;
};
