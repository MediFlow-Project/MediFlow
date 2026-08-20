function createModelMock() {
  return {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
    max: jest.fn(),
    findOrCreate: jest.fn(),
  };
}

function createModelsMock() {
  return {
    sequelize: {
      transaction: jest.fn(async (fn) => fn({ LOCK: { UPDATE: "UPDATE" } })),
    },
    User: createModelMock(),
    Doctor: createModelMock(),
    Specialty: createModelMock(),
    Schedule: createModelMock(),
    Appointment: createModelMock(),
    Consultation: createModelMock(),
    PrescriptionItem: createModelMock(),
    Medicine: createModelMock(),
    Invoice: createModelMock(),
    Message: createModelMock(),
    ChatRead: createModelMock(),
    Notification: createModelMock(),
  };
}

function mockRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
}

function mockNext() {
  return jest.fn();
}

module.exports = {
  createModelMock,
  createModelsMock,
  mockRes,
  mockNext,
};
