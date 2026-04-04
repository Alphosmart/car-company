const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const { getDateFilterFromQuery, startOfToday } = require("../lib/dateFilters");

// GET /api/analytics/overview - dashboard totals [admin only]
router.get("/overview", async (req, res) => {
  try {
    const leadDateFilter = getDateFilterFromQuery(req.query);

    const [carsInStock, leadsToday, totalCustomers, totalPurchases] = await Promise.all([
      prisma.car.count({ where: { status: "available" } }),
      prisma.lead.count({
        where: {
          createdAt: Object.keys(leadDateFilter).length
            ? leadDateFilter
            : {
                gte: startOfToday(),
              },
        },
      }),
      prisma.customer.count(),
      prisma.purchase.count(),
    ]);

    const conversionRate =
      totalCustomers > 0 ? ((totalPurchases / totalCustomers) * 100).toFixed(2) : 0;

    res.json({
      carsInStock,
      leadsToday,
      totalCustomers,
      totalPurchases,
      conversionRate: parseFloat(conversionRate),
    });
  } catch (error) {
    console.error("Analytics overview error:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// GET /api/analytics/cars/top - most viewed/inquired cars [admin only]
router.get("/cars/top", async (req, res) => {
  try {
    const cars = await prisma.car.findMany({
      include: {
        _count: {
          select: { leads: true },
        },
      },
      orderBy: {
        leads: {
          _count: "desc",
        },
      },
      take: 10,
    });

    const topCars = cars.map((car) => ({
      ...car,
      inquiries: car._count.leads,
    }));

    res.json(topCars);
  } catch (error) {
    console.error("Top cars error:", error);
    res.status(500).json({ error: "Failed to fetch top cars" });
  }
});

// GET /api/analytics/leads/pipeline - lead count by status [admin only]
router.get("/leads/pipeline", async (req, res) => {
  try {
    const statuses = ["new", "contacted", "test_drive", "negotiating", "closed", "lost"];
    const dateFilter = getDateFilterFromQuery(req.query);

    const groupedStatuses = await prisma.lead.groupBy({
      by: ["status"],
      where: Object.keys(dateFilter).length
        ? {
            createdAt: dateFilter,
          }
        : undefined,
      _count: {
        _all: true,
      },
    });

    const statusMap = groupedStatuses.reduce((acc, item) => {
      acc[item.status] = item._count._all;
      return acc;
    }, {});

    const pipeline = statuses.map((status) => ({
      status,
      count: statusMap[status] || 0,
    }));

    res.json(pipeline);
  } catch (error) {
    console.error("Lead pipeline error:", error);
    res.status(500).json({ error: "Failed to fetch pipeline" });
  }
});

// GET /api/analytics/staff/performance - staff performance [admin only]
router.get("/staff/performance", async (req, res) => {
  try {
    const staffMembers = await prisma.staff.findMany({
      include: {
        leads: {
          select: { id: true, status: true },
        },
      },
    });

    const performance = staffMembers.map((staff) => {
      const closed = staff.leads.filter((l) => l.status === "closed").length;
      const conversionRate =
        staff.leads.length > 0 ? ((closed / staff.leads.length) * 100).toFixed(2) : 0;

      return {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        leadsAssigned: staff.leads.length,
        leadsClosed: closed,
        conversionRate: parseFloat(conversionRate),
      };
    });

    res.json(performance);
  } catch (error) {
    console.error("Staff performance error:", error);
    res.status(500).json({ error: "Failed to fetch performance" });
  }
});

// GET /api/analytics/revenue - revenue by month [admin only]
router.get("/revenue", async (req, res) => {
  try {
    const dateFilter = getDateFilterFromQuery(req.query);

    const purchases = await prisma.purchase.findMany({
      where: Object.keys(dateFilter).length
        ? {
            purchasedAt: dateFilter,
          }
        : undefined,
      select: {
        salePrice: true,
        purchasedAt: true,
      },
    });

    const revenue = {};

    purchases.forEach((purchase) => {
      const date = new Date(purchase.purchasedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!revenue[monthKey]) {
        revenue[monthKey] = 0;
      }
      revenue[monthKey] += purchase.salePrice;
    });

    const result = Object.entries(revenue)
      .map(([month, total]) => ({
        month,
        total,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    res.json(result);
  } catch (error) {
    console.error("Revenue error:", error);
    res.status(500).json({ error: "Failed to fetch revenue" });
  }
});

module.exports = router;
