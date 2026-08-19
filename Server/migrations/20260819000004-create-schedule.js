"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Schedules", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      doctorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Doctors",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      dayOfWeek: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      session: {
        type: Sequelize.ENUM("morning", "afternoon"),
        allowNull: false,
      },
      startTime: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      endTime: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      quota: {
        type: Sequelize.INTEGER,
        allowNull: false,
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

    await queryInterface.addIndex("Schedules", ["doctorId", "dayOfWeek", "session"], {
      unique: true,
      name: "schedules_doctor_day_session_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("Schedules");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Schedules_session";'
    );
  },
};
