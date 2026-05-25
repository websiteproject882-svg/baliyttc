import { config } from 'dotenv';
config({ path: '.env.local' });
config();
import { PrismaClient, UserRole, StaffRole, BatchStatus, RoomType, PaymentType, PostStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { STATIC_BLOG_POSTS } from '../src/data/blog';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // ─────────────────────────────────────────────
  // 1. USERS & STAFF
  // ─────────────────────────────────────────────

  // Admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@baliyttc.com' },
    update: {},
    create: {
      email: 'admin@baliyttc.com',
      displayName: 'Admin User',
      uid: 'admin-001',
      role: UserRole.ADMIN,
    },
  });

  await prisma.staff.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      role: StaffRole.SUPER_ADMIN,
      status: 'ACTIVE',
    },
  });

  const customAdminEmail = process.env.ADMIN_EMAIL;
  if (customAdminEmail && customAdminEmail.trim() !== '' && customAdminEmail.toLowerCase() !== 'admin@baliyttc.com') {
    const cleanEmail = customAdminEmail.trim().toLowerCase();
    const customAdmin = await prisma.user.upsert({
      where: { email: cleanEmail },
      update: {},
      create: {
        email: cleanEmail,
        displayName: 'Owner Admin',
        uid: `admin-${cleanEmail.split('@')[0]}`,
        role: UserRole.ADMIN,
      },
    });

    await prisma.staff.upsert({
      where: { userId: customAdmin.id },
      update: {},
      create: {
        userId: customAdmin.id,
        role: StaffRole.SUPER_ADMIN,
        status: 'ACTIVE',
      },
    });
    console.log(`✅ Custom admin user (${cleanEmail}) created in seed`);
  }

  // Test student
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@test.com' },
    update: {},
    create: {
      email: 'student@test.com',
      displayName: 'Test Student',
      uid: 'student-001',
      role: UserRole.STUDENT,
    },
  });

  await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      phone: '+1 555-0101',
      nationality: 'USA',
      yogaExperience: '1 year',
      paymentStatus: 'FULL_PAID',
      accessLevel: 'FULL',
    },
  });

  // Test teacher
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@test.com' },
    update: {},
    create: {
      email: 'teacher@test.com',
      displayName: 'Test Teacher',
      uid: 'teacher-001',
      role: UserRole.TEACHER,
    },
  });

  await prisma.staff.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      role: StaffRole.TEACHER,
      status: 'ACTIVE',
    },
  });

  console.log('✅ Users created');

  // ─────────────────────────────────────────────
  // 2. COURSES
  // ─────────────────────────────────────────────

  const course100 = await prisma.course.upsert({
    where: { slug: '100hr' },
    update: {},
    create: {
      slug: '100hr',
      name: '100-Hour Multi-Style Yoga Teacher Training',
      duration: '100 Hours | 11 Days',
      summary: 'An 11-day beginner-friendly foundation in Hatha, Ashtanga and Vinyasa practice, designed as a compact immersion or first step toward a 200-hour certification path.',
      description: 'A focused first immersion into authentic yoga for beginners and early practitioners. Students build practical foundations in asana, breathwork, philosophy, anatomy and teaching practice in Ubud, Bali.',
      priceFrom: 699,
      priceFull: 999,
      image: 'https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:1080/h:1080/q:eco/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/09/100-hour-Yoga-Teacher-Training-Vinyasa-class-in-Bali.jpg',
      isActive: true,
    },
  });

  const course200 = await prisma.course.upsert({
    where: { slug: '200hr' },
    update: {},
    create: {
      slug: '200hr',
      name: '200-Hour Hatha Ashtanga Vinyasa YTT',
      duration: '200 Hours | 21 Days',
      summary: 'A 21-day Yoga Alliance certified teacher training in Ubud for beginners and committed practitioners, covering Hatha, Ashtanga, Vinyasa, anatomy, philosophy and teaching methodology.',
      description: 'Bali YTTC complete foundation program for students who want to become confident yoga teachers through daily practice, alignment, anatomy, philosophy, pranayama, meditation and supervised teaching labs.',
      priceFrom: 1499,
      priceFull: 1899,
      image: 'https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:1080/h:1080/q:eco/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/08/200-hour-Yoga-Teacher-Training-for-Beginners.jpg',
      isActive: true,
    },
  });

  const course300 = await prisma.course.upsert({
    where: { slug: '300hr' },
    update: {},
    create: {
      slug: '300hr',
      name: '300-Hour Advanced Yoga Teacher Training',
      duration: '300 Hours | 28 Days',
      summary: 'A 28-day advanced Yoga Alliance pathway for 200-hour graduates ready to deepen practice, refine teaching, study yoga therapy and move toward RYT-500 level training.',
      description: 'An advanced training for certified 200-hour teachers covering advanced asana, sequencing, meditation, pranayama, energy body anatomy, yoga therapy foundations, deeper philosophy and teaching mentorship.',
      priceFrom: 1899,
      priceFull: 2299,
      image: 'https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:700/q:mauto/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/08/Yoga-Retreat-in-Bali.jpg',
      isActive: true,
    },
  });

  console.log('✅ Courses created');

  // ─────────────────────────────────────────────
  // 3. MODULES for 200hr Course
  // ─────────────────────────────────────────────

  const modules200 = [
    { title: 'Asana Practice', description: 'Deep dive into Hatha, Ashtanga Vinyasa, and Yin Yoga styles.' },
    { title: 'Teaching Methodology', description: 'Art of sequencing, cueing, and classroom management.' },
    { title: 'Applied Anatomy', description: 'Detailed study of physiology as it relates to yoga practice.' },
    { title: 'Pranayama & Breath', description: 'Master the art of breath control and energy management.' },
    { title: 'Yoga Philosophy', description: 'Study of Patanjali Yoga Sutras and the 8 limbs.' },
    { title: 'Ayurveda Intro', description: 'Foundations of Ayurvedic nutrition and lifestyle.' },
    { title: 'Ethics & Business', description: 'How to launch your career and teach ethically worldwide.' },
    { title: 'Hands-on Adjustments', description: 'Safe, consensual, and effective hands-on teaching.' },
  ];

  for (let i = 0; i < modules200.length; i++) {
    await prisma.module.upsert({
      where: {
        id: `module-200-${i}`,
      },
      update: {},
      create: {
        id: `module-200-${i}`,
        courseId: course200.id,
        title: modules200[i].title,
        description: modules200[i].description,
        order: i,
        hours: i < 4 ? 25 : 20,
      },
    });
  }

  console.log('✅ Modules created');

  // ─────────────────────────────────────────────
  // 4. BATCHES
  // ─────────────────────────────────────────────

  const batches = [
    {
      courseId: course100.id,
      name: 'Feb 2026 Batch',
      startDate: new Date('2026-02-05'),
      endDate: new Date('2026-02-15'),
      capacity: 20,
      enrolled: 14,
      status: BatchStatus.OPEN,
      priceRegular: 999,
      priceEarlyBird: 899,
      earlyBirdDeadline: new Date('2026-01-15'),
    },
    {
      courseId: course200.id,
      name: 'Mar 2026 Batch',
      startDate: new Date('2026-03-02'),
      endDate: new Date('2026-03-22'),
      capacity: 20,
      enrolled: 16,
      status: BatchStatus.OPEN,
      priceRegular: 1499,
      priceEarlyBird: 1299,
      earlyBirdDeadline: new Date('2026-02-01'),
    },
    {
      courseId: course200.id,
      name: 'May 2026 Batch',
      startDate: new Date('2026-05-04'),
      endDate: new Date('2026-05-24'),
      capacity: 20,
      enrolled: 8,
      status: BatchStatus.OPEN,
      priceRegular: 1499,
      priceEarlyBird: 1299,
      earlyBirdDeadline: new Date('2026-04-01'),
    },
    {
      courseId: course300.id,
      name: 'Apr 2026 Batch',
      startDate: new Date('2026-04-06'),
      endDate: new Date('2026-05-03'),
      capacity: 15,
      enrolled: 6,
      status: BatchStatus.OPEN,
      priceRegular: 1899,
      priceEarlyBird: 1699,
      earlyBirdDeadline: new Date('2026-03-01'),
    },
  ];

  for (const batch of batches) {
    await prisma.batch.upsert({
      where: { id: batch.name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: {
        id: batch.name.toLowerCase().replace(/\s+/g, '-'),
        ...batch,
      },
    });
  }

  console.log('✅ Batches created');

  // ─────────────────────────────────────────────
  // 5. ACCOMMODATION OPTIONS
  // ─────────────────────────────────────────────

  const batch200Mar = await prisma.batch.findFirst({
    where: { name: 'Mar 2026 Batch' },
  });

  if (batch200Mar) {
    await prisma.accommodation.createMany({
      data: [
        { batchId: batch200Mar.id, type: RoomType.SHARED, price: 0, mandatory: true },
        { batchId: batch200Mar.id, type: RoomType.PRIVATE, price: 400, mandatory: false },
      ],
      skipDuplicates: true,
    });
  }

  console.log('✅ Accommodation options created');

  // ─────────────────────────────────────────────
  // 6. DEMO ENROLLMENTS
  // ─────────────────────────────────────────────

  const demoEnrollments = [
    {
      name: 'Sarah Johnson',
      email: 'sarah.j@example.com',
      phone: '+1 555-0101',
      courseSlug: '200hr',
      paymentStatus: 'FULL_PAID',
      paymentType: 'FULL',
      amount: 149900,
      currency: 'USD',
      accessLevel: 'FULL',
    },
    {
      name: 'Michael Chen',
      email: 'michael.c@example.com',
      phone: '+1 555-0102',
      courseSlug: '200hr',
      paymentStatus: 'DEPOSIT_PAID',
      paymentType: 'DEPOSIT',
      amount: 30000,
      currency: 'USD',
      accessLevel: 'PRE_ARRIVAL',
    },
    {
      name: 'Emma Wilson',
      email: 'emma.w@example.com',
      phone: '+44 20-7946-0103',
      courseSlug: '100hr',
      paymentStatus: 'FULL_PAID',
      paymentType: 'FULL',
      amount: 99900,
      currency: 'USD',
      accessLevel: 'FULL',
    },
    {
      name: 'James Rodriguez',
      email: 'james.r@example.com',
      phone: '+34 91 123 4567',
      courseSlug: '200hr',
      paymentStatus: 'PENDING',
      paymentType: 'DEPOSIT',
      amount: 149900,
      currency: 'USD',
      accessLevel: 'NONE',
    },
    {
      name: 'Priya Sharma',
      email: 'priya.s@example.com',
      phone: '+91 98765 43210',
      courseSlug: '300hr',
      paymentStatus: 'FULL_PAID',
      paymentType: 'FULL',
      amount: 189900,
      currency: 'USD',
      accessLevel: 'ALUMNI',
    },
    {
      name: 'David Kim',
      email: 'david.k@example.com',
      phone: '+82 10-1234-5678',
      courseSlug: '200hr',
      paymentStatus: 'PENDING',
      paymentType: 'DEPOSIT',
      amount: 149900,
      currency: 'USD',
      accessLevel: 'NONE',
    },
    {
      name: 'Lisa Thompson',
      email: 'lisa.t@example.com',
      phone: '+61 2 9876 5432',
      courseSlug: '100hr',
      paymentStatus: 'DEPOSIT_PAID',
      paymentType: 'DEPOSIT',
      amount: 20000,
      currency: 'USD',
      accessLevel: 'PRE_ARRIVAL',
    },
    {
      name: 'Marco Rossi',
      email: 'marco.r@example.com',
      phone: '+39 06 1234567',
      courseSlug: '200hr',
      paymentStatus: 'FAILED',
      paymentType: 'FULL',
      amount: 149900,
      currency: 'USD',
      accessLevel: 'NONE',
    },
  ];

  for (const enrollment of demoEnrollments) {
    // Create demo user for enrollment
    const demoUser = await prisma.user.upsert({
      where: { email: enrollment.email },
      update: {},
      create: {
        email: enrollment.email,
        displayName: enrollment.name,
        uid: `demo-${enrollment.email.split('@')[0]}`,
        role: 'STUDENT',
      },
    });

    // Create enrollment
    await prisma.enrollment.upsert({
      where: {
        id: `enrollment-${enrollment.email.split('@')[0]}`,
      },
      update: {},
      create: {
        id: `enrollment-${enrollment.email.split('@')[0]}`,
        userId: demoUser.id,
        name: enrollment.name,
        email: enrollment.email,
        phone: enrollment.phone,
        courseSlug: enrollment.courseSlug,
        amount: enrollment.amount,
        currency: enrollment.currency,
        paymentType: enrollment.paymentType as PaymentType,
        paymentStatus: enrollment.paymentStatus as any,
        batchId: batch200Mar?.id || null,
      },
    });

    // Create student record
    const studentData: Record<string, unknown> = {
      userId: demoUser.id,
      paymentStatus: enrollment.paymentStatus,
      accessLevel: enrollment.accessLevel,
    };

    if (enrollment.accessLevel === 'FULL' || enrollment.accessLevel === 'ALUMNI') {
      studentData.completedHours = enrollment.accessLevel === 'ALUMNI' ? 200 : Math.floor(Math.random() * 100) + 50;
      studentData.totalHours = 200;
    }

    await prisma.student.upsert({
      where: { userId: demoUser.id },
      update: studentData,
      create: studentData,
    });
  }

  console.log('✅ Demo enrollments created');

  // ─────────────────────────────────────────────
  // 7. DEMO LEADS
  // ─────────────────────────────────────────────

  const demoLeads = [
    { id: 'lead-anna', name: 'Anna Mueller', email: 'anna.m@example.com', phone: '+49 30 123456', course: '200hr', status: 'NEW' },
    { id: 'lead-carlos', name: 'Carlos Garcia', email: 'carlos.g@example.com', phone: '+34 91 234 567', course: '100hr', status: 'CONTACTED' },
    { id: 'lead-yuki', name: 'Yuki Tanaka', email: 'yuki.t@example.com', phone: '+81 3 1234 5678', course: '300hr', status: 'INTERESTED' },
    { id: 'lead-sophie', name: 'Sophie Martin', email: 'sophie.m@example.com', phone: '+33 1 23 45 67', course: '200hr', status: 'ENROLLED' },
  ];

  for (const lead of demoLeads) {
    await prisma.lead.upsert({
      where: { id: lead.id },
      update: {},
      create: {
        id: lead.id,
        email: lead.email,
        name: lead.name,
        phone: lead.phone,
        course: lead.course,
        status: lead.status as any,
        source: 'Website Form',
        message: 'Interested in joining the upcoming batch.',
      },
    });
  }

  console.log('✅ Demo leads created');

  // ─────────────────────────────────────────────
  // 6. TEACHERS
  // ─────────────────────────────────────────────

  const teachers = [
    {
      name: 'Vivek Kalura',
      slug: 'vivek-kalura',
      role: 'Lead Teacher / Founder',
      credentials: 'MSc - Yogic Science',
      bio: 'Vivek leads the school with more than a decade of immersive teaching across India and Bali. His method weaves classical Hatha discipline with the fluidity of Vinyasa. He holds a Masters in Yogic Science and is dedicated to authentic lineage.',
      image: 'https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:700/q:mauto/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/08/Vivek-kalura-Yoga-teacher-in-bali.jpg',
      styles: ['Hatha', 'Philosophy', 'Pranayama'],
    },
    {
      name: 'Sachin Rautela',
      slug: 'sachin-rautela',
      role: 'Senior Teacher',
      credentials: 'E-RYT 500',
      bio: "Sachin's classes are anatomically precise yet deeply intuitive. He specialises in alignment, adjustments and safe, intelligent sequencing. He has over 500 hours of registered training and years of experience in Rishikesh and Bali.",
      image: 'https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:700/q:mauto/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/08/Sachin-Rautela-Yoga-Teacher-in-Bali.jpg',
      styles: ['Ashtanga', 'Alignment', 'Adjustments'],
    },
    {
      name: 'Mrs. Yuli',
      slug: 'yuli',
      role: 'Vinyasa & Sound Specialist',
      credentials: 'Senior Instructor',
      bio: 'A native Balinese teacher, Yuli brings the gentle spirit of the island to her classes. She is an expert in Vinyasa Flow, Yin Yoga, and is our lead Sound Healing therapist.',
      image: 'https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:700/q:mauto/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/08/Yuli-Yoga-teacher-in-bali.jpg',
      styles: ['Vinyasa', 'Yin', 'Sound Healing'],
    },
    {
      name: 'Sandeep Ji',
      slug: 'sandeep-ji',
      role: 'Philosophy Master',
      credentials: 'Masters in Yoga',
      bio: "Sandeep Ji is a profound scholar of Yoga Philosophy and Pranayama. His teachings bridge the gap between ancient texts and modern application, helping students find spiritual depth.",
      image: 'https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:700/q:mauto/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/08/Sandeep-Yoga-teacher-in-bali.jpg',
      styles: ['Philosophy', 'Meditation', 'Sanskrit'],
    },
  ];

  for (const teacher of teachers) {
    await prisma.teacher.upsert({
      where: { slug: teacher.slug },
      update: {},
      create: teacher,
    });
  }

  console.log('✅ Teachers created');

  // ─────────────────────────────────────────────
  // 7. FAQS
  // ─────────────────────────────────────────────

  const faqs = [
    {
      question: 'What is Bali Yoga Teacher Training Center?',
      answer: 'Bali YTTC is a Yoga Alliance certified school in Ubud, Bali offering 100-hour, 200-hour and 300-hour Hatha, Ashtanga and Vinyasa Flow trainings, plus retreats and workshops.',
      category: 'General',
      keywords: ['school', 'bali yttc', 'yoga school', 'training center'],
      locale: 'en',
    },
    {
      question: 'What visa do I need for Bali?',
      answer: 'For most students, a Tourist Visa (VOA) or B211A is recommended. We provide advice on which visa best suits your stay duration.',
      category: 'Visa',
      keywords: ['visa', 'indonesia', 'bali', 'passport', 'travel'],
      locale: 'en',
    },
    {
      question: 'What should I pack for the training?',
      answer: 'We provide mats, but you can bring your own. Pack comfortable yoga clothes, sunscreens, insect repellent, and an open heart for learning.',
      category: 'Preparation',
      keywords: ['pack', 'packing', 'what to bring', 'luggage'],
      locale: 'en',
    },
    {
      question: 'What accommodation is included?',
      answer: 'Comfortable shared or private villa options. Rooms include private bathrooms with hot/cold showers, high-speed Wi-Fi, air conditioning, refrigerator, kettle and hair dryer.',
      category: 'Accommodation',
      keywords: ['accommodation', 'room', 'stay', 'villa', 'housing'],
      locale: 'en',
    },
    {
      question: 'How much does the training cost?',
      answer: '100hr from $999, 200hr from $1,499, 300hr from $1,899. All prices include accommodation, meals, training, and Yoga Alliance certification.',
      category: 'Pricing',
      keywords: ['price', 'cost', 'fee', 'investment', 'how much'],
      locale: 'en',
    },
    {
      question: 'Will I get certified?',
      answer: 'Yes! Upon successful completion, you\'ll receive a Yoga Alliance RYT certificate (RYT-200, RYT-300, or RYT-500 depending on your program). This is internationally recognized.',
      category: 'Certification',
      keywords: ['certificate', 'certification', 'yoga alliance', 'ryt', 'rys'],
      locale: 'en',
    },
    {
      question: 'Do I need yoga experience?',
      answer: '100hr is designed for beginners with little to no experience. 200hr is for beginners to intermediate. 300hr requires a 200hr certification.',
      category: 'Courses',
      keywords: ['experience', 'beginner', 'never', 'first time', 'no yoga'],
      locale: 'en',
    },
    {
      question: 'How can I pay?',
      answer: 'We accept Razorpay (cards, UPI, and supported wallets), PayPal, and bank transfer. Pay a deposit (from $200) to secure your spot, with the balance due 30 days before arrival.',
      category: 'Payment',
      keywords: ['payment', 'pay', 'deposit', 'installment', 'card'],
      locale: 'en',
    },
  ];

  for (let i = 0; i < faqs.length; i++) {
    await prisma.fAQ.upsert({
      where: { id: `faq-${i}` },
      update: {},
      create: {
        id: `faq-${i}`,
        ...faqs[i],
        order: i,
      },
    });
  }

  console.log('✅ FAQs created');

  // ─────────────────────────────────────────────
  // 8. SAMPLE COUPONS
  // ─────────────────────────────────────────────

  const coupons = [
    { code: 'EARLYBIRD', discountType: 'PERCENTAGE' as const, discount: 15, minAmount: 500, maxDiscount: 200, usageLimit: 100 },
    { code: 'ALUMNI', discountType: 'PERCENTAGE' as const, discount: 10, minAmount: 500, usageLimit: 50 },
    { code: 'GROUP3', discountType: 'PERCENTAGE' as const, discount: 20, minAmount: 1000, usageLimit: 20 },
    { code: 'WELCOME500', discountType: 'FIXED' as const, discount: 500, minAmount: 1000, usageLimit: 30 },
  ];

  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {},
      create: coupon,
    });
  }

  console.log('✅ Coupons created');

  // ─────────────────────────────────────────────
  // 9. SAMPLE ENROLLMENT
  // ─────────────────────────────────────────────

  if (batch200Mar) {
    await prisma.enrollment.upsert({
      where: { id: 'sample-enrollment-1' },
      update: {},
      create: {
        id: 'sample-enrollment-1',
        userId: studentUser.id,
        studentId: (await prisma.student.findUnique({ where: { userId: studentUser.id } }))?.id,
        courseSlug: '200hr',
        batchId: batch200Mar.id,
        accommodation: RoomType.SHARED,
        name: 'Test Student',
        email: 'student@test.com',
        phone: '+1 555-0101',
        preferredDate: 'Mar 2026',
        paymentType: PaymentType.FULL,
        paymentStatus: 'FULL_PAID',
        amount: 1499,
        currency: 'USD',
        accessLevel: 'FULL',
        referralSource: 'Google',
      },
    });
  }

  console.log('✅ Sample enrollment created');

  // ─────────────────────────────────────────────
  // 10. BLOG POSTS
  // ─────────────────────────────────────────────

  const blogPosts = STATIC_BLOG_POSTS.map((post) => ({
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    featuredImage: post.featuredImage,
    category: post.category,
    tags: post.tags,
    author: post.author,
    status: PostStatus.PUBLISHED,
    publishedAt: new Date(post.publishedAt),
    locale: 'en',
    readTime: post.readTime,
    metaTitle: post.title,
    metaDescription: post.excerpt,
  }));

  for (const post of blogPosts) {
    await prisma.blogPost.upsert({
      where: { slug_locale: { slug: post.slug, locale: post.locale } },
      update: post,
      create: post,
    });
  }

  console.log('✅ Blog posts created');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
