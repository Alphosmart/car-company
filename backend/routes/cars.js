const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");
const prisma = require("../lib/prisma");
const multer = require("multer");
const { uploadBuffer } = require("../services/cloudinary");

const upload = multer({ storage: multer.memoryStorage() });

// GET /api/cars - get all cars with filters
router.get("/", async (req, res) => {
  try {
    const {
      status,
      condition,
      make,
      minPrice,
      maxPrice,
      minYear,
      maxYear,
      fuelType,
      transmission,
      featured,
      sort = "newest",
      page = 1,
      limit = 12,
    } = req.query;

    const where = {};

    if (status) where.status = status;
    if (condition) where.condition = condition;
    if (make) where.make = { contains: make, mode: "insensitive" };
    if (minPrice) where.price = { gte: parseFloat(minPrice) };
    if (maxPrice) {
      where.price = { ...where.price, lte: parseFloat(maxPrice) };
    }
    if (minYear) where.year = { gte: parseInt(minYear) };
    if (maxYear) {
      where.year = { ...where.year, lte: parseInt(maxYear) };
    }
    if (fuelType) where.fuelType = fuelType;
    if (transmission) where.transmission = transmission;
    if (featured === "true") where.featured = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orderBy =
      sort === "price_asc"
        ? { price: "asc" }
        : sort === "price_desc"
          ? { price: "desc" }
          : { createdAt: "desc" };

    const [cars, total] = await Promise.all([
      prisma.car.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy,
      }),
      prisma.car.count({ where }),
    ]);

    res.json({
      cars,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get cars error:", error);
    res.status(500).json({ error: "Failed to fetch cars" });
  }
});

// GET /api/cars/:id - get single car
router.get("/:id", async (req, res) => {
  try {
    const car = await prisma.car.findUnique({
      where: { id: req.params.id },
      include: {
        leads: {
          select: {
            id: true,
            name: true,
            phone: true,
            createdAt: true,
          },
        },
      },
    });

    if (!car) {
      return res.status(404).json({ error: "Car not found" });
    }

    res.json(car);
  } catch (error) {
    console.error("Get car error:", error);
    res.status(500).json({ error: "Failed to fetch car" });
  }
});

// POST /api/cars - create new car [admin only]
router.post("/", authMiddleware, roleCheck(["admin"]), async (req, res) => {
  try {
    const {
      make,
      model,
      year,
      price,
      mileage,
      condition,
      fuelType,
      transmission,
      color,
      description,
      featured,
    } = req.body;

    if (!make || !model || !year || !price) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const car = await prisma.car.create({
      data: {
        make,
        model,
        year: parseInt(year),
        price: parseFloat(price),
        mileage: parseInt(mileage) || 0,
        condition,
        fuelType,
        transmission,
        color,
        description,
        featured: featured === "true" || featured === true,
        photos: [],
      },
    });

    res.status(201).json(car);
  } catch (error) {
    console.error("Create car error:", error);
    res.status(500).json({ error: "Failed to create car" });
  }
});

// PATCH /api/cars/:id - update car [admin only]
router.patch("/:id", authMiddleware, roleCheck(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const car = await prisma.car.update({
      where: { id },
      data: updates,
    });

    res.json(car);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Car not found" });
    }
    console.error("Update car error:", error);
    res.status(500).json({ error: "Failed to update car" });
  }
});

// DELETE /api/cars/:id - delete car [admin only]
router.delete("/:id", authMiddleware, roleCheck(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.car.delete({
      where: { id },
    });

    res.json({ message: "Car deleted successfully" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Car not found" });
    }
    console.error("Delete car error:", error);
    res.status(500).json({ error: "Failed to delete car" });
  }
});

// POST /api/cars/:id/photos - upload photos to Cloudinary and save URLs [admin only]
router.post("/:id/photos", authMiddleware, roleCheck(["admin"]), upload.array("photos", 10), async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "At least one photo file is required" });
    }

    const uploads = await Promise.all(req.files.map((file) => uploadBuffer(file.buffer)));
    const photos = uploads.map((item) => item.secure_url);

    const car = await prisma.car.update({
      where: { id },
      data: {
        photos: {
          push: photos,
        },
      },
    });

    res.json(car);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Car not found" });
    }
    console.error("Update photos error:", error);
    res.status(500).json({ error: "Failed to update photos" });
  }
});

// PATCH /api/cars/:id/photos - replace photo order [admin only]
router.patch("/:id/photos", authMiddleware, roleCheck(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { photos } = req.body;

    if (!Array.isArray(photos) || photos.some((item) => typeof item !== "string")) {
      return res.status(400).json({ error: "photos must be an array of URLs" });
    }

    const car = await prisma.car.update({
      where: { id },
      data: { photos },
    });

    res.json(car);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Car not found" });
    }
    console.error("Reorder photos error:", error);
    res.status(500).json({ error: "Failed to reorder photos" });
  }
});

module.exports = router;
