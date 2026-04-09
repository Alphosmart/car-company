const prisma = require('./lib/prisma');

(async () => {
  try {
    let p = await prisma.companyProfile.findFirst();
    if (p == null) {
      p = await prisma.companyProfile.create({
        data: {
          yearsInBusiness: 8,
          carsSold: 1200,
          happyCustomers: 900,
          citiesServed: 12,
          team: [],
          heroSlides: [],
        },
      });
    }

    const data = [{
      id: 'x',
      url: 'https://example.com/a.jpg',
      mediaType: 'image',
      title: 't',
      subtitle: 's',
    }];

    const u = await prisma.companyProfile.update({
      where: { id: p.id },
      data: { heroSlides: data },
    });

    console.log('ok', Array.isArray(u.heroSlides), u.heroSlides ? u.heroSlides.length : 0);
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
