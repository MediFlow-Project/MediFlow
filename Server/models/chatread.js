"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ChatRead extends Model {
    static associate(models) {
      if (models.Appointment) {
        ChatRead.belongsTo(models.Appointment, { foreignKey: "appointmentId" });
      }
      if (models.User) {
        ChatRead.belongsTo(models.User, { foreignKey: "userId" });
      }
    }
  }

  ChatRead.init(
    {
      appointmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      lastReadAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "ChatRead",
    }
  );

  return ChatRead;
};
