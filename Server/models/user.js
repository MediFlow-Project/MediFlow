"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasOne(models.Doctor, { foreignKey: "userId" });
      User.hasMany(models.Appointment, {
        foreignKey: "patientId",
        as: "PatientAppointments",
      });
      if (models.Message) {
        User.hasMany(models.Message, { foreignKey: "senderId" });
      }
      if (models.ChatRead) {
        User.hasMany(models.ChatRead, { foreignKey: "userId" });
      }
    }

    toSafeJSON() {
      return {
        id: this.id,
        name: this.name,
        email: this.email,
        phone: this.phone,
        role: this.role,
      };
    }
  }

  User.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: "Nama wajib diisi" } },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: { msg: "Email sudah terdaftar" },
        validate: {
          isEmail: { msg: "Format email tidak valid" },
          notEmpty: { msg: "Email wajib diisi" },
        },
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
      },
      role: {
        type: DataTypes.ENUM("patient", "doctor", "admin"),
        allowNull: false,
        defaultValue: "patient",
      },
    },
    {
      sequelize,
      modelName: "User",
    }
  );

  return User;
};
