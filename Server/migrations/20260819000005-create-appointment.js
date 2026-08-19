"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Appointments", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      patientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      doctorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Doctors",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      session: {
        type: Sequelize.ENUM("morning", "afternoon"),
        allowNull: false,
      },
      queueNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM(
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
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex(
      "Appointments",
      ["doctorId", "date", "session", "queueNumber"],
      {
        unique: true,
        name: "appointments_queue_unique",
      }
    );

    await queryInterface.addIndex(
      "Appointments",
      ["patientId", "doctorId", "date", "session"],
      {
        unique: true,
        name: "appointments_active_unique",
        where: {
          status: ["booked", "waiting", "called", "in_consultation", "completed"],
        },
      }
    );

    await queryInterface.addIndex(
      "Appointments",
      ["doctorId", "date", "session", "status"],
      {
        name: "appointments_session_status_idx",
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("Appointments");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Appointments_session";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Appointments_status";'
    );
  },
};
