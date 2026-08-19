"use strict";

const specialtyImages = {
  Umum: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?auto=format&fit=crop&w=800&q=80",
  Gigi: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80",
  Anak: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=800&q=80",
};

const medicineImages = {
  "Paracetamol 500 mg":
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80",
  "Amoxicillin 500 mg":
    "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=400&q=80",
  "Ibuprofen 400 mg":
    "https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&w=400&q=80",
  "Cetirizine 10 mg":
    "https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=400&q=80",
  "Omeprazole 20 mg":
    "https://images.unsplash.com/photo-1587854693142-fbdc51b2763b?auto=format&fit=crop&w=400&q=80",
  "Salbutamol 2 mg":
    "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=400&q=80",
  Oralit: "https://images.unsplash.com/photo-1548839140-29a749e1cf57?auto=format&fit=crop&w=400&q=80",
  "Vitamin C 500 mg":
    "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=400&q=80",
  "Metformin 500 mg":
    "https://images.unsplash.com/photo-1576602976047-174e57a84fcf?auto=format&fit=crop&w=400&q=80",
  "Amlodipine 5 mg":
    "https://images.unsplash.com/photo-1628771065518-0d82f193856d?auto=format&fit=crop&w=400&q=80",
};

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Specialties", "imgUrl", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("Medicines", "imgUrl", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    for (const [name, imgUrl] of Object.entries(specialtyImages)) {
      await queryInterface.bulkUpdate("Specialties", { imgUrl }, { name });
    }
    for (const [name, imgUrl] of Object.entries(medicineImages)) {
      await queryInterface.bulkUpdate("Medicines", { imgUrl }, { name });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("Medicines", "imgUrl");
    await queryInterface.removeColumn("Specialties", "imgUrl");
  },
};
